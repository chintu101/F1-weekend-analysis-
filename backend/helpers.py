import fastf1 as f
import pandas as pd
from datetime import datetime, timezone
import time
import os

from scipy.constants import value

f.Cache.enable_cache(os.path.join(os.path.dirname(os.path.abspath(__file__)), "cache"))


def get_event_schedule_df(year):
    schedule = f.get_event_schedule(year)
    df = pd.DataFrame(schedule)
    return df


def find_latest_event():
    now_t = pd.to_datetime(time.time(), unit='s')
    print(now_t)

    schedule_df = get_event_schedule_df(datetime.now(timezone.utc).year)
    schedule_df['EventDate'] = pd.to_datetime(schedule_df['EventDate'])

    past = schedule_df[schedule_df['EventDate'] <= now_t]

    if not past.empty:
       return past.iloc[-1]
    else:
        return None

def loading_latest_session():
    df = find_latest_event()
    if df is None:
        return None
    session_name = df['EventName']

    session = f.get_session(year=datetime.now(timezone.utc).year, gp=session_name, identifier='R')
    session.load()
    return session

def race_results():
    session = loading_latest_session()

    if session is None:
        return []

    raw_results = session.results

    clean_rows = []

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
    session = loading_latest_session()

    if session is None:
        print("❌ Session is None")
        return []

    session.load(laps=True)
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
