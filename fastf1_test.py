import math
import fastf1.plotting
import fastf1 as F
import pandas as pd
from datetime import timedelta


fastf1.Cache.enable_cache("D:\github-desktop-reps\F1-weekend-analysis-\cache")
session = F.get_session(2023, 1, "Q")
session.load()
pd.options.display.max_columns = None

def format_time_delta(td):

    total_ms = td.total_seconds() * 1000
    minutes = int(total_ms // 60000)
    seconds = int((total_ms % 60000) // 1000)
    milliseconds = int(total_ms % 1000)

    return f"{minutes:02}:{seconds:02}.{milliseconds:03}"


driver = session.get_driver('VER')
driver_laps = session.laps.pick_drivers('VER')
conditions = session.weather_data

print(driver['DriverNumber']) #driver number

td = driver_laps['LapTime'].dropna()
for i in td:
    print(format_time_delta(i))


#print(driver_laps['LapTime_str'].min()) #fastest lap of the session

print("minimum air temp for the session: ", conditions['AirTemp'].min(), "C") #minimum air temp of session
print("maximum air temp for the session: ", conditions['AirTemp'].max(), "C")
print("maximum air temp for the session: ", round(conditions['AirTemp'].mean(), 2), "C")



