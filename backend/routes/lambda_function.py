import json
import urllib.parse
import urllib.request

API_BASE_URL = "https://mk3ban19bb.execute-api.ap-southeast-2.amazonaws.com"

OSRM_ENDPOINTS = {
    "WALKING": "https://routing.openstreetmap.de/routed-foot/route/v1/foot",
    "BICYCLING": "https://routing.openstreetmap.de/routed-bike/route/v1/bike",
    "DRIVING": "https://routing.openstreetmap.de/routed-car/route/v1/driving",
    "TRANSIT": "https://routing.openstreetmap.de/routed-foot/route/v1/foot",
}


def format_distance(meters):
    meters = float(meters or 0)
    if meters < 1000:
        return {
            "text": f"{round(meters)} m",
            "value": round(meters),
        }
    km = round(meters / 1000, 1)
    return {
        "text": f"{km} km",
        "value": round(meters),
    }


def format_duration(seconds):
    seconds = float(seconds or 0)
    minutes = max(1, round(seconds / 60))
    if minutes < 60:
        text = f"{minutes} mins"
    else:
        hours = minutes // 60
        rest = minutes % 60
        text = f"{hours} hr {rest} mins" if rest else f"{hours} hr"
    return {
        "text": text,
        "value": round(seconds),
    }


def encode_polyline(points):
    result = []
    prev_lat = 0
    prev_lng = 0

    for point in points:
        lat = int(round(point["lat"] * 1e5))
        lng = int(round(point["lng"] * 1e5))
        result.append(encode_polyline_value(lat - prev_lat))
        result.append(encode_polyline_value(lng - prev_lng))
        prev_lat = lat
        prev_lng = lng

    return "".join(result)


def encode_polyline_value(value):
    value = ~(value << 1) if value < 0 else value << 1
    chunks = []
    while value >= 0x20:
        chunks.append(chr((0x20 | (value & 0x1F)) + 63))
        value >>= 5
    chunks.append(chr(value + 63))
    return "".join(chunks)


def fetch_osrm_routes(start, destination, travel_mode):
    endpoint = OSRM_ENDPOINTS.get(travel_mode.upper(), OSRM_ENDPOINTS["WALKING"])
    coords = f"{start['lng']},{start['lat']};{destination['lng']},{destination['lat']}"
    params = urllib.parse.urlencode({
        "overview": "full",
        "geometries": "geojson",
        "alternatives": "true",
        "steps": "false",
    })
    url = f"{endpoint}/{coords}?{params}"

    with urllib.request.urlopen(url, timeout=12) as response:
        payload = json.loads(response.read())

    if payload.get("code") != "Ok":
        raise RuntimeError(payload.get("message") or "No route found")

    return payload.get("routes", [])


def post_json(url, payload):
    request = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=12) as response:
        return json.loads(response.read())


def lambda_handler(event, context):
    if event.get("requestContext", {}).get("http", {}).get("method") == "OPTIONS":
        return {
            "statusCode": 204,
            "headers": cors_headers(),
            "body": "",
        }

    try:
        body = json.loads(event.get("body", "{}"))

        start = body.get("start")
        destination = body.get("destination")
        travel_mode = body.get("travelMode", "WALKING")

        if not start or not destination:
            return {
                "statusCode": 400,
                "headers": cors_headers(),
                "body": json.dumps({
                    "error": "start and destination are required"
                }),
            }

        routes = fetch_osrm_routes(start, destination, travel_mode)

        scoring_routes = []
        for route in routes:
            coordinates = route.get("geometry", {}).get("coordinates", [])
            decoded_path = [
                {"lat": lat, "lng": lng}
                for lng, lat in coordinates
            ]
            scoring_routes.append(decoded_path)

        shade_data = post_json(
            f"{API_BASE_URL}/score/shade",
            {"routes": scoring_routes},
        )

        pedestrian_data = post_json(
            f"{API_BASE_URL}/score/pedestrian",
            {"routes": scoring_routes},
        )

        shade_score_map = {
            item["id"]: item["shadeScore"]
            for item in shade_data.get("results", [])
        }

        social_score_map = {
            item["id"]: item["socialScore"]
            for item in pedestrian_data.get("results", [])
        }

        formatted_routes = []
        for idx, route in enumerate(routes):
            path = scoring_routes[idx]
            shade_score = shade_score_map.get(idx, 0)
            social_score = social_score_map.get(idx, 0)
            overall_score = round((shade_score + social_score) / 2, 2)

            formatted_routes.append({
                "id": idx,
                "summary": route.get("name") or "",
                "distance": format_distance(route.get("distance")),
                "duration": format_duration(route.get("duration")),
                "polyline": encode_polyline(path),
                "path": path,
                "shadeScore": shade_score,
                "socialScore": social_score,
                "overallScore": overall_score,
            })

        formatted_routes.sort(
            key=lambda r: r["overallScore"],
            reverse=True,
        )

        return {
            "statusCode": 200,
            "headers": cors_headers(),
            "body": json.dumps({
                "routes": formatted_routes,
                "provider": "openstreetmap-osrm",
            }),
        }

    except Exception as e:
        print("Error:", str(e))

        return {
            "statusCode": 500,
            "headers": cors_headers(),
            "body": json.dumps({
                "error": str(e)
            }),
        }


def cors_headers():
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
        "Access-Control-Allow-Methods": "OPTIONS,POST",
    }
