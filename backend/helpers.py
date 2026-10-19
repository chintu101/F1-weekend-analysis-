import fastf1 as f
import pandas as pd
from datetime import datetime, timezone
from functools import lru_cache
import os
from threading import RLock

f.Cache.enable_cache(os.path.join(os.path.dirname(os.path.abspath(__file__)), "cache"))

_session_lock = RLock()
_cached_sessions = {}
_cached_event_key = None


def get_event_schedule_df(year):
    schedule = f.get_event_schedule(year)
    df = pd.DataFrame(schedule)
    return df


def find_latest_event():
    event = _find_latest_event_for_date(pd.Timestamp.now(tz="UTC").date().isoformat())
    return event.copy() if event is not None else None


@lru_cache(maxsize=8)
def _find_latest_event_for_date(date_key):
    now = pd.Timestamp.now(tz="UTC")

    for year in range(now.year, 1949, -1):
        schedule_df = get_event_schedule_df(year)
        schedule_df["EventDate"] = pd.to_datetime(schedule_df["EventDate"], utc=True)
        past = schedule_df[schedule_df["EventDate"] <= now]

        if not past.empty:
            latest = past.sort_values("EventDate").iloc[-1].copy()
            latest["Season"] = year
            return latest

    return None

def find_event_name():
    df = find_latest_event()
    if df is None:
        return None
    session_name = df['EventName']
    return session_name

def loading_latest_session(load_laps=False):
    global _cached_event_key

    event = find_latest_event()
    if event is None:
        return None

    event_key = (int(event["Season"]), str(event["EventName"]), "R")
    session_key = (*event_key, load_laps)

    with _session_lock:
        if event_key != _cached_event_key:
            _cached_sessions.clear()
            _cached_event_key = event_key

        if session_key not in _cached_sessions:
            session = f.get_session(
                year=event_key[0], gp=event_key[1], identifier=event_key[2]
            )
            session.load(
                laps=load_laps,
                telemetry=False,
                weather=False,
                messages=False,
            )
            _cached_sessions[session_key] = session

        return _cached_sessions[session_key]

def race_results():
    session = loading_latest_session()

    if session is None:
        return []

    event = find_latest_event()
    raw_results = session.results

    clean_rows = []
    clean_rows.append({
        "Session_Name": event["EventName"],
        "Season": int(event["Season"]),
        "Location": event["Location"],
    })

    for _, row in raw_results.iterrows():
        clean_rows.append({
            "Position": int(row["Position"]) if not pd.isna(row["Position"]) else None,

            # FIXED DRIVER NAME
            "Driver": row.get("FullName"),
            # 3 letter code for api
            "DriverCode": row.get("Abbreviation"),

            # FIXED TEAM NAME
            "Team": row.get("TeamName")
                    or row.get("Constructor")
                    or row.get("Team"),

            # TIME AS STRING (already safe)
            "Time": str(row["Time"]) if not pd.isna(row["Time"]) else None,

            "Points": float(row["Points"]) if not pd.isna(row["Points"]) else 0
        })
    return clean_rows


def get_driver_lap_times(driver_code):
    session = loading_latest_session(load_laps=True)

    if session is None:
        print("❌ Session is None")
        return []

    laps_df = session.laps

    print("✅ Total laps in session:", len(laps_df))
    print("✅ Drivers in lap data:", laps_df["Driver"].unique())

    driver_code = driver_code.strip().upper()
    print("✅ Requested driver:", driver_code)

    driver_laps = laps_df.pick_driver(driver_code)
    print("✅ Laps found for driver:", len(driver_laps))

    clean_laps = []

    for _, lap in driver_laps.iterrows():
        lap_time = lap["LapTime"]
        if pd.isna(lap_time):
            continue

        # ✅ FORCE EVERYTHING INTO JSON-SAFE TYPES
        clean_laps.append({
            "lap_number": int(lap["LapNumber"]),

            "lap_time_seconds": float(lap_time.total_seconds()),

            # ✅ SECTOR TIMES (SAFE FLOAT OR NONE)
            "sector_1": float(lap["Sector1Time"].total_seconds())
                if not pd.isna(lap["Sector1Time"]) else None,

            "sector_2": float(lap["Sector2Time"].total_seconds())
                if not pd.isna(lap["Sector2Time"]) else None,

            "sector_3": float(lap["Sector3Time"].total_seconds())
                if not pd.isna(lap["Sector3Time"]) else None,

            # ✅ FORCE STRING, NEVER SET
            "compound": str(lap.get("Compound")),

            # ✅ FORCE INT, NEVER SET
            "stint": int(lap.get("Stint", 0))
        })

    print("✅ Clean laps returned:", len(clean_laps))
    return clean_laps





#get_event_schedule_df(2021)
#print(find_latest_event())
# =========================
# MANUAL TESTING (helpers)
# =========================

if __name__ == "__main__":
    print("\n--- TEST: get_event_schedule_df(2024) ---")
    df = get_event_schedule_df(2024)
    print(df.head())

    print("\n--- TEST: find_latest_event() ---")
    latest = find_latest_event()
    print(latest)

    print("\n--- TEST: loading_latest_session() ---")
    session = loading_latest_session()
    print(session)

    print("\n--- TEST: race_results() ---")
    results = race_results()
    print(type(results))     # should be <class 'list'>
    print(results[:2])       # print only first 2 drivers

    print("\n--- TEST: get_driver_lap_times('VER') ---")
    laps = get_driver_lap_times("VER")
    print(type(laps))        # should be <class 'list'>
    print(laps[:5])          # first 5 laps only
