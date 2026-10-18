import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

type ApiRow = {
  Session_Name?: string;
  Season?: number;
  Position?: number | null;
  Driver?: string | null;
  DriverCode?: string | null;
  Team?: string | null;
  Time?: string | null;
  Points?: number | null;
};

type ResultRow = {
  Position: number | null;
  Driver: string;
  DriverCode: string;
  Team: string;
  Time: string | null;
  Points: number;
};

const teamColors = ["#d7f36a", "#ff604e", "#7ec9bd", "#e9bc73", "#b8a4e3"];

function formatTime(value: string | null) {
  if (!value) return "—";
  return value.trim().split(" ").at(-1)?.replace(/(\.\d{3})\d*/, "$1") ?? value;
}

function getTeamColor(team: string) {
  return teamColors[team.split("").reduce((sum, character) => sum + character.charCodeAt(0), 0) % teamColors.length];
}

export default function RaceDashboard() {
  const [results, setResults] = useState<ResultRow[]>([]);
  const [eventName, setEventName] = useState("Latest Grand Prix");
  const [season, setSeason] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("http://localhost:5000/")
      .then(async (response) => {
        if (!response.ok) throw new Error("Race results could not be loaded.");
        return response.json() as Promise<ApiRow[]>;
      })
      .then((payload) => {
        if (cancelled) return;
        const session = payload.find((row) => row.Session_Name);
        if (session?.Session_Name) setEventName(session.Session_Name);
        if (session?.Season) setSeason(session.Season);
        setResults(payload
          .filter((row) => row.Driver && row.DriverCode)
          .map((row) => ({
            Position: row.Position ?? null,
            Driver: row.Driver ?? "Unknown driver",
            DriverCode: row.DriverCode ?? "",
            Team: row.Team ?? "—",
            Time: row.Time ?? null,
            Points: row.Points ?? 0,
          })));
      })
      .catch((requestError: unknown) => {
        if (!cancelled) setError(requestError instanceof Error ? requestError.message : "Race results could not be loaded.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const visibleResults = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return results;
    return results.filter((row) => `${row.Driver} ${row.DriverCode} ${row.Team}`.toLowerCase().includes(normalizedQuery));
  }, [query, results]);

  const winner = results.find((row) => row.Position === 1) ?? results[0];
  const secondPlace = results.find((row) => row.Position === 2);

  const exportResults = () => {
    if (results.length === 0) return;
    const lines = [
      ["Position", "Driver", "Code", "Team", "Time", "Points"],
      ...results.map((row) => [row.Position ?? "", row.Driver, row.DriverCode, row.Team, row.Time ?? "", row.Points]),
    ].map((line) => line.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","));
    const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "race-classification.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="race-page page-frame">
      <div className="race-heading">
        <div>
          <p className="eyebrow"><span className="eyebrow-rule" /> LATEST CLASSIFICATION</p>
          <h1>{eventName}</h1>
          <p className="race-season">{season ? `${season} season` : "Race session"}<span> / </span>Race</p>
        </div>
        <Link className="outline-link" to="/track">Circuit details <span aria-hidden="true">↗</span></Link>
      </div>

      <div className="summary-grid" aria-label="Race summary">
        <article className="summary-block winner-block">
          <span className="summary-label">RACE WINNER</span>
          <strong>{loading ? "Loading" : winner?.Driver ?? "—"}</strong>
          <span className="summary-detail">{winner?.Team ?? "Classification leader"}</span>
          <span className="summary-index">01</span>
        </article>
        <article className="summary-block points-block">
          <span className="summary-label">PODIUM · P2</span>
          <strong>{loading ? "Loading" : secondPlace?.Driver ?? "—"}</strong>
          <span className="summary-detail">{secondPlace ? `${secondPlace.Team} · ${secondPlace.Points} points` : "No second-place result"}</span>
          <span className="summary-index">02</span>
        </article>
        <article className="summary-block field-block">
          <span className="summary-label">CLASSIFICATION</span>
          <strong>{loading ? "—" : String(results.length).padStart(2, "0")}</strong>
          <span className="summary-detail">drivers in results</span>
          <span className="summary-index">03</span>
        </article>
      </div>

      <nav className="dashboard-tabs" aria-label="Race data views">
        <Link className="dashboard-tab is-active" to="/">Results <span>{String(results.length).padStart(2, "0")}</span></Link>
        {winner && <Link className="dashboard-tab" to={`/driver/${winner.DriverCode}`}>Driver laps <span>↗</span></Link>}
        <Link className="dashboard-tab" to="/track">Circuit <span>↗</span></Link>
      </nav>

      <section className="classification-section" aria-labelledby="classification-title">
        <div className="section-heading">
          <div><p className="eyebrow">SESSION DATA <span className="live-dot" /></p><h2 id="classification-title">Race classification</h2></div>
          <div className="table-actions">
            <label className="search-field"><span className="search-symbol" aria-hidden="true">⌕</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find driver or team" aria-label="Find driver or team" /></label>
            <button className="export-button" type="button" onClick={exportResults} disabled={results.length === 0}>Export CSV <span aria-hidden="true">↓</span></button>
          </div>
        </div>

        {error ? (
          <div className="state-panel" role="alert"><span className="state-marker">!</span><div><strong>Results unavailable</strong><p>{error} Check that the backend is running.</p></div></div>
        ) : loading ? (
          <div className="state-panel"><span className="loading-marker" /><div><strong>Loading classification</strong><p>Connecting to the latest race session.</p></div></div>
        ) : visibleResults.length === 0 ? (
          <div className="state-panel"><span className="state-marker">—</span><div><strong>No matching drivers</strong><p>Try a different name, code, or team.</p></div></div>
        ) : (
          <div className="results-table-wrap">
            <table className="results-table">
              <thead><tr><th scope="col">POS</th><th scope="col">DRIVER</th><th scope="col">CONSTRUCTOR</th><th scope="col">TIME</th><th scope="col" className="points-column">PTS</th></tr></thead>
              <tbody>{visibleResults.map((row) => (
                <tr key={row.DriverCode}>
                  <td className="position-cell"><span className={row.Position && row.Position <= 3 ? `position-badge position-${row.Position}` : "position-badge"}>{row.Position ?? "—"}</span></td>
                  <td><Link className="driver-link" to={`/driver/${row.DriverCode}`}><span className="driver-code">{row.DriverCode}</span><span>{row.Driver}</span></Link></td>
                  <td><span className="team-name"><span className="team-marker" style={{ backgroundColor: getTeamColor(row.Team) }} />{row.Team}</span></td>
                  <td className="time-cell">{formatTime(row.Time)}</td>
                  <td className="points-column points-cell">{row.Points}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
        <div className="table-footnote"><span>FASTF1 / SESSION R</span><span>{visibleResults.length} ROWS</span></div>
      </section>
    </section>
  );
}