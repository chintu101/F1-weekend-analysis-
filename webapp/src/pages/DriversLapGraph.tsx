import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

type LapData = {
  lap_number: number;
  lap_time_seconds: number;
  compound: string;
  stint: number;
};

export default function DriverLapGraph() {
  const { driver } = useParams();
  const [laps, setLaps] = useState<LapData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!driver) return;

    fetch(`http://localhost:5000/api/laptimes/${driver}`)
      .then((res) => res.json())
      .then((data) => {
        console.log("✅ FULL API RESPONSE:", data);

        // ✅ GUARANTEED SAFE HANDLING
        if (Array.isArray(data)) {
          setLaps(data);
        } else if (data.laps && Array.isArray(data.laps)) {
          setLaps(data.laps);
        } else {
          setLaps([]);
        }

        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ Fetch error:", err);
        setLoading(false);
      });
  }, [driver]);

  if (loading) return <h2>Loading lap times for {driver}...</h2>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>{driver} — Lap Times</h1>

      {laps.length === 0 ? (
        <p style={{ color: "red" }}>No lap data available.</p>
      ) : (
        <table border={1} cellPadding={8} style={{ marginTop: "20px" }}>
          <thead>
            <tr>
              <th>Lap</th>
              <th>Lap Time (s)</th>
              <th>Compound</th>
              <th>Stint</th>
            </tr>
          </thead>
          <tbody>
            {laps.map((lap, index) => (
              <tr key={index}>
                <td>{lap.lap_number}</td>
                <td>{lap.lap_time_seconds.toFixed(3)}</td>
                <td>{lap.compound}</td>
                <td>{lap.stint}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
