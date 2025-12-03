import { useParams } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceDot
} from "recharts";

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
        if (Array.isArray(data)) {
          setLaps(data);
        } else if (data.laps && Array.isArray(data.laps)) {
          setLaps(data.laps);
        } else {
          setLaps([]);
        }

        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [driver]);

  // ✅ FIND FASTEST LAP
  const fastestLap = useMemo(() => {
    if (laps.length === 0) return null;
    return laps.reduce((min, lap) =>
      lap.lap_time_seconds < min.lap_time_seconds ? lap : min
    );
  }, [laps]);

  if (loading) return <h2>Loading lap times for {driver}...</h2>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>{driver} — Lap Time Chart</h1>

      {fastestLap && (
        <h3 style={{ marginBottom: "10px" }}>
          🟣 Fastest Lap: Lap {fastestLap.lap_number} —{" "}
          {fastestLap.lap_time_seconds.toFixed(3)}s
        </h3>
      )}

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={laps}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis
            dataKey="lap_number"
            label={{ value: "Lap", position: "insideBottomRight", offset: -5 }}
          />

          <YAxis
            label={{
              value: "Lap Time (s)",
              angle: -90,
              position: "insideLeft"
            }}
            domain={["auto", "auto"]}
          />

          <Tooltip />

          <Line
            type="monotone"
            dataKey="lap_time_seconds"
            strokeWidth={2}
            dot={false}
          />

          {/* ✅ FASTEST LAP HIGHLIGHT */}
          {fastestLap && (
            <ReferenceDot
              x={fastestLap.lap_number}
              y={fastestLap.lap_time_seconds}
              r={8}
              label="Fastest Lap"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
