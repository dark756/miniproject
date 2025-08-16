import { useState } from "react";
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";


export default function Login() {
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const navigate = useNavigate()
    const [failed, setFailed] = useState(false);
    const handleoauth=(e)=>{
       
    }
    const handle = (e) => {
        e.preventDefault();
        axios.post("http://localhost:5000/login",
            {
                username, password
            },
            {
                validateStatus: () => true,
                withCredentials: true
            }
        ).then(res => {
            if (res.status === 200) {
                if (res.data.role === "user") {
                    navigate("/dashboard");
                }
                else if (res.data.role === "admin") {
                    navigate("/admin")
                }
                else {
                    navigate("/login")
                }
            }
            else {
                setFailed(true);
                setUsername("");
                setPassword("")
            }
        })
            .catch(er => console.log(er));
    }
    return (
        <div>
            <p>Login<br /></p>
            <form onSubmit={handle}>
                <input
                    type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                ></input>
                <p><br /></p>
                <input
                    type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                ></input>
                <p><br /></p>
                <button type="submit">submit</button>
                <p><br /></p>
            </form>
            {
                failed && (
                    <p>incorrect username or password please try again</p>
                )
            }
            <GoogleLogin onSuccess={(e)=>handleoauth(e)} onError={()=>{
                navigate("/login")
            }}/>
        </div>
    )
}