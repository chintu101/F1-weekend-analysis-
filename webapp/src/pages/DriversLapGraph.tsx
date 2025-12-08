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
  ReferenceDot,
  ReferenceLine,
  Legend
} from "recharts";

type LapData = {
  lap_number: number;
  lap_time_seconds: number;
  compound: string;
  stint: number;
};

const compoundColors: Record<string, string> = {
  SOFT: "#ff2b2b",
  MEDIUM: "#ffd500",
  HARD: "#e6e6e6",
  INTERMEDIATE: "#39ff14",
  WET: "#00aaff"
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

  // csv download
  const downloadCSV = () => {
  if (laps.length === 0) return;

  const headers = [
    "Lap",
    "Sector 1 (s)",
    "Sector 2 (s)",
    "Sector 3 (s)",
    "Lap Time (s)",
    "Compound",
    "Stint"
  ];

  const rows = laps.map((lap) => [
    lap.lap_number,
    lap.sector_1 ?? "",
    lap.sector_2 ?? "",
    lap.sector_3 ?? "",
    lap.lap_time_seconds,
    lap.compound,
    lap.stint
  ]);

  const csvContent =
    [headers, ...rows]
      .map((row) => row.join(","))
      .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `${driver}_laptimes.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};


  // ✅ FASTEST LAP
  const fastestLap = useMemo(() => {
    if (laps.length === 0) return null;
    return laps.reduce((min, lap) =>
      lap.lap_time_seconds < min.lap_time_seconds ? lap : min
    );
  }, [laps]);

  // ✅ PIT STOP MARKERS
  const pitStops = useMemo(() => {
    const stops: number[] = [];
    for (let i = 1; i < laps.length; i++) {
      if (laps[i].stint !== laps[i - 1].stint) {
        stops.push(laps[i].lap_number);
      }
    }
    return stops;
  }, [laps]);

  // ✅ GROUP LAPS BY STINT (FOR COLORED LINES)
  const stints = useMemo(() => {
    const map = new Map<number, LapData[]>();

    laps.forEach((lap) => {
      if (!map.has(lap.stint)) {
        map.set(lap.stint, []);
      }
      map.get(lap.stint)!.push(lap);
    });

    return Array.from(map.entries()).map(([stint, data]) => ({
      stint,
      compound: data[0]?.compound || "UNKNOWN",
      data
    }));
  }, [laps]);

  if (loading) return <h2>Loading lap times for {driver}...</h2>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>{driver} — Lap Time Chart</h1>

      {fastestLap && (
        <h3>
          🟣 Fastest Lap: Lap {fastestLap.lap_number} —{" "}
          {fastestLap.lap_time_seconds.toFixed(3)}s
        </h3>
      )}

      <ResponsiveContainer width="100%" height={400}>
        <LineChart>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="lap_number" type="number" />
          <YAxis domain={["auto", "auto"]} />
          <Tooltip />
          <Legend />

          {/* ✅ TYRE COLORED STINT LINES */}
          {stints.map((stint) => (
            <Line
              key={stint.stint}
              data={stint.data}
              type="monotone"
              dataKey="lap_time_seconds"
              name={`Stint ${stint.stint} (${stint.compound})`}
              stroke={compoundColors[stint.compound] || "#888"}
              dot={false}
              strokeWidth={2}
            />
          ))}

          {/* ✅ FASTEST LAP DOT */}
          {fastestLap && (
            <ReferenceDot
              x={fastestLap.lap_number}
              y={fastestLap.lap_time_seconds}
              r={8}
              label="Fastest Lap"
            />
          )}

          {/* ✅ PIT STOP LINES */}
          {pitStops.map((lap, index) => (
            <ReferenceLine
              key={index}
              x={lap}
              label="Pit Stop"
              strokeDasharray="3 3"
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      {/* ✅ SECTOR TIMES TABLE */}
    
        <button
      onClick={downloadCSV}
      style={{
        marginTop: "20px",
        padding: "10px 18px",
        fontSize: "14px",
        cursor: "pointer"
      }}
    >
      ⬇ Download CSV
    </button>

    <h2 style={{ marginTop: "40px" }}>Lap Sector Times</h2>

    <div style={{ maxHeight: "400px", overflowY: "auto" }}>
    <table border={1} cellPadding={8} style={{ width: "100%" }}>
        <thead>
        <tr>
            <th>Lap</th>
            <th>S1 (s)</th>
            <th>S2 (s)</th>
            <th>S3 (s)</th>
            <th>Lap Time (s)</th>
            <th>Compound</th>
            <th>Stint</th>
        </tr>
        </thead>
        <tbody>
  {laps.map((lap, index) => {
    const prev = index > 0 ? laps[index - 1] : null;

    const s1Delta = prev ? lap.sector_1 !== null && prev.sector_1 !== null ? lap.sector_1 - prev.sector_1 : 0 : null;
    const s2Delta = prev ? lap.sector_2 !== null && prev.sector_2 !== null ? lap.sector_2 - prev.sector_2 : 0 : null;
    const s3Delta = prev ? lap.sector_3 !== null && prev.sector_3 !== null ? lap.sector_3 - prev.sector_3 : 0 : null;

    const getColor = (delta: number | null) => {
      if (delta === null) return "black";
      return delta < 0 ? "green" : delta > 0 ? "red" : "black";
    };

    return (
      <tr key={lap.lap_number}>
        <td>{lap.lap_number}</td>

        <td style={{ color: getColor(s1Delta) }}>
          {lap.sector_1?.toFixed(3) ?? "-"}
        </td>

        <td style={{ color: getColor(s2Delta) }}>
          {lap.sector_2?.toFixed(3) ?? "-"}
        </td>

        <td style={{ color: getColor(s3Delta) }}>
          {lap.sector_3?.toFixed(3) ?? "-"}
        </td>

        <td>{lap.lap_time_seconds.toFixed(3)}</td>
        <td>{lap.compound}</td>
        <td>{lap.stint}</td>
      </tr>
    );
  })}
</tbody>

    </table>
    </div>

    </div>
  );
}
