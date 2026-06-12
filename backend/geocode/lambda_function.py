"""
AWS Lambda handler for geocoding search.
Proxies OpenStreetMap Nominatim and returns a small, stable result shape.
"""

import json
import math
import os
import urllib.parse
import urllib.request


NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org/search"
DEFAULT_LIMIT = 5
MAX_LIMIT = 10
MELBOURNE_VIEWBOX = "144.2,-37.2,145.9,-38.55"
MELBOURNE_METRO_BOUNDS = {
    "min_lat": -38.55,
    "max_lat": -37.2,
    "min_lng": 144.2,
    "max_lng": 145.9,
}


def build_response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Access-Control-Allow-Methods": "OPTIONS,GET",
        },
        "body": json.dumps(body),
    }


def parse_limit(value):
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        return DEFAULT_LIMIT
    if parsed <= 0:
        return DEFAULT_LIMIT
    return min(parsed, MAX_LIMIT)


def parse_float(value):
    try:
        parsed = float(value)
    except (TypeError, ValueError):
        return None
    return parsed if math.isfinite(parsed) else None


def is_within_melbourne(lat, lng):
    return (
        lat is not None
        and lng is not None
        and MELBOURNE_METRO_BOUNDS["min_lat"] <= lat <= MELBOURNE_METRO_BOUNDS["max_lat"]
        and MELBOURNE_METRO_BOUNDS["min_lng"] <= lng <= MELBOURNE_METRO_BOUNDS["max_lng"]
    )


def build_nominatim_url(query, limit):
    params = urllib.parse.urlencode(
        {
            "q": query,
            "format": "jsonv2",
            "addressdetails": "1",
            "countrycodes": "au",
            "limit": str(limit),
            "viewbox": MELBOURNE_VIEWBOX,
            "bounded": "0",
        }
    )
    return f"{NOMINATIM_BASE_URL}?{params}"


def fetch_nominatim(query, limit):
    request = urllib.request.Request(
        build_nominatim_url(query, limit),
        headers={
            "Accept": "application/json",
            "User-Agent": os.getenv(
                "NOMINATIM_USER_AGENT",
                "SeniorWellbeingPlatform/1.0 (geocode-search)",
            ),
        },
    )
    with urllib.request.urlopen(request, timeout=8) as response:
        return json.loads(response.read().decode("utf-8"))


def normalize_result(item):
    lat = parse_float(item.get("lat"))
    lng = parse_float(item.get("lon"))
    if not is_within_melbourne(lat, lng):
        return None

    address = item.get("address") or {}
    name = (
        item.get("name")
        or address.get("amenity")
        or address.get("building")
        or address.get("road")
        or (item.get("display_name") or "").split(",")[0]
        or "Selected place"
    )

    return {
        "id": str(item.get("place_id") or item.get("osm_id") or ""),
        "name": name,
        "address": item.get("display_name") or name,
        "lat": lat,
        "lng": lng,
        "source": "nominatim",
        "type": item.get("type"),
        "category": item.get("category"),
    }


def lambda_handler(event, context):
    if event.get("requestContext", {}).get("http", {}).get("method") == "OPTIONS":
        return build_response(204, {})

    params = event.get("queryStringParameters") or {}
    query = (params.get("q") or params.get("query") or "").strip()
    if not query:
        return build_response(400, {"error": "q query parameter is required"})

    limit = parse_limit(params.get("limit"))

    try:
        raw_results = fetch_nominatim(f"{query} Australia", limit)
        results = [normalize_result(item) for item in raw_results]
        results = [item for item in results if item is not None]
        return build_response(200, {"results": results})
    except Exception as e:
        print("Geocode search error:", str(e))
        return build_response(502, {"error": "Address lookup failed"})
