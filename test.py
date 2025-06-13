import fastf1
import matplotlib.pyplot as plt
import datetime

today = datetime.datetime.now()
curr_year = today.year

for year in range(curr_year, 2024, -1):
    schedule = fastf1.get_event_schedule(year=year)
    

event_name = latest_event['EventName']

