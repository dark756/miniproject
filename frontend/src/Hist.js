import axios  from "axios"
import { useEffect, useState } from "react"
import { useNavigate , useParams} from "react-router-dom";




export default function Hist() {
    const nav = useNavigate();
    const [ids, setIds]=useState([])
    useEffect(() => {
        const call = async () => {
            const res = await axios.get("http://localhost:5000/check-hist", { withCredentials: true, validateStatus: () => true })
            if (res.status === 200) {
                setIds(res.data.iids??null);
            }
            else {
                console.log(res.data);
            }
        }
        call();
    }, [])
    return (
        <div>
            { ids && ids.length > 0 && ids.map((e, i) => {
                return (
                    <button onClick={() => nav(`/history/${e}`)}>Interview {i + 1}</button>
                )
            })}
            {(!ids || ids.length === 0) && (<p>No previous interviews</p>)}
        </div>
    )
}

export function HistID()
{
    const { id } = useParams();  // get id from URL
        const [loaded, setLoaded]=useState(false);
    const [score, setScore]=useState(Number)
    const [breakdown, setBreakdown]=useState([])
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const nav=useNavigate()

    useEffect(()=>
    {
        const loadscore = async (t = 0) => {
        await delay(t * 1000); 

        const res = await axios.get(`http://localhost:5000/score/${id}`, { withCredentials: true, validateStatus: () => true });
        console.log(res)
        if (res.status === 201) {
            loadscore(7); 
        } else if (res.status === 200) {
            setLoaded(true);
            setScore(res.data.score);//breakdown
            setBreakdown(res.data.answers)
        }
        else {
            console.log('er');
            nav("/history")
        }
    };
    loadscore();
    },[]);
    return(
        <div>
            {loaded? (<><p>Score: {score}<br/></p>
            {breakdown && breakdown.map((e,i)=>{
                return (<div key={i}>
                    <p>Q{i+1}. {e.question}<br/>
                    Your answer: {e.answer}<br/>
                    {e.type==="mcq" &&(<span>correct answer: {e.correct_answer}<br/></span>)}
                    marks: {e.marks}
                    </p></div>
                )
            })}
            
            
            
            </>):(<p>loading...</p>)}
        </div>
    )
}