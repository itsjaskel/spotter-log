import os
import requests

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
ORS_URL = "https://api.heigit.org/v2/directions/driving-car/geojson"
HEADERS = {"User-Agent": "SpotterLog/1.0 (jaskel.systems@gmail.com)"}
METERS_TO_MILES = 0.000621371
SECONDS_TO_HOURS = 1 / 3600


def geocode(location: str) -> dict:
    response = requests.get(
        NOMINATIM_URL,
        params={"q": location, "format": "json", "limit": 1},
        headers=HEADERS,
        timeout=10,
    )
    response.raise_for_status()
    results = response.json()
    if not results:
        raise ValueError(f"Location not found: {location}")
    result = results[0]
    return {
        "name": result.get("display_name", location),
        "lat": float(result["lat"]),
        "lon": float(result["lon"]),
    }


def get_route(waypoints: list[dict]) -> dict:
    api_key = os.environ.get("ORS_API_KEY", "")
    coords = [[p["lon"], p["lat"]] for p in waypoints]
    response = requests.post(
        ORS_URL,
        json={"coordinates": coords},
        headers={
            **HEADERS,
            "Authorization": api_key,
            "Content-Type": "application/json",
        },
        timeout=15,
    )
    response.raise_for_status()
    data = response.json()

    feature = data["features"][0]
    legs = feature["properties"]["segments"]
    geometry_coords = feature["geometry"]["coordinates"]  # [[lon, lat], ...]

    segments = []
    for i, leg in enumerate(legs):
        segments.append({
            "from": waypoints[i]["name"],
            "to": waypoints[i + 1]["name"],
            "distance_miles": round(leg["distance"] * METERS_TO_MILES, 2),
            "duration_hours": round(leg["duration"] * SECONDS_TO_HOURS, 4),
        })

    return {
        "waypoints": waypoints,
        "segments": segments,
        "total_miles": round(sum(s["distance_miles"] for s in segments), 2),
        "geometry": [[c[1], c[0]] for c in geometry_coords],  # convert to [lat, lon]
    }


def build_route(current_location: str, pickup_location: str, dropoff_location: str) -> dict:
    current = geocode(current_location)
    pickup = geocode(pickup_location)
    dropoff = geocode(dropoff_location)
    return get_route([current, pickup, dropoff])
