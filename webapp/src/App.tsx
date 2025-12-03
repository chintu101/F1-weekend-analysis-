import { Routes, Route } from "react-router-dom";
import DriversList from "./components/DriversList";
import TestLapTimes from "./pages/TestLapTimes";

function App() {
  return (
    <Routes>
      <Route path="/" element={<DriversList />} />
      <Route path="/test/laps" element={<TestLapTimes />} />
    </Routes>
  );
}

export default App;
