import { Link } from "react-router-dom";

export default function TrackLayout() {
  return (
    <section className="detail-page page-frame circuit-page">
      <Link className="back-link" to="/">← Race classification</Link>
      <div className="detail-heading"><div><p className="eyebrow"><span className="eyebrow-rule" /> CIRCUIT PROFILE</p><h1>Track analysis</h1></div><span className="data-state">NO CIRCUIT FEED</span></div>
      <div className="circuit-empty">
        <span className="circuit-index">01 / CIRCUIT</span>
        <h2>Geometry not available</h2>
        <p>This workspace does not expose circuit coordinates for the selected race yet.</p>
        <Link className="outline-link" to="/">View race results <span aria-hidden="true">↗</span></Link>
      </div>
    </section>
  );
}