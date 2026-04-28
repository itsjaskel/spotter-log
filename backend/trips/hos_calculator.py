from datetime import datetime, timedelta

# HOS constants (FMCSA property-carrying, 70hr/8-day cycle)
MAX_DRIVING_HOURS = 11.0
MAX_WINDOW_HOURS = 14.0
BREAK_TRIGGER_HOURS = 8.0
BREAK_DURATION_HOURS = 0.5
MIN_OFF_DUTY_HOURS = 10.0
MAX_CYCLE_HOURS = 70.0
AVG_SPEED_MPH = 55.0
FUEL_INTERVAL_MILES = 1000.0
FUEL_STOP_HOURS = 0.5
PICKUP_HOURS = 1.0
DROPOFF_HOURS = 1.0


def calculate_trip(route: dict, current_cycle_hours: float) -> dict:
    """
    Simulates a HOS-compliant trip day by day.
    Returns a list of daily logs, each with duty status events and metadata.
    """
    segments = route["segments"]
    waypoints = route["waypoints"]

    # Build a flat list of events to process in order:
    # each event has a miles marker, type, and duration
    events = _build_events(segments, waypoints)

    logs = []
    cycle_hours = current_cycle_hours
    miles_since_fuel = 0.0
    event_index = 0
    miles_covered = 0.0

    # Each iteration represents one duty day
    while event_index < len(events):
        day_log, event_index, miles_covered, miles_since_fuel, cycle_hours = _simulate_day(
            events, event_index, miles_covered, miles_since_fuel, cycle_hours, len(logs)
        )
        logs.append(day_log)

    return {"logs": logs, "total_days": len(logs)}


def _build_events(segments: list, waypoints: list) -> list:
    """
    Converts route segments into an ordered list of events (drive, pickup, dropoff, fuel).
    Each event is processed sequentially during the HOS simulation.
    """
    events = []
    cumulative_miles = 0.0

    for i, segment in enumerate(segments):
        segment_miles = segment["distance_miles"]
        segment_start = cumulative_miles

        # Add fuel stops within this segment every FUEL_INTERVAL_MILES
        miles_into_segment = 0.0
        while miles_into_segment + FUEL_INTERVAL_MILES < segment_miles:
            miles_into_segment += FUEL_INTERVAL_MILES
            events.append({
                "type": "fuel",
                "at_mile": segment_start + miles_into_segment,
                "drive_miles_before": FUEL_INTERVAL_MILES if not events or events[-1]["type"] != "fuel"
                    else miles_into_segment - (events[-1]["at_mile"] - segment_start),
                "duration_hours": FUEL_STOP_HOURS,
                "location": f"Mile {segment_start + miles_into_segment:.0f}",
            })

        # Pickup happens at the end of the first segment (at pickup waypoint)
        if i == 0:
            events.append({
                "type": "pickup",
                "at_mile": segment_start + segment_miles,
                "duration_hours": PICKUP_HOURS,
                "location": waypoints[1]["name"],
            })

        # Dropoff happens at the end of the last segment
        if i == len(segments) - 1:
            events.append({
                "type": "dropoff",
                "at_mile": segment_start + segment_miles,
                "duration_hours": DROPOFF_HOURS,
                "location": waypoints[-1]["name"],
            })

        cumulative_miles += segment_miles

    return sorted(events, key=lambda e: e["at_mile"])


def _simulate_day(events, event_index, miles_covered, miles_since_fuel, cycle_hours, day_number):
    """
    Simulates a single duty day. Drives until HOS limits are hit, then takes 10hrs off.
    Returns the completed day log and updated state for the next day.
    """
    DAY_START_HOUR = 0.0  # all times relative to midnight of this day (hour 0-24+)
    shift_start = 0.0     # driver starts shift at midnight for simplicity
    current_time = shift_start

    driving_today = 0.0
    cumulative_driving_since_break = 0.0
    duty_entries = []

    def add_entry(status, start, end, location=""):
        if end > start:
            duty_entries.append({
                "status": status,
                "start": round(start, 4),
                "end": round(end, 4),
                "location": location,
            })

    def hours_remaining_today():
        window_remaining = (shift_start + MAX_WINDOW_HOURS) - current_time
        driving_remaining = MAX_DRIVING_HOURS - driving_today
        cycle_remaining = MAX_CYCLE_HOURS - cycle_hours
        break_driving_remaining = BREAK_TRIGGER_HOURS - cumulative_driving_since_break
        return min(window_remaining, driving_remaining, cycle_remaining, break_driving_remaining)

    # Process events one by one until we run out of HOS time for the day
    while event_index < len(events):
        event = events[event_index]
        miles_to_event = event["at_mile"] - miles_covered
        hours_to_drive = miles_to_event / AVG_SPEED_MPH

        can_drive = hours_remaining_today()

        if can_drive <= 0:
            break  # no driving time left today

        if hours_to_drive <= can_drive:
            # We can reach this event today
            drive_end = current_time + hours_to_drive
            add_entry("driving", current_time, drive_end)
            driving_today += hours_to_drive
            cumulative_driving_since_break += hours_to_drive
            cycle_hours += hours_to_drive
            miles_covered = event["at_mile"]
            miles_since_fuel += miles_to_event
            current_time = drive_end

            # Insert mandatory 30-min break if 8 hrs driving reached
            if cumulative_driving_since_break >= BREAK_TRIGGER_HOURS:
                add_entry("off_duty", current_time, current_time + BREAK_DURATION_HOURS, "Rest break")
                current_time += BREAK_DURATION_HOURS
                cumulative_driving_since_break = 0.0

            # Process the event itself (pickup, dropoff, fuel)
            event_end = current_time + event["duration_hours"]
            status = "on_duty" if event["type"] in ("pickup", "dropoff", "fuel") else "off_duty"
            add_entry(status, current_time, event_end, event["location"])
            cycle_hours += event["duration_hours"]
            current_time = event_end

            if event["type"] == "fuel":
                miles_since_fuel = 0.0

            event_index += 1
        else:
            # Drive as far as possible today
            drive_end = current_time + can_drive
            partial_miles = can_drive * AVG_SPEED_MPH
            add_entry("driving", current_time, drive_end)
            driving_today += can_drive
            cycle_hours += can_drive
            miles_covered += partial_miles
            miles_since_fuel += partial_miles
            current_time = drive_end

            # Insert break if needed mid-drive
            if cumulative_driving_since_break + can_drive >= BREAK_TRIGGER_HOURS:
                add_entry("off_duty", current_time, current_time + BREAK_DURATION_HOURS, "Rest break")
                current_time += BREAK_DURATION_HOURS
                cumulative_driving_since_break = 0.0
            else:
                cumulative_driving_since_break += can_drive

            break  # ran out of driving time before reaching next event

    # End of driving day — take mandatory 10-hr off duty
    off_start = current_time
    off_end = off_start + MIN_OFF_DUTY_HOURS
    add_entry("off_duty", off_start, off_end, "Sleeper berth / off duty")

    date = (datetime.today() + timedelta(days=day_number)).strftime("%Y-%m-%d")

    day_log = {
        "day": day_number + 1,
        "date": date,
        "entries": duty_entries,
        "total_driving_hours": round(driving_today, 2),
        "cycle_hours_used": round(cycle_hours, 2),
    }

    return day_log, event_index, miles_covered, miles_since_fuel, cycle_hours
