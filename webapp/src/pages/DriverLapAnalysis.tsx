import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CartesianGrid, Legend, Line, LineChart, ReferenceDot, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type LapData = {
  lap_number: number;
  lap_time_seconds: number;
  sector_1: number | null;
  sector_2: number | null;
  sector_3: number | null;
  compound: string;
  stint: number;
};

type LapResponse = LapData[] | { laps: LapData[]; error?: string };

const compoundColors: Record<string, string> = {
  SOFT: "#ff604e", MEDIUM: "#e9bc73", HARD: "#d9ded8", INTERMEDIATE: "#7ec9bd", WET: "#83a9db",
};

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = (seconds % 60).toFixed(3);
  return `${minutes}:${Number(remainder) < 10 ? "0" : ""}${remainder}`;
}

export default function DriverLapAnalysis() {
  const { driver } = useParams();
  const [laps, setLaps] = useState<LapData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!driver) {
      setError("No driver was selected.");
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`http://localhost:5000/api/laptimes/${driver}`)
      .then(async (response) => {
        const payload = await response.json() as LapResponse;
        if (!response.ok) throw new Error("error" in payload && payload.error ? payload.error : "Lap times could not be loaded.");
        return payload;
      })
      .then((payload) => { if (!cancelled) setLaps(Array.isArray(payload) ? payload : payload.laps); })
      .catch((requestError: unknown) => {
        if (!cancelled) setError(requestError instanceof Error ? requestError.message : "Lap times could not be loaded.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [driver]);

  const fastestLap = useMemo(() => laps.reduce<LapData | null>((fastest, lap) => !fastest || lap.lap_time_seconds < fastest.lap_time_seconds ? lap : fastest, null), [laps]);
  const stints = useMemo(() => {
    const grouped = new Map<number, LapData[]>();
    laps.forEach((lap) => grouped.set(lap.stint, [...(grouped.get(lap.stint) ?? []), lap]));
    return Array.from(grouped, ([stint, data]) => ({ stint, data, compound: data[0]?.compound ?? "UNKNOWN" }));
  }, [laps]);
  const pitStops = useMemo(() => laps.slice(1).filter((lap, index) => lap.stint !== laps[index].stint).map((lap) => lap.lap_number), [laps]);

  const exportCsv = () => {
    if (!laps.length) return;
    const header = ["Lap", "Lap time (s)", "Sector 1 (s)", "Sector 2 (s)", "Sector 3 (s)", "Compound", "Stint"];
    const rows = laps.map((lap) => [lap.lap_number, lap.lap_time_seconds, lap.sector_1 ?? "", lap.sector_2 ?? "", lap.sector_3 ?? "", lap.compound, lap.stint]);
    const csv = [header, ...rows].map((row) => row.join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${driver ?? "driver"}-lap-times.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="detail-page page-frame">
      <Link className="back-link" to="/">← Race classification</Link>
      <div className="detail-heading"><div><p className="eyebrow"><span className="eyebrow-rule" /> DRIVER ANALYSIS</p><h1>{driver ?? "Driver"}<span> / LAP TIMES</span></h1></div><button className="export-button" type="button" onClick={exportCsv} disabled={!laps.length}>Export CSV <span aria-hidden="true">↓</span></button></div>
      {loading ? (
        <div className="state-panel"><span className="loading-marker" /><div><strong>Loading lap data</strong><p>Requesting the selected driver’s race laps.</p></div></div>
      ) : error || laps.length === 0 ? (
        <div className="state-panel" role={error ? "alert" : undefined}><span className="state-marker">!</span><div><strong>Lap data unavailable</strong><p>{error ?? "No lap-time records were returned for this driver and session."}</p><Link className="inline-link" to="/">Return to race results</Link></div></div>
      ) : (
        <>
          <div className="lap-stat-grid">
            <article className="lap-stat"><span>FASTEST LAP</span><strong>{fastestLap ? formatTime(fastestLap.lap_time_seconds) : "—"}</strong><small>{fastestLap ? `Lap ${fastestLap.lap_number}` : "No timed laps"}</small></article>
            <article className="lap-stat"><span>TIMED LAPS</span><strong>{laps.length}</strong><small>Race session</small></article>
            <article className="lap-stat"><span>STINTS</span><strong>{stints.length}</strong><small>Tyre runs</small></article>
          </div>
          <section className="chart-panel" aria-label="Lap time chart">
            <div className="section-heading"><div><p className="eyebrow">PACE TRACE</p><h2>Lap time by stint</h2></div><span className="chart-unit">LAP TIME / SECONDS</span></div>
            <div className="chart-frame"><ResponsiveContainer width="100%" height="100%"><LineChart margin={{ top: 14, right: 14, bottom: 4, left: -12 }}>
              <CartesianGrid stroke="#2d3530" strokeDasharray="2 5" vertical={false} />
              <XAxis dataKey="lap_number" type="number" tick={{ fill: "#a2aca5", fontSize: 11 }} axisLine={{ stroke: "#414a44" }} tickLine={false} />
              <YAxis domain={["auto", "auto"]} tick={{ fill: "#a2aca5", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: "#171d19", border: "1px solid #424b44", borderRadius: 4, color: "#f1f3ee" }} />
              <Legend />
              {stints.map((stint) => <Line key={stint.stint} data={stint.data} type="monotone" dataKey="lap_time_seconds" name={`Stint ${stint.stint} · ${stint.compound}`} stroke={compoundColors[stint.compound] ?? "#d7f36a"} dot={false} strokeWidth={2} activeDot={{ r: 4 }} />)}
              {fastestLap && <ReferenceDot x={fastestLap.lap_number} y={fastestLap.lap_time_seconds} r={5} fill="#d7f36a" stroke="#101512" strokeWidth={2} />}
              {pitStops.map((lap) => <ReferenceLine key={lap} x={lap} stroke="#727c74" strokeDasharray="3 4" />)}
            </LineChart></ResponsiveContainer></div>
          </section>
          <section className="classification-section sector-section">
            <div className="section-heading"><div><p className="eyebrow">DETAILED TIMING</p><h2>Sector breakdown</h2></div></div>
            <div className="results-table-wrap"><table className="results-table sector-table">
              <thead><tr><th scope="col">LAP</th><th scope="col">S1 / SEC</th><th scope="col">S2 / SEC</th><th scope="col">S3 / SEC</th><th scope="col">LAP TIME</th><th scope="col">TYRE</th><th scope="col">STINT</th></tr></thead>
              <tbody>{laps.map((lap) => <tr key={lap.lap_number}><td className="position-cell">{lap.lap_number}</td><td className="time-cell">{lap.sector_1?.toFixed(3) ?? "—"}</td><td className="time-cell">{lap.sector_2?.toFixed(3) ?? "—"}</td><td className="time-cell">{lap.sector_3?.toFixed(3) ?? "—"}</td><td className="time-cell lap-time-cell">{formatTime(lap.lap_time_seconds)}</td><td>{lap.compound}</td><td>{lap.stint}</td></tr>)}</tbody>
            </table></div>
          </section>
        </>
      )}
    </section>
  );
}