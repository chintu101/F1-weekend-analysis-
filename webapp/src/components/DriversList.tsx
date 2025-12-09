import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function DriversList() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:5000/")
      .then(res => res.json())
      .then(data => {
        setResults(data);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <h2>Loading race results...</h2>;
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Latest Race Results</h1>

      <table border={10} cellPadding={8} style={{ marginTop: "20px", width: "100%" }}>
        <thead>
          <tr>
            <th>Pos</th>
            <th>Driver</th>
            <th>Team</th>
            <th>Time</th>
            <th>Points</th>
          </tr>
        </thead>

        <tbody>
          {results.map((row, index) => (
            <tr
              key={index}
              
              
            >
              <td>{row.Position}</td>
              <td onClick={() => navigate(`/driver/${row.DriverCode}`)} 
                  style={{ fontWeight: "bold", color: "Red", cursor: "pointer" }}>
                    <img src="https://media.formula1.com/image/upload/f_auto,q_auto/v1677244984/drivers/${ver}_01.png"/>
                {row.Driver}
              </td>
              <td>{row.Team}</td>
              <td>{row.Time}</td>
              <td>{row.Points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DriversList;
