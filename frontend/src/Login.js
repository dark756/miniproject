import { useState } from "react";
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import {jwtDecode} from "jwt-decode";
export default function Login() {
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const navigate = useNavigate()
    const [failed, setFailed] = useState(false);
    const [gfailed, setgFailed] = useState(false);
    const handleoauth=async (e)=>{
       try{
        const token=e.credential;
        const {email}=jwtDecode(token);
        console.log(email)
        const res=await axios.post("http://localhost:5000/glogin",{email},{validateStatus:()=>true, withCredentials:true});
        console.log(res);
        if (res.status!==200)
        {
            setgFailed(true);
        }
        else{
            navigate("/dashboard")
        }
       }
       catch(er)
       {
        console.log(`error: ${er}`)
       }
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
            <p>New User? CLick this button to </p>
            <button
          onClick={() => navigate("/add-user")}
        //   style={{ padding: "6px 12px" }}
        >
          Sign Up
        </button>
            {
                failed && (
                    <p>incorrect username or password please try again</p>
                )
            }
            <GoogleLogin onSuccess={(e)=>handleoauth(e)} onError={()=>{
                navigate("/login")
            }}/>
            {
                gfailed && (
                    <p>Could not login via gmail...<br/>plase try again with a valid email</p>
                )
            }
        </div>
    )
}