import { Link, NavLink, Route, Routes } from "react-router-dom";
import RaceDashboard from "./components/RaceDashboard";
import TestLapTimes from "./pages/TestLapTimes";
import DriverLapAnalysis from "./pages/DriverLapAnalysis";
import TrackLayout from "./pages/TrackLayout";

function App() {
  return (
    <div className="app-shell">
      <header className="site-header">
        <Link to="/" className="brand-lockup" aria-label="Apex race data home">
          <span className="brand-mark">A</span>
          <span className="brand-name">APEX<span> / RACE DATA</span></span>
        </Link>
        <nav className="site-nav" aria-label="Main navigation">
          <NavLink to="/" end>Race overview</NavLink>
          <NavLink to="/track">Circuit</NavLink>
        </nav>
        <span className="header-status"><span /> FASTF1 DATA</span>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<RaceDashboard />} />
          <Route path="/test/laps" element={<TestLapTimes />} />
          <Route path="/driver/:driver" element={<DriverLapAnalysis />} />
          <Route path="/track" element={<TrackLayout />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;

