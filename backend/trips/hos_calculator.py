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

    events = _build_events(segments, waypoints)

    logs = []
    cycle_hours = current_cycle_hours
    miles_since_fuel = 0.0
    event_index = 0
    miles_covered = 0.0

    MAX_DAYS = 30

    while event_index < len(events) and len(logs) < MAX_DAYS:
        if cycle_hours >= MAX_CYCLE_HOURS:
            day_number = len(logs)
            date = (datetime.today() + timedelta(days=day_number)).strftime("%Y-%m-%d")
            logs.append({
                "day": day_number + 1,
                "date": date,
                "entries": [{"status": "off_duty", "start": 0.0, "end": 24.0, "location": "34-hour cycle restart"}],
                "total_driving_hours": 0.0,
                "cycle_hours_used": round(cycle_hours, 2),
            })
            cycle_hours = 0.0
            continue

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

        miles_into_segment = 0.0
        while miles_into_segment + FUEL_INTERVAL_MILES < segment_miles:
            miles_into_segment += FUEL_INTERVAL_MILES
            events.append({
                "type": "fuel",
                "at_mile": segment_start + miles_into_segment,
                "duration_hours": FUEL_STOP_HOURS,
                "location": f"Mile {segment_start + miles_into_segment:.0f}",
            })

        if i == 0:
            events.append({
                "type": "pickup",
                "at_mile": segment_start + segment_miles,
                "duration_hours": PICKUP_HOURS,
                "location": waypoints[1]["name"],
            })

        if i == len(segments) - 1:
            events.append({
                "type": "dropoff",
                "at_mile": segment_start + segment_miles,
                "duration_hours": DROPOFF_HOURS,
                "location": waypoints[-1]["name"],
            })

        cumulative_miles += segment_miles

    return sorted(events, key=lambda e: e["at_mile"])


def _hos_limit(shift_start, current_time, driving_today, cycle_hours):
    """How many hours the driver can still drive before hitting an HOS limit (not counting break)."""
    return min(
        (shift_start + MAX_WINDOW_HOURS) - current_time,
        MAX_DRIVING_HOURS - driving_today,
        MAX_CYCLE_HOURS - cycle_hours,
    )


def _simulate_day(events, event_index, miles_covered, miles_since_fuel, cycle_hours, day_number):
    """
    Simulates a single duty day. Drives until HOS limits are hit, then takes 10hrs off.
    After a 30-min break the driver continues driving up to the 11-hr / 14-hr limits.
    """
    shift_start = 0.0
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

    while event_index < len(events):
        hos_can_drive = _hos_limit(shift_start, current_time, driving_today, cycle_hours)

        if hos_can_drive <= 0:
            break  # hard HOS limit reached — end the day

        event = events[event_index]
        miles_to_event = event["at_mile"] - miles_covered
        hours_to_event = miles_to_event / AVG_SPEED_MPH

        # How far until the 30-min break is required
        until_break = BREAK_TRIGGER_HOURS - cumulative_driving_since_break

        # Effective drive capacity this stretch: break trigger or HOS limit, whichever comes first
        can_drive_now = min(until_break, hos_can_drive)

        if hours_to_event <= can_drive_now:
            # Reach the event without needing a break first
            drive_end = current_time + hours_to_event
            add_entry("driving", current_time, drive_end)
            driving_today += hours_to_event
            cumulative_driving_since_break += hours_to_event
            cycle_hours += hours_to_event
            miles_covered = event["at_mile"]
            miles_since_fuel += miles_to_event
            current_time = drive_end

            # Take break now if 8-hr trigger reached
            if cumulative_driving_since_break >= BREAK_TRIGGER_HOURS:
                add_entry("off_duty", current_time, current_time + BREAK_DURATION_HOURS, "Rest break")
                current_time += BREAK_DURATION_HOURS
                cumulative_driving_since_break = 0.0

            # Process the stop event
            event_end = current_time + event["duration_hours"]
            status = "on_duty" if event["type"] in ("pickup", "dropoff", "fuel") else "off_duty"
            add_entry(status, current_time, event_end, event["location"])
            cycle_hours += event["duration_hours"]
            current_time = event_end
            if event["type"] == "fuel":
                miles_since_fuel = 0.0

            event_index += 1

        elif can_drive_now == until_break and until_break < hos_can_drive:
            # Drive until break trigger, take the break, then continue the loop
            drive_end = current_time + until_break
            partial_miles = until_break * AVG_SPEED_MPH
            add_entry("driving", current_time, drive_end)
            driving_today += until_break
            cumulative_driving_since_break = BREAK_TRIGGER_HOURS
            cycle_hours += until_break
            miles_covered += partial_miles
            miles_since_fuel += partial_miles
            current_time = drive_end

            add_entry("off_duty", current_time, current_time + BREAK_DURATION_HOURS, "Rest break")
            current_time += BREAK_DURATION_HOURS
            cumulative_driving_since_break = 0.0
            # Do NOT break — loop continues with fresh break counter

        else:
            # HOS limit (11hr driving or 14hr window or 70hr cycle) reached before next event or break
            drive_end = current_time + hos_can_drive
            partial_miles = hos_can_drive * AVG_SPEED_MPH
            add_entry("driving", current_time, drive_end)
            driving_today += hos_can_drive
            cumulative_driving_since_break += hos_can_drive
            cycle_hours += hos_can_drive
            miles_covered += partial_miles
            miles_since_fuel += partial_miles
            current_time = drive_end
            break  # true end of driving day

    # Mandatory 10-hr off duty at end of day
    add_entry("off_duty", current_time, current_time + MIN_OFF_DUTY_HOURS, "Sleeper berth / off duty")

    date = (datetime.today() + timedelta(days=day_number)).strftime("%Y-%m-%d")

    day_log = {
        "day": day_number + 1,
        "date": date,
        "entries": duty_entries,
        "total_driving_hours": round(driving_today, 2),
        "cycle_hours_used": round(cycle_hours, 2),
    }

    return day_log, event_index, miles_covered, miles_since_fuel, cycle_hours
