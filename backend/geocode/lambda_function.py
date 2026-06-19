"""
AWS Lambda handler for geocoding search.
Proxies OpenStreetMap Nominatim and returns a small, stable result shape.
"""

import json
import math
import os
import re
import urllib.parse
import urllib.request


NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search"
NOMINATIM_REVERSE_URL = "https://nominatim.openstreetmap.org/reverse"
DEFAULT_LIMIT = 5
MAX_LIMIT = 10
MELBOURNE_VIEWBOX = "144.2,-37.2,145.9,-38.55"
MELBOURNE_METRO_BOUNDS = {
    "min_lat": -38.55,
    "max_lat": -37.2,
    "min_lng": 144.2,
    "max_lng": 145.9,
}
COMMON_MELBOURNE_TERMS = [
    "melbourne",
    "carlton",
    "docklands",
    "southbank",
    "parkville",
    "kensington",
    "flemington",
    "north",
    "south",
    "east",
    "west",
    "collins",
    "bourke",
    "swanston",
    "elizabeth",
    "flinders",
    "lonsdale",
    "latrobe",
    "exhibition",
    "spring",
    "spencer",
    "russell",
    "queen",
    "king",
    "william",
    "victoria",
    "la",
    "trobe",
    "street",
    "st",
    "road",
    "rd",
    "avenue",
    "ave",
    "parade",
]


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


def edit_distance_with_cap(left, right, cap=2):
    if left == right:
        return 0
    if abs(len(left) - len(right)) > cap:
        return cap + 1

    previous = list(range(len(right) + 1))
    for i, left_char in enumerate(left, start=1):
        current = [i]
        row_min = current[0]
        for j, right_char in enumerate(right, start=1):
            cost = 0 if left_char == right_char else 1
            value = min(
                previous[j] + 1,
                current[j - 1] + 1,
                previous[j - 1] + cost,
            )
            current.append(value)
            row_min = min(row_min, value)
        if row_min > cap:
            return cap + 1
        previous = current
    return previous[-1]


def correct_query_typos(query):
    tokens = re.findall(r"[A-Za-z]+|\d+|[^A-Za-z\d]+", query)
    corrected = []
    changed = False

    for token in tokens:
        lower = token.lower()
        if not lower.isalpha() or len(lower) < 4:
            corrected.append(token)
            continue

        best = lower
        best_distance = 3
        for term in COMMON_MELBOURNE_TERMS:
            cap = 1 if max(len(lower), len(term)) <= 7 else 2
            distance = edit_distance_with_cap(lower, term, cap)
            if distance < best_distance and distance <= cap:
                best = term
                best_distance = distance

        if best != lower:
            changed = True
            corrected.append(best.capitalize() if token[:1].isupper() else best)
        else:
            corrected.append(token)

    return "".join(corrected) if changed else query


def build_search_queries(query):
    corrected = correct_query_typos(query)
    queries = [query]
    if corrected != query:
        queries.append(corrected)
    return list(dict.fromkeys(queries))


def is_within_melbourne(lat, lng):
    return (
        lat is not None
        and lng is not None
        and MELBOURNE_METRO_BOUNDS["min_lat"] <= lat <= MELBOURNE_METRO_BOUNDS["max_lat"]
        and MELBOURNE_METRO_BOUNDS["min_lng"] <= lng <= MELBOURNE_METRO_BOUNDS["max_lng"]
    )


def build_nominatim_search_url(query, limit):
    params = urllib.parse.urlencode(
        {
            "q": query,
            "format": "jsonv2",
            "addressdetails": "1",
            "countrycodes": "au",
            "limit": str(limit),
            "viewbox": MELBOURNE_VIEWBOX,
            "bounded": "0",
            "accept-language": "en",
        }
    )
    return f"{NOMINATIM_SEARCH_URL}?{params}"


def build_nominatim_reverse_url(lat, lng):
    params = urllib.parse.urlencode(
        {
            "lat": str(lat),
            "lon": str(lng),
            "format": "jsonv2",
            "addressdetails": "1",
            "zoom": "18",
            "accept-language": "en",
        }
    )
    return f"{NOMINATIM_REVERSE_URL}?{params}"


def fetch_nominatim_search(query, limit):
    request = urllib.request.Request(
        build_nominatim_search_url(query, limit),
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


def fetch_nominatim_reverse(lat, lng):
    request = urllib.request.Request(
        build_nominatim_reverse_url(lat, lng),
        headers={
            "Accept": "application/json",
            "User-Agent": os.getenv(
                "NOMINATIM_USER_AGENT",
                "SeniorWellbeingPlatform/1.0 (geocode-reverse)",
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
    lat = parse_float(params.get("lat"))
    lng = parse_float(params.get("lng") or params.get("lon"))
    if lat is not None and lng is not None:
        if not is_within_melbourne(lat, lng):
            return build_response(200, {"results": []})

        try:
            result = normalize_result(fetch_nominatim_reverse(lat, lng))
            return build_response(200, {"results": [result] if result else []})
        except Exception as e:
            print("Reverse geocode error:", str(e))
            return build_response(502, {"error": "Address lookup failed"})

    query = (params.get("q") or params.get("query") or "").strip()
    if not query:
        return build_response(400, {"error": "q query parameter is required"})

    limit = parse_limit(params.get("limit"))

    try:
        used_query = query
        results = []
        for search_query in build_search_queries(query):
            raw_results = fetch_nominatim_search(f"{search_query} Australia", limit)
            results = [normalize_result(item) for item in raw_results]
            results = [item for item in results if item is not None]
            if results:
                used_query = search_query
                break
        return build_response(200, {"results": results, "query": used_query})
    except Exception as e:
        print("Geocode search error:", str(e))
        return build_response(502, {"error": "Address lookup failed"})
