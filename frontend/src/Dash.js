import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Hist from "./Hist"

export default function Dash({ name }) {
  const navigate = useNavigate();
  const [details, setDetails] = useState(false);
  useEffect(() => {
    const checkStatus = async () => {
      const res = await axios.get("http://localhost:5000/check-details", { withCredentials: true, validateStatus: () => true })
      if (res.status === 200) {
        setDetails(res.data.detailsFound);
      }
      else {
        console.log(res.data);
      }
    };
    checkStatus();
  }, [])
  return (
    <div style={{
      maxWidth: 500,
      margin: "36px auto",
      padding: "26px 22px 14px 22px",
      border: "1px solid #ebebeb",
      borderRadius: 12,
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      background: "#f6f8fa",
      boxShadow: "0 1px 10px rgba(40,40,70,0.08)"
    }}>
      <h2 style={{ fontSize: 26, fontWeight: 700, color: "#27326b", textAlign: "center", marginBottom: 28 }}>
        Dashboard
      </h2>
      <p style={{ fontSize: 18, fontWeight: "600", color: "#225534", marginBottom: 20 }}>
        Welcome {name}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <button
          onClick={() => navigate("/details")}
          style={{
            padding: "12px",
            fontSize: 17,
            background: "#457b9d",
            color: "#fff",
            border: "none",
            borderRadius: 7,
            fontWeight: "600",
            cursor: "pointer",
            boxShadow: "0 1px 4px rgba(33,51,107,0.08)",
            transition: "background 0.2s"
          }}
          onMouseOver={e => e.currentTarget.style.background = "#274460"}
          onMouseOut={e => e.currentTarget.style.background = "#457b9d"}
        >
          Fill Details
        </button>
        <button
          disabled={!details}
          style={{
            padding: "12px",
            fontSize: 17,
            backgroundColor: !details ? '#aa3b3b' : '#2156b6',
            color: !details ? 'white' : 'white',
            border: "none",
            borderRadius: 7,
            fontWeight: "600",
            cursor: !details ? "not-allowed" : "pointer",
            boxShadow: !details ? "none" : "0 1px 4px rgba(33,51,107,0.08)",
            transition: "background 0.2s"
          }}
          onClick={() => navigate("/interview")}
        >
          Start Interview
        </button>
      </div>
      <div style={{
        margin: "30px 0 0",
        padding: 0,
        borderTop: "1px solid #e0e0e0"
      }}>
        <Hist />
      </div>
    </div>
  )

}

