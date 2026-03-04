import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function TrackLayout() {
  const { eventName } = useParams();
  const navigate = useNavigate();
  const [trackImage, setTrackImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch track image
    fetch("http://localhost:5000/api/track")
      .then(res => res.json())
      .then(data => {
        if (data.status === "success") {
          setTrackImage(data.image);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        color: "white"
      }}>
        <h2>Loading track layout...</h2>
      </div>
    );
  }

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      minHeight: "100vh",
      padding: "40px 20px",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    }}>
      <button
        onClick={() => navigate("/")}
        style={{
          marginBottom: "30px",
          padding: "10px 20px",
          fontSize: "16px",
          backgroundColor: "#ff2b2b",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          transition: "opacity 0.2s"
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
      >
        ← Back to Results
      </button>

      <h1 style={{
        color: "white",
        marginBottom: "40px",
        fontSize: "32px",
        fontWeight: 600
      }}>
        {decodeURIComponent(eventName || "Track Layout")}
      </h1>

      <div
        style={{
          width: "100%",
          maxWidth: "900px",
          display: "flex",
          justifyContent: "center"
        }}
      >
        {trackImage ? (
          <img
            src={trackImage}
            alt="Track Layout"
            style={{
              width: "100%",
              maxWidth: "850px",
              borderRadius: "12px",
              boxShadow: "0 20px 60px rgba(255, 43, 43, 0.3)",
              display: "block"
            }}
          />
        ) : (
          <div style={{
            padding: "40px",
            color: "white",
            textAlign: "center",
            fontSize: "18px"
          }}>
            Failed to load track layout
          </div>
        )}
      </div>

      <div style={{
        marginTop: "40px",
        display: "flex",
        gap: "30px",
        justifyContent: "center"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "20px", height: "20px", backgroundColor: "#ffd500", borderRadius: "4px" }}></div>
          <span style={{ color: "white" }}>Sector 1</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "20px", height: "20px", backgroundColor: "#ff2b2b", borderRadius: "4px" }}></div>
          <span style={{ color: "white" }}>Sector 2</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "20px", height: "20px", backgroundColor: "#9333ea", borderRadius: "4px" }}></div>
          <span style={{ color: "white" }}>Sector 3</span>
        </div>
      </div>
    </div>
  );
}
