import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function DriversList() {
  const [results, setResults] = useState<any[]>([]);
  const [eventName, setEventName] = useState<string>("Latest Race Results");
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Simulate progress increments
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev < 90) {
          return prev + Math.random() * 40;
        }
        return prev;
      });
    }, 300);

    fetch("http://localhost:5000/")
      .then(res => res.json())
      .then(data => {
        setResults(data);
        // Extract event name from the first item if it exists
        if (data && data.length > 0 && data[0].Session_Name) {
          setEventName(data[0].Session_Name);
        }
        setProgress(100);
        setTimeout(() => setLoading(false), 300);
      })
      .finally(() => clearInterval(progressInterval));
  }, []);

  if (loading) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        padding: "20px",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
      }}>
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 1; }
          }
          .loading-text {
            animation: pulse 2s infinite;
          }
        `}</style>
        
        <h2 style={{
          fontSize: "24px",
          fontWeight: 600,
          color: "white",
          marginBottom: "40px",
          textAlign: "center"
        }} className="loading-text">
          Loading latest results...
        </h2>
        
        <div style={{
          width: "300px",
          height: "8px",
          backgroundColor: "#e5e7eb",
          borderRadius: "4px",
          overflow: "hidden",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
        }}>
          <div style={{
            height: "100%",
            width: `${Math.min(progress, 100)}%`,
            backgroundColor: "#ff2b2b",
            transition: "width 0.4s ease",
            borderRadius: "4px"
          }} />
        </div>
        
        <p style={{
          marginTop: "20px",
          color: "#6b7280",
          fontSize: "14px"
        }}>
          {Math.round(Math.min(progress, 100))}%
        </p>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: "40px 20px",
      maxWidth: "1000px",
      margin: "0",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    }}>
      <div style={{ marginBottom: "30px" }}>
        <h1
        onClick={() => navigate("/track")} 
        style={{ 
          margin: 0,
          fontSize: "32px",
          fontWeight: 600,
          color: "white",
          letterSpacing: "-0.5px",
          backgroundColor: "#ff2b2b",
          padding: "16px 24px",
          borderRadius: "8px",
          display: "inline-block",
          boxShadow: "0 8px 16px rgba(255, 43, 43, 0.4)",
          cursor: "pointer"
        }}>
          {eventName}
        </h1>
      </div>

      <div style={{
        overflowX: "auto",
        borderRadius: "8px",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)"
      }}>
        <table style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "14px"
        }}>
          <thead>
            <tr style={{
              backgroundColor: "#f8f9fa",
              borderBottom: "1px solid #e5e7eb"
            }}>
              <th style={{ 
                padding: "16px 12px",
                textAlign: "left",
                fontWeight: 600,
                color: "#6b7280",
                fontSize: "12px",
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}>
                Pos
              </th>
              <th style={{ 
                padding: "16px 12px",
                textAlign: "left",
                fontWeight: 600,
                color: "#6b7280",
                fontSize: "12px",
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}>
                Driver
              </th>
              <th style={{ 
                padding: "16px 12px",
                textAlign: "left",
                fontWeight: 600,
                color: "#6b7280",
                fontSize: "12px",
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}>
                Team
              </th>
              <th style={{ 
                padding: "16px 12px",
                textAlign: "left",
                fontWeight: 600,
                color: "#6b7280",
                fontSize: "12px",
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}>
                Time
              </th>
              <th style={{ 
                padding: "16px 12px",
                textAlign: "right",
                fontWeight: 600,
                color: "#6b7280",
                fontSize: "12px",
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}>
                Points
              </th>
            </tr>
          </thead>

          <tbody>
            {results.map((row, index) => (
              <tr
                key={index}
                style={{
                  borderBottom: index === results.length - 1 ? "none" : "1px solid #f3f4f6",
                  transition: "background-color 0.15s ease",
                  backgroundColor: "white"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#f9fafb";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "white";
                }}
              >
                <td style={{ 
                  padding: "14px 12px",
                  color: "#9ca3af",
                  fontWeight: 500
                }}>
                  {row.Position}
                </td>
                <td 
                  onClick={() => navigate(`/driver/${row.DriverCode}`)} 
                  style={{ 
                    padding: "14px 12px",
                    fontWeight: 600,
                    color: "#1f2937",
                    cursor: "pointer",
                    transition: "color 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#ff2b2b";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#1f2937";
                  }}
                >
                  {row.Driver}
                </td>
                <td style={{ 
                  padding: "14px 12px",
                  color: "#6b7280"
                }}>
                  {row.Team}
                </td>
                <td style={{ 
                  padding: "14px 12px",
                  color: "#6b7280",
                  fontFamily: "monospace",
                  fontSize: "13px"
                }}>
                  {row.Time && typeof row.Time === 'string' 
                    ? row.Time.split(' ').pop()?.replace(/(\.\d{3})\d*/, '$1')
                    : row.Time}
                </td>
                <td style={{ 
                  padding: "14px 12px",
                  textAlign: "right",
                  color: "#1f2937",
                  fontWeight: 600
                }}>
                  {row.Points}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DriversList;
