import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

type EventSummary = {
  EventName: string;
  Season: number;
  Location: string;
};

type ApiRow = {
  Session_Name?: string;
  Season?: number;
  Location?: string;
  Position?: number | null;
};

type CircuitFeature = {
  properties: {
    Location: string;
    Name: string;
    length?: number;
    altitude?: number;
  };
  geometry: {
    type: "LineString";
    coordinates: [number, number][];
  };
};

type CircuitCollection = {
  features: CircuitFeature[];
};

type Point = { x: number; y: number };

type SectorPath = {
  name: string;
  color: string;
  path: string;
  middle: Point;
};

const VIEW_WIDTH = 1000;
const VIEW_HEIGHT = 560;
const COLORS = ["#d7f36a", "#ff604e", "#7ec9bd"];

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function getCircuit(event: EventSummary, collection: CircuitCollection) {
  const eventLocation = normalize(event.Location);
  const eventName = normalize(event.EventName);
  return collection.features.find((feature) => {
    const location = normalize(feature.properties.Location);
    const circuitName = normalize(feature.properties.Name.replace(/\bcircuit\b/gi, ""));
    return location === eventLocation
      || normalize(feature.properties.Name).includes(eventLocation)
      || eventName.includes(location)
      || eventName.includes(circuitName);
  });
}

function projectCoordinates(coordinates: [number, number][]): Point[] {
  const meanLatitude = coordinates.reduce((sum, point) => sum + point[1], 0) / coordinates.length * Math.PI / 180;
  const projected = coordinates.map(([longitude, latitude]) => ({
    x: longitude * Math.cos(meanLatitude),
    y: -latitude,
  }));
  const minX = Math.min(...projected.map((point) => point.x));
  const maxX = Math.max(...projected.map((point) => point.x));
  const minY = Math.min(...projected.map((point) => point.y));
  const maxY = Math.max(...projected.map((point) => point.y));
  const padding = 40;
  const scale = Math.min(
    (VIEW_WIDTH - padding * 2) / (maxX - minX),
    (VIEW_HEIGHT - padding * 2) / (maxY - minY),
  );
  const offsetX = (VIEW_WIDTH - (maxX - minX) * scale) / 2;
  const offsetY = (VIEW_HEIGHT - (maxY - minY) * scale) / 2;

  return projected.map((point) => ({
    x: offsetX + (point.x - minX) * scale,
    y: offsetY + (point.y - minY) * scale,
  }));
}

function pointAtDistance(points: Point[], cumulative: number[], target: number): Point {
  const index = cumulative.findIndex((distance) => distance >= target);
  if (index <= 0) return points[0];
  const previousDistance = cumulative[index - 1];
  const segmentLength = cumulative[index] - previousDistance;
  const ratio = segmentLength === 0 ? 0 : (target - previousDistance) / segmentLength;
  return {
    x: points[index - 1].x + (points[index].x - points[index - 1].x) * ratio,
    y: points[index - 1].y + (points[index].y - points[index - 1].y) * ratio,
  };
}

function buildSectorPaths(coordinates: [number, number][]): SectorPath[] {
  const points = projectCoordinates(coordinates);
  const cumulative = [0];
  for (let index = 1; index < points.length; index += 1) {
    cumulative.push(cumulative[index - 1] + Math.hypot(
      points[index].x - points[index - 1].x,
      points[index].y - points[index - 1].y,
    ));
  }

  const totalDistance = cumulative[cumulative.length - 1];
  return [0, 1, 2].map((sectorIndex) => {
    const start = totalDistance * sectorIndex / 3;
    const end = totalDistance * (sectorIndex + 1) / 3;
    const sectorPoints = [pointAtDistance(points, cumulative, start)];
    cumulative.forEach((distance, index) => {
      if (distance > start && distance < end) sectorPoints.push(points[index]);
    });
    sectorPoints.push(pointAtDistance(points, cumulative, end));
    const path = sectorPoints.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(" ");
    return {
      name: `Sector ${sectorIndex + 1}`,
      color: COLORS[sectorIndex],
      path,
      middle: pointAtDistance(points, cumulative, (start + end) / 2),
    };
  });
}

