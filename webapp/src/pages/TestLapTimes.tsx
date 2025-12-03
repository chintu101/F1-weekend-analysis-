import { useEffect, useState } from "react";

export default function TestLapTimes() {
  const [laps, setLaps] = useState<any[]>([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/laptimes/VER")
      .then(res => res.json())
      .then(data => setLaps(data.laps));
  }, []);

  return (
    <div>
      <h1>VER Lap Times (TEST)</h1>
      <ul>
        {laps.slice(0, 10).map((lap, i) => (
          <li key={i}>
            Lap {lap.lap_number} → {lap.lap_time_seconds}s
          </li>
        ))}
      </ul>
    </div>
  );
}

