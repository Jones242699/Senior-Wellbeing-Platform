"""
Database operations for route-adjacent facilities.
"""
import os

import psycopg2
from psycopg2.extras import RealDictCursor


conn = None


def get_connection():
    global conn

    try:
        if conn is None or conn.closed != 0:
            conn = psycopg2.connect(
                host=os.environ["DB_HOST"],
                database=os.environ["DB_NAME"],
                user=os.environ["DB_USER"],
                password=os.environ["DB_PASSWORD"],
                port=5432,
                connect_timeout=5,
            )
    except Exception as e:
        print("DB connection error:", str(e))
        raise e

    return conn


def get_facilities_near_route(route_wkt, distance_meters, limit_per_type):
    conn = get_connection()

    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            """
            WITH route AS (
                SELECT ST_GeogFromText(%s) AS geog
            )
            SELECT
                b.id,
                b.description,
                b.type,
                b.condition,
                b.latitude,
                b.longitude,
                ST_Distance(b.geom::geography, route.geog) AS distance_meters
            FROM public_benches b, route
            WHERE b.geom IS NOT NULL
              AND ST_DWithin(b.geom::geography, route.geog, %s)
            ORDER BY distance_meters
            LIMIT %s;
            """,
            (route_wkt, distance_meters, limit_per_type),
        )
        benches = cur.fetchall()

        cur.execute(
            """
            WITH route AS (
                SELECT ST_GeogFromText(%s) AS geog
            )
            SELECT
                t.id,
                t.name,
                t.female_access,
                t.male_access,
                t.wheelchair_access,
                t.operator,
                t.baby_facilities,
                t.latitude,
                t.longitude,
                ST_Distance(t.geom::geography, route.geog) AS distance_meters
            FROM public_toilets t, route
            WHERE t.geom IS NOT NULL
              AND ST_DWithin(t.geom::geography, route.geog, %s)
            ORDER BY distance_meters
            LIMIT %s;
            """,
            (route_wkt, distance_meters, limit_per_type),
        )
        toilets = cur.fetchall()

    return benches, toilets
