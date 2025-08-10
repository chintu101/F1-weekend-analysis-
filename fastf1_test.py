import fastf1.plotting
import fastf1 as F
import pandas as pd


fastf1.Cache.enable_cache("D:\github-desktop-reps\F1-weekend-analysis-\cache")
session = F.get_session(2023, 1, "R")
session.load()
pd.options.display.max_columns = None

driver = session.get_driver('VER')
driver_laps = session.laps.pick_drivers('VER')
conditions = session.weather_data

print(driver['DriverNumber']) #driver number

print(driver_laps['LapTime'])


#print(driver_laps['LapTime_str'].min()) #fastest lap of the session

print("minimum air temp for the session: ", conditions['AirTemp'].min(), "C") #minimum air temp of session
print("maximum air temp for the session: ", conditions['AirTemp'].max(), "C")
print("maximum air temp for the session: ", round(conditions['AirTemp'].mean(), 2), "C")