export default function TrackLayout() {
  const [event, setEvent] = useState<EventSummary | null>(null);
  const [collection, setCollection] = useState<CircuitCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("http://localhost:5000/").then(async (response) => {
        if (!response.ok) throw new Error("Latest race details could not be loaded.");
        return response.json() as Promise<ApiRow[]>;
      }),
      fetch("/f1-circuits.geojson").then(async (response) => {
        if (!response.ok) throw new Error("Circuit geometry could not be loaded.");
        return response.json() as Promise<CircuitCollection>;
      }),
    ])
      .then(([rows, circuitData]) => {
        if (cancelled) return;
        const summary = rows.find((row) => Boolean(row.Session_Name && row.Location && row.Season));
        if (!summary) throw new Error("The race response did not include a circuit location.");
        setEvent({
          EventName: summary.Session_Name!,
          Season: summary.Season!,
          Location: summary.Location!,
        });
        setCollection(circuitData);
      })
      .catch((requestError: unknown) => {
        if (!cancelled) setError(requestError instanceof Error ? requestError.message : "Circuit layout could not be loaded.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const feature = useMemo(() => event && collection ? getCircuit(event, collection) : undefined, [event, collection]);
  const sectors = useMemo(() => feature ? buildSectorPaths(feature.geometry.coordinates) : [], [feature]);
  const fullPath = sectors.map((sector) => sector.path).join(" ");

  return (
    <section className="detail-page page-frame circuit-page">
      <Link className="back-link" to="/">← Race classification</Link>
      <div className="detail-heading">
        <div><p className="eyebrow"><span className="eyebrow-rule" /> CIRCUIT PROFILE</p><h1>{feature?.properties.Name ?? "Track analysis"}</h1></div>
        {event && <span className="data-state">{event.Season} / {event.EventName}</span>}
      </div>

      {loading ? (
        <div className="state-panel"><span className="loading-marker" /><div><strong>Loading circuit geometry</strong><p>Matching the latest race location to the circuit dataset.</p></div></div>
      ) : error || !feature ? (
        <div className="state-panel" role={error ? "alert" : undefined}><span className="state-marker">!</span><div><strong>{error ? "Circuit unavailable" : "Circuit not found"}</strong><p>{error ?? `No geometry matched ${event?.Location ?? "the latest event"}.`}</p><Link className="inline-link" to="/">Return to race results</Link></div></div>
      ) : (
        <>
          <div className="circuit-meta-row">
            <div><span>LOCATION</span><strong>{feature.properties.Location}</strong></div>
            <div><span>TRACK LENGTH</span><strong>{feature.properties.length ? `${(feature.properties.length / 1000).toFixed(3)} km` : "—"}</strong></div>
            <div><span>LAYOUT SOURCE</span><a href="https://github.com/bacinger/f1-circuits" target="_blank" rel="noreferrer">GeoJSON · MIT ↗</a></div>
          </div>
          <div className="circuit-layout-panel">
            <div className="circuit-panel-topline"><span>TRACK MAP <i>·</i> {event?.Season} SEASON</span><span>ROUTE GEOMETRY</span></div>
            <svg className="circuit-svg" viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`} role="img" aria-label={`${feature.properties.Name} route divided into three equal-distance sectors`}>
              <defs><filter id="track-glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="7" result="blur" /><feComposite in="SourceGraphic" in2="blur" operator="over" /></filter></defs>
              <path d={fullPath} className="circuit-track-shadow" />
              {sectors.map((sector) => <path key={sector.name} d={sector.path} className="circuit-sector-path" stroke={sector.color} />)}
              {sectors.map((sector) => <g key={`${sector.name}-marker`} className="sector-marker"><circle cx={sector.middle.x} cy={sector.middle.y} r="5" fill={sector.color} /><circle cx={sector.middle.x} cy={sector.middle.y} r="10" fill="none" stroke={sector.color} opacity="0.3" /></g>)}
            </svg>
            <div className="circuit-panel-bottomline"><span>01 — START POINT</span><span>ROUTE DIRECTION →</span></div>
          </div>
          <div className="sector-legend" aria-label="Circuit sector legend">
            {sectors.map((sector) => <div className="sector-legend-item" key={`${sector.name}-legend`}><span style={{ backgroundColor: sector.color }} /><strong>{sector.name}</strong></div>)}
          </div>
          <p className="circuit-data-note">Track geometry: <a href="https://github.com/bacinger/f1-circuits" target="_blank" rel="noreferrer">bacinger/f1-circuits</a>. The source includes route coordinates but no official sector split points; sectors are divided into equal-distance thirds for visualization.</p>
        </>
      )}
    </section>
  );
}