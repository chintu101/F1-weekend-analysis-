import fastf1 as f
import pandas as pd
from datetime import datetime, timezone
import time
import os



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
        return "No Past Events Found"


#get_event_schedule_df(2021)
#print(find_latest_event())