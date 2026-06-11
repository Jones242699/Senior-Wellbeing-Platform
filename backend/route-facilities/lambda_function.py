"""
AWS Lambda handler for facilities near a route.
Accepts a route path and returns nearby benches and public toilets from PostGIS.
"""
import json
import math

from db import get_facilities_near_route


DEFAULT_DISTANCE_METERS = 160
MAX_DISTANCE_METERS = 1000
DEFAULT_LIMIT_PER_TYPE = 60
MAX_LIMIT_PER_TYPE = 200
MAX_PATH_POINTS = 1000


def build_response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Access-Control-Allow-Methods": "OPTIONS,POST",
        },
        "body": json.dumps(body),
    }


def parse_positive_number(value, default_value, max_value):
    if value is None:
        return default_value
    try:
        parsed = float(value)
    except (TypeError, ValueError):
        return default_value
    if not math.isfinite(parsed) or parsed <= 0:
        return default_value
    return min(parsed, max_value)


def parse_positive_int(value, default_value, max_value):
    if value is None:
        return default_value
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        return default_value
    if parsed <= 0:
        return default_value
    return min(parsed, max_value)


def normalize_path(raw_path):
    if not isinstance(raw_path, list) or len(raw_path) < 2:
        raise ValueError("path must contain at least two points")
    if len(raw_path) > MAX_PATH_POINTS:
        raise ValueError(f"path cannot exceed {MAX_PATH_POINTS} points")

    points = []
    for item in raw_path:
        if not isinstance(item, dict):
            raise ValueError("each path point must be an object with lat and lng")
        lat = float(item.get("lat"))
        lng = float(item.get("lng"))
        if not math.isfinite(lat) or not math.isfinite(lng):
            raise ValueError("path points must contain finite lat/lng values")
        if lat < -90 or lat > 90 or lng < -180 or lng > 180:
            raise ValueError("path points contain coordinates outside valid ranges")
        points.append({"lat": lat, "lng": lng})

    return points


def route_wkt_from_path(path):
    coords = ", ".join(f"{point['lng']} {point['lat']}" for point in path)
    return f"SRID=4326;LINESTRING({coords})"


def normalize_bench(row):
    return {
        "id": int(row["id"]) if row.get("id") is not None else None,
        "description": row.get("description"),
        "type": row.get("type"),
        "condition": float(row["condition"]) if row.get("condition") is not None else None,
        "latitude": float(row["latitude"]),
        "longitude": float(row["longitude"]),
        "distance_meters": round(float(row["distance_meters"]), 1),
    }


def normalize_toilet(row):
    return {
        "id": int(row["id"]) if row.get("id") is not None else None,
        "name": row.get("name"),
        "female_access": row.get("female_access"),
        "male_access": row.get("male_access"),
        "wheelchair_access": row.get("wheelchair_access"),
        "operator": row.get("operator"),
        "baby_facilities": row.get("baby_facilities"),
        "latitude": float(row["latitude"]),
        "longitude": float(row["longitude"]),
        "distance_meters": round(float(row["distance_meters"]), 1),
    }


def lambda_handler(event, context):
    if event.get("requestContext", {}).get("http", {}).get("method") == "OPTIONS":
        return build_response(204, {})

    try:
        body = json.loads(event.get("body") or "{}")
        path = normalize_path(body.get("path"))
        distance_meters = parse_positive_number(
            body.get("distanceMeters"),
            DEFAULT_DISTANCE_METERS,
            MAX_DISTANCE_METERS,
        )
        limit_per_type = parse_positive_int(
            body.get("limitPerType"),
            DEFAULT_LIMIT_PER_TYPE,
            MAX_LIMIT_PER_TYPE,
        )

        benches, toilets = get_facilities_near_route(
            route_wkt_from_path(path),
            distance_meters,
            limit_per_type,
        )

        normalized_benches = [normalize_bench(row) for row in benches]
        normalized_toilets = [normalize_toilet(row) for row in toilets]

        return build_response(
            200,
            {
                "status": "success",
                "distanceMeters": distance_meters,
                "counts": {
                    "benches": len(normalized_benches),
                    "toilets": len(normalized_toilets),
                },
                "benches": normalized_benches,
                "toilets": normalized_toilets,
            },
        )

    except ValueError as e:
        return build_response(400, {"error": str(e)})
    except Exception as e:
        print("Route facilities error:", str(e))
        return build_response(500, {"error": "Internal server error"})
