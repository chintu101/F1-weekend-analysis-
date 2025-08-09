import fastf1.plotting
import fastf1 as F
import pandas as pd
fastf1.Cache.enable_cache("D:\github-desktop-reps\F1-weekend-analysis-\cache")
session = F.get_session(2023, 1, "R")
session.load()

driver = session.get_driver('VER')
driver_laps = session.laps.pick_drivers('VER')

print(driver['DriverNumber'])  #driver number
print(driver_laps['LapTime'])  #driver total laps
print(driver_laps['LapTime'].min()) #fastest lap of the session





