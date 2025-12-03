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
    session_results = session.results.to_dict(orient="records")

    clean_rows = []
    for row in session_results:
        clean_row = {}
        for col, value in row.items():
            if pd.isna(value):
                clean_row[col] = None
            else:
                clean_row[col] = str(value)
        clean_rows.append(clean_row)

    return clean_rows


#get_event_schedule_df(2021)
#print(find_latest_event())
