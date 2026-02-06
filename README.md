# F1-weekend-analysis-

Formula 1 Telemetry Analytics Web Application

A full-stack motorsport analytics platform that visualizes Formula 1 race data using official telemetry from the FastF1 library.
The application enables detailed driver performance analysis through interactive charts, sector breakdowns, pit strategy insights, and exportable datasets.

Features
-Live Race Results Dashboard
-Displays race classification with driver photos, team names, and finishing status.
-Driver Telemetry Analysis
-Interactive lap-time graph with:
-Fastest lap detection
-Pit stop markers
-Tyre compound & stint visualization
-Sector Performance Table
-Sector 1 / 2 / 3 breakdown for each lap
-Delta coloring (green = faster, red = slower vs previous lap)
-CSV Export
-Download full telemetry dataset for offline analysis and reporting
-Session Support
-Race session data via FastF1
-Designed for easy extension to Qualifying and Practice sessions
-Optimized Data Pipeline
-FastF1 caching reduces repeated telemetry fetch latency by ~60–80%



pip install -r requirements.txt

currently it not working because of testing and etc etc. hardcoded to show abu dhabi at the moment.
