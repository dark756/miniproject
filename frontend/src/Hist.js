import axios from "axios"
import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom";


export default function Hist() {
  const nav = useNavigate();
  const [ids, setIds] = useState([]);

  useEffect(() => {
    const call = async () => {
      const res = await axios.get("http://localhost:5000/check-hist", { withCredentials: true, validateStatus: () => true })
      if (res.status === 200) {
        setIds(res.data.iids ?? null);
      } else {
        console.log(res.data);
      }
    }
    call();
  }, [])

  return (
    <div style={{
      maxWidth: 400,
      margin: "36px auto",
      padding: "24px 20px",
      border: "1px solid #e0e0e0",
      borderRadius: 10,
      backgroundColor: "#fafbfc",
      boxShadow: "0 1px 8px rgba(0,0,0,0.09)"
    }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 22, color: "#21336b", textAlign: "center" }}>
        Interview History
      </h2>
      {ids && ids.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {ids.map((e, i) => (
            <button
              key={e}
              onClick={() => nav(`/history/${e}`)}
              style={{
                padding: "12px",
                fontSize: 17,
                background: "#457b9d",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                fontWeight: "600",
                cursor: "pointer",
                boxShadow: "0 1px 4px rgba(33,51,107,0.08)",
                transition: "background 0.2s"
              }}
              onMouseOver={e => e.currentTarget.style.background = "#274460"}
              onMouseOut={e => e.currentTarget.style.background = "#457b9d"}
            >
              Interview {i + 1}
            </button>
          ))}
        </div>
      ) : (
        <p style={{ color: "#aa3b3b", fontSize: 16, marginTop: 16, textAlign: "center" }}>No previous interviews</p>
      )}
    </div>
  )
}


export function HistID() {
  const { id } = useParams();
  const [loaded, setLoaded] = useState(false);
  const [score, setScore] = useState(Number);
  const [breakdown, setBreakdown] = useState([]);
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  const nav = useNavigate();

  useEffect(() => {
    const loadscore = async (t = 0) => {
      await delay(t * 1000);
      const res = await axios.get(`http://localhost:5000/score/${id}`, { withCredentials: true, validateStatus: () => true });
      if (res.status === 201) {
        loadscore(7);
      } else if (res.status === 200) {
        setLoaded(true);
        setScore(res.data.score);
        setBreakdown(res.data.answers)
      } else {
        nav("/history")
      }
    };
    loadscore();
  }, []);

  return (
    <div style={{
      maxWidth: 500,
      margin: "36px auto",
      padding: "24px 20px",
      border: "1px solid #e0e0e0",
      borderRadius: 10,
      backgroundColor: "#fafbfc",
      boxShadow: "0 1px 8px rgba(0,0,0,0.09)"
    }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20, color: "#21336b", textAlign: "center" }}>Interview Results</h2>
      {loaded ? (
        <>
          <p style={{ fontSize: 18, fontWeight: "600", color: "#148337", marginBottom: 18 }}>Score: {score}</p>
          <div>
            {breakdown.map((e, i) => {
              const isCorrect = e.type === "mcq" ? e.answer === e.correct_answer : e.marks > 0;
              return (
                <div key={i} style={{
                  marginBottom: 18,
                  background: "#fff",
                  borderRadius: 8,
                  boxShadow: "0 1px 3px rgba(33,51,107,0.04)",
                  padding: "14px 13px"
                }}>
                  <p style={{ fontWeight: "600", color: "#25335d" }}>Q{i + 1}. {e.question}</p>
                  <p>
                    Your answer:{""}
                    <span style={{ color: isCorrect ? "#148337" : "#aa3b3b", fontWeight: 500 }}>
                      {e.answer}
                    </span>
                  </p>
                  {e.type === "mcq" && (
                    <p style={{ color: "#2156b6", margin: 0 }}>
                      Correct answer: <span style={{ fontWeight: 500 }}>{e.correct_answer}</span>
                    </p>
                  )}
                  <p style={{ color: "#225534", fontWeight: "600", margin: 0 }}><br />
                    Marks: {e.marks}
                  </p>
                </div>
              )
            })}
          </div>
        </>
      ) : (
        <p style={{ color: "#777", fontSize: 17, textAlign: "center" }}>loading...</p>
      )}
    </div>
  )

}