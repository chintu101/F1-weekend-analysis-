import fastf1.plotting
import fastf1 as F
import pandas as pd

fastf1.Cache.disabled()
session = F.get_session(2023,1, "Q")
session.load()

driver = session.get_driver('VER')
print(driver)




