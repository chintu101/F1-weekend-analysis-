import fastf1 as f
import pandas as pd
from datetime import datetime, timezone
import time



f.Cache.enable_cache(r"D:\github-desktop-reps\F1-weekend-analysis-\cache")


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


def

#get_event_schedule_df(2021)
#print(find_latest_event())