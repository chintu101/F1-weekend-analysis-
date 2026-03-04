import fastf1 as f
import pandas as pd
from datetime import datetime, timezone
import time
import os
import matplotlib.pyplot as plt
import numpy as np
from io import BytesIO
import base64

from scipy.constants import value

f.Cache.enable_cache(os.path.join(os.path.dirname(os.path.abspath(__file__)), "cache"))


def get_event_schedule_df(year):
    schedule = f.get_event_schedule(year)
    df = pd.DataFrame(schedule)
    return df


def find_latest_event():
    now_t = pd.to_datetime(time.time(), unit='s')
    print(now_t)

    #schedule_df = get_event_schedule_df(datetime.now(timezone.utc).year)
    schedule_df = get_event_schedule_df(2025) #testing in the beginning of 2026 but no races obviously lmao
    schedule_df['EventDate'] = pd.to_datetime(schedule_df['EventDate'])

    past = schedule_df[schedule_df['EventDate'] <= now_t]

    if not past.empty:
       return past.iloc[-1]
    else:
        return None

def find_event_name():
    df = find_latest_event()
    if df is None:
        return None
    session_name = df['EventName']
    return session_name

def loading_latest_session():
    session_name = find_event_name()
    #session = f.get_session(year=datetime.now(timezone.utc).year, gp=session_name, identifier='R') again in 2026, but no races yet
    session = f.get_session(year=2025, gp=session_name, identifier='R')
    session.load()
    return session

def race_results():
    session = loading_latest_session()

    if session is None:
        return []

    raw_results = session.results

    clean_rows = []
    clean_rows.append({"Session_Name": find_event_name()})

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


def rotate(xy, *, angle):
    """Rotate points around origin"""
    rot_mat = np.array([[np.cos(angle), np.sin(angle)],
                        [-np.sin(angle), np.cos(angle)]])
    return np.matmul(xy, rot_mat)


def generate_track_image():
    """Generate track layout image with sector highlighting"""
    try:
        session = loading_latest_session()
        
        if session is None:
            return None
        
        # Get the fastest lap and position data
        session.load(laps=True)
        lap = session.laps.pick_fastest()
        pos = lap.get_pos_data()
        circuit_info = session.get_circuit_info()
        
        # Create figure
        fig, ax = plt.subplots(figsize=(12, 12), dpi=100)
        fig.patch.set_facecolor('black')
        ax.set_facecolor('black')
        
        # Get track coordinates
        track = pos.loc[:, ('X', 'Y')].to_numpy()
        track_angle = circuit_info.rotation / 180 * np.pi
        rotated_track = rotate(track, angle=track_angle)
        
        # Get sector information
        sector_1_end = circuit_info.corners.iloc[0]  # First corner ends sector 1
        sector_2_end = None
        
        # Find second sector end (usually around 1/2 or 2/3 of corners)
        if len(circuit_info.corners) > 1:
            sector_2_end = circuit_info.corners.iloc[len(circuit_info.corners) // 2]
        
        # Color sectors
        sector_1_color = '#ffd500'  # Yellow
        sector_2_color = '#ff2b2b'  # Red
        sector_3_color = '#9333ea'  # Purple
        
        # Plot full track in white first
        ax.plot(rotated_track[:, 0], rotated_track[:, 1], color='white', linewidth=2.5, alpha=0.3)
        
        # Highlight sectors with different colors
        track_length = len(rotated_track)
        
        # Sector 1 - First 1/3
        sector_1_end_idx = track_length // 3
        ax.plot(rotated_track[:sector_1_end_idx, 0], rotated_track[:sector_1_end_idx, 1], 
               color=sector_1_color, linewidth=3.5, zorder=3)
        
        # Sector 2 - Middle 1/3
        sector_2_start_idx = sector_1_end_idx
        sector_2_end_idx = (track_length * 2) // 3
        ax.plot(rotated_track[sector_2_start_idx:sector_2_end_idx, 0], 
               rotated_track[sector_2_start_idx:sector_2_end_idx, 1],
               color=sector_2_color, linewidth=3.5, zorder=3)
        
        # Sector 3 - Last 1/3
        sector_3_start_idx = sector_2_end_idx
        ax.plot(rotated_track[sector_3_start_idx:, 0], rotated_track[sector_3_start_idx:, 1],
               color=sector_3_color, linewidth=3.5, zorder=3)
        
        # Plot corners with labels
        offset_vector = [500, 0]
        for _, corner in circuit_info.corners.iterrows():
            # Create corner label (number + letter if available)
            corner_num = str(int(corner['Number']))
            corner_letter = corner.get('Letter', '')
            corner_label = corner_num + corner_letter if corner_letter else corner_num
            
            offset_angle = corner['Angle'] / 180 * np.pi
            offset_x, offset_y = rotate(offset_vector, angle=offset_angle)
            
            text_x = corner['X'] + offset_x
            text_y = corner['Y'] + offset_y
            text_x, text_y = rotate([text_x, text_y], angle=track_angle)
            
            track_x, track_y = rotate([corner['X'], corner['Y']], angle=track_angle)
            
            # Draw circle marker at corner position
            ax.scatter(track_x, track_y, color='#ffffff', s=80, zorder=5, alpha=0.7)
            
            # Draw text label with corner number
            ax.text(text_x, text_y, corner_label, va='center', ha='center', 
                   fontsize=10, color='#ffffff', fontweight='bold', zorder=6, alpha=0.8)
        
        ax.set_xticks([])
        ax.set_yticks([])
        ax.axis('equal')
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
        ax.spines['bottom'].set_visible(False)
        ax.spines['left'].set_visible(False)
        
        # Convert to base64
        buffer = BytesIO()
        plt.savefig(buffer, format='png', bbox_inches='tight', facecolor='black')
        buffer.seek(0)
        image_base64 = base64.b64encode(buffer.read()).decode()
        plt.close(fig)
        
        return image_base64
    
    except Exception as e:
        print(f"❌ Error generating track image: {e}")
        import traceback
        traceback.print_exc()
        return None





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
