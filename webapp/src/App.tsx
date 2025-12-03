import { Routes, Route } from "react-router-dom";
import DriversList from "./components/DriversList";
import TestLapTimes from "./pages/TestLapTimes";
import DriverLapGraph from "./pages/DriversLapGraph";

function App() {
  return (
    <Routes>
      <Route path="/" element={<DriversList />} />
      <Route path="/test/laps" element={<TestLapTimes />} />
      <Route path="/driver/:driver" element={<DriverLapGraph />} />

    </Routes>
  );
}

export default App;

