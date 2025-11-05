import axios from "axios";
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom";


export default function Interview() {
    const [details, setDetails] = useState({ tech: [] , progLangs:[]});
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
            else {
                console.log(res.data.details);
                console.log("else")
                //figure it out
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
    const [loaded, setLoaded]=useState(false);
    const [score, setScore]=useState(Number)
    const [breakdown, setBreakdown]=useState([])
    async function generate(id) {
        setEr("")
        console.log(id)
        setGenerating(true);//spiny
        const res = await axios.get(`http://localhost:5000/generate/${id}`, { withCredentials: true, validateStatus: () => true })
        console.log(res.data)
        if (res.status !== 200) {
            setGenerating(false);
            setEr("question generation failed try again")
            return;
        }
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
            setScore(res.data.score);//breakdown
            setBreakdown(res.data.answers)
        } else {
            console.log('er');
        }
    };

    return (
        <div>
            {!gen && details.tech.map((e, idx) => <button disabled={generating} key={idx} onClick={() => generate(idx)}>{e}</button>)}
            <p></p>
            {!gen && details.progLangs.map((e, idx) => <button disabled={generating} key={idx} onClick={() => generate(idx+details.tech.length)}>{e}</button>)}
            {er !== "" && (<p>{er}</p>)}
            {gen && !submitted && (
                <>
                    {questions.map((q, i) => {
                        return (
                            <div key={i}>
                                <p>Question {i + 1}. {q.question}<br /></p>
                                {q.type === "mcq" && (
                                    <div>
                                        {[q.option_a, q.option_b, q.option_c, q.option_d].map((option, idx) => option && (
                                            <label key={idx} style={{ display: "block", marginBottom: "8px" }}>
                                                <input
                                                    type="radio"
                                                    name={`q${i}`}
                                                    value={option}
                                                    checked={answers[i] === option}
                                                    onChange={() => handleMCQChange(i, option)}
                                                />
                                                {" "}{option}
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
                                            style={{ width: "100%", fontSize: "1rem" }}
                                        />
                                        <div style={{ fontSize: "0.875rem", color: answers[i]?.length > maxChars ? "red" : "gray" }}>
                                            {answers[i]?.length || 0} / {maxChars} characters
                                        </div>
                                    </>
                                )}
                                <p><br /></p>
                            </div>
                        );
                    })}
                    <button onClick={handleSubmit}
                        disabled={submitting}
                    >
                        Submit Answers
                    </button>
                </>
            )}
            {submitted && !loaded&&(<p>loading...</p>)}
            {loaded&& (<><p>Score: {score}<br/></p>
            {breakdown && breakdown.map((e,i)=>{
                return (<div key={i}>
                    <p>Q{i+1}. {e.question}<br/>
                    Your answer: {e.answer}<br/>
                    {e.type==="mcq" &&(<span>correct answer: {e.correct_answer}<br/></span>)}
                    marks: {e.marks}
                    </p></div>
                )
            })}
            
            
            
            </>)}

        </div>

    )
}