import axios from "axios";
import { useEffect, useState } from "react"
import { generatePath, useNavigate } from "react-router-dom";


export default function Interview() {
    const [details, setDetails] = useState({});
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
                console.log(res.data);
                console.log("else")
                //figure it out
            }
        };
        checkStatus();
    }, [])
    console.log(details)
    return (
        <div>
            {/* {details.tech.map((e, idx) => <button disabled={generating} key={idx} onClick={generate(e)}>{e}</button>)} */}
        </div>

    )
}