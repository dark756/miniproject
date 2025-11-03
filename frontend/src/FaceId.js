import { useNavigate } from "react-router-dom"

export default function FaceId()
{
    const nav=useNavigate();
    return (
        <div>
            <button onClick={()=>nav("/interview")}>start interview</button>
        </div>
    )
}