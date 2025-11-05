import axios from "axios";
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom";


export default function Interview() {
  const [details, setDetails] = useState({ tech: [], progLangs: [] });
  const nav = useNavigate();
  useEffect(() => {
    const checkStatus = async () => {
      const res = await axios.get("http://localhost:5000/check-details", { withCredentials: true, validateStatus: () => true })
      if (res.status === 200) {
        setDetails(res.data.details);

        if (!res.data.detailsFound) {
          nav("/dashboard")
        }
      }
    };
    checkStatus();
  }, [])

  const [generating, setGenerating] = useState(false)
  const [gen, setGen] = useState(false)
  const [er, setEr] = useState("")
  const [questions, setQ] = useState([])
  const [answers, setAnswers] = useState({});
  const [iid, setIid] = useState("");
  const maxChars = 500;
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false)
  const [loaded, setLoaded] = useState(false);
  const [score, setScore] = useState(Number)
  const [breakdown, setBreakdown] = useState([])
  async function generate(id) {
    setEr("")
    console.log(id)
    setGenerating(true);
    const res = await axios.get(`http://localhost:5000/generate/${id}`, { withCredentials: true, validateStatus: () => true })
    console.log(res.data)
    if (res.status !== 200) {
      setGenerating(false);
      setEr("question generation failed try again")
      return;
    }
    setGenerating(false)
    setGen(true)
    setIid(res.data.interviewID)
    setQ(res.data.questions)
  }

  const handleSubjectiveChange = (i, e) => {
    if (e.target.value.length <= maxChars) {
      setAnswers(prev => ({ ...prev, [i]: e.target.value }));
    }
  };

  const handleMCQChange = (i, value) => {
    setAnswers(prev => ({ ...prev, [i]: value }));
  };
  const handleSubmit = async () => {
    setSubmitting(true);
    const res = await axios.post("http://localhost:5000/submit", { answers, interviewID: iid }, { withCredentials: true, validateStatus: () => true })
    if (res.status !== 200) {
      setEr("couldnt submit please try again")
    }
    setEr("")
    setSubmitted(true);
    loadscore();
  }
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const loadscore = async (t = 7) => {
    await delay(t * 1000);

    const res = await axios.get(`http://localhost:5000/score/${iid}`, { withCredentials: true, validateStatus: () => true });
    console.log(res)
    if (res.status === 201) {
      loadscore(7);
    } else if (res.status === 200) {
      setLoaded(true);
      setScore(res.data.score);
      setBreakdown(res.data.answers)
    } else {
      console.log('er');
    }
  };
  return (
    <div style={{
      maxWidth: 620,
      margin: "38px auto",
      padding: "30px 26px",
      border: "1px solid #e0e0e0",
      borderRadius: 12,
      background: "#f7f8fa",
      boxShadow: "0 1px 14px rgba(33,51,107,0.09)"
    }}>
      {generating && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginBottom: 18 }}>
          <svg style={{ animation: "spin 1s linear infinite" }} width="36" height="36" viewBox="0 0 50 50">
            <circle
              cx="25"
              cy="25"
              r="20"
              fill="none"
              stroke="#2156b6"
              strokeWidth="6"
              strokeDasharray="31.4 31.4"
              strokeDashoffset="0"
            />
            <style>{`
              @keyframes spin { 
                100% { transform: rotate(360deg); } 
              }
              svg { display: inline-block; vertical-align: middle; }
            `}</style>
          </svg>
          <span style={{ marginLeft: 10, fontWeight: 600, color: "#2156b6" }}>Generating questions...</span>
        </div>
      )}
      {!gen && (
        <div style={{ marginBottom: 22 }}>
          <div style={{ marginBottom: 10, fontWeight: "600", color: "#27326b" }}>Choose a Topic:</div>
          {[...details.tech, ...details.progLangs].map((e, idx) => (
            <button
              disabled={generating}
              key={idx}
              onClick={() => generate(idx)}
              style={{
                margin: "6px 8px 6px 0",
                padding: "10px 18px",
                background: generating ? "#aaa" : "#2156b6",
                color: "white",
                border: "none",
                borderRadius: 7,
                fontWeight: "600",
                cursor: generating ? "not-allowed" : "pointer",
                fontSize: "1rem",
                boxShadow: !generating ? "0 2px 5px rgba(33,51,107,0.05)" : "none",
                transition: "background 0.2s"
              }}
            >
              {e}
            </button>
          ))}
        </div>
      )}
      {er !== "" && (<p style={{ color: "#b10000", marginBottom: 16 }}>{er}</p>)}
      {gen && !submitted && (
        <>
          <div style={{ marginBottom: 22 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "#21336b", marginBottom: 18 }}>Questions</h2>
            {questions.map((q, i) => (
              <div key={i} style={{ marginBottom: 28, background: "#fff", borderRadius: 8, boxShadow: "0 1px 4px rgba(33,51,107,0.05)", padding: "16px 12px" }}>
                <p style={{ fontWeight: "600", color: "#25335d" }}>Question {i + 1}. {q.question}<br /></p>
                {q.type === "mcq" && (
                  <div style={{ margin: "10px 0 0 0" }}>
                    {[q.option_a, q.option_b, q.option_c, q.option_d].map((option, idx) => option && (
                      <label key={idx} style={{
                        display: "block",
                        marginBottom: "8px",
                        fontWeight: "500",
                        padding: "4px 0"
                      }}>
                        <input
                          type="radio"
                          name={`q${i}`}
                          value={option}
                          checked={answers[i] === option}
                          onChange={() => handleMCQChange(i, option)}
                          style={{ marginRight: "10px" }}
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                )}
                {q.type === "subjective" && (
                  <>
                    <textarea
                      placeholder="Enter your answer in up to 500 characters"
                      value={answers[i] || ""}
                      onChange={e => handleSubjectiveChange(i, e)}
                      rows={6}
                      style={{
                        width: "98%",
                        fontSize: "1rem",
                        borderRadius: "6px",
                        border: "1px solid #bbb",
                        marginTop: "7px",
                        padding: "8px"
                      }}
                    />
                    <div style={{
                      fontSize: "0.875rem",
                      color: answers[i]?.length > maxChars ? "red" : "gray",
                      marginTop: "6px",
                      textAlign: "right"
                    }}>
                      {answers[i]?.length || 0} / {maxChars} characters
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              background: submitting ? "#aaa" : "#148337",
              color: "white",
              border: "none",
              borderRadius: 7,
              padding: "13px 0",
              fontSize: "1.08rem",
              fontWeight: "600",
              width: "100%",
              cursor: submitting ? "not-allowed" : "pointer",
              boxShadow: !submitting ? "0 2px 7px rgba(20,131,55,0.09)" : "none",
              transition: "background 0.2s"
            }}
          >
            Submit Answers
          </button>
          {submitting && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginTop: 20 }}>
              <svg style={{ animation: "spin 1s linear infinite" }} width="36" height="36" viewBox="0 0 50 50">
                <circle
                  cx="25"
                  cy="25"
                  r="20"
                  fill="none"
                  stroke="#148337"
                  strokeWidth="6"
                  strokeDasharray="31.4 31.4"
                  strokeDashoffset="0"
                />
                <style>{`
                  @keyframes spin { 
                    100% { transform: rotate(360deg); } 
                  }
                  svg { display: inline-block; vertical-align: middle; }
                `}</style>
              </svg>
              <span style={{ marginLeft: 10, fontWeight: 600, color: "#148337" }}>Submitting answers...</span>
            </div>
          )}
        </>
      )}
      {submitted && !loaded && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginTop: 20 }}>
          <svg style={{ animation: "spin 1s linear infinite" }} width="36" height="36" viewBox="0 0 50 50">
            <circle
              cx="25"
              cy="25"
              r="20"
              fill="none"
              stroke="#2156b6"
              strokeWidth="6"
              strokeDasharray="31.4 31.4"
              strokeDashoffset="0"
            />
            <style>{`
              @keyframes spin { 
                100% { transform: rotate(360deg); } 
              }
              svg { display: inline-block; vertical-align: middle; }
            `}</style>
          </svg>
          <span style={{ marginLeft: 10, fontWeight: 600, color: "#2156b6" }}>Loading results...</span>
        </div>
      )}
      {loaded && (
        <div style={{ marginTop: 18 }}>
          <p style={{ fontSize: 18, fontWeight: "600", color: "#148337", marginBottom: 18 }}>Score: {score}<br /></p>
          {breakdown && breakdown.map((e, i) => {
            const isCorrect = e.type === "mcq" ? e.answer === e.correct_answer : e.marks > 0;
            return (
              <div key={i} style={{
                marginBottom: 18,
                background: "#fff",
                borderRadius: 8,
                boxShadow: "0 1px 3px rgba(33,51,107,0.04)",
                padding: "14px 13px"
              }}>
                <p style={{ fontWeight: "600", color: "#25335d" }}>Q{i + 1}. {e.question}<br /></p>
                <span>
                  Your answer:{" "}
                  <span style={{ color: isCorrect ? "#148337" : "#aa3b3b", fontWeight: 500 }}>
                    {e.answer}
                  </span>
                </span>
                {e.type === "mcq" && (
                  <span style={{ color: "#2156b6", marginLeft: 10 }}>
                    <br />
                    Correct answer: <span style={{ fontWeight: 500 }}>{e.correct_answer}</span>
                  </span>
                )}
                <br />
                <span style={{ color: "#225534", fontWeight: "600" }}>
                  Marks: {e.marks}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  );


}