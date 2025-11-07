import { useState } from "react";
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
export default function Login() {
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const navigate = useNavigate()
    const [failed, setFailed] = useState(false);
    const [gfailed, setgFailed] = useState(false);
    const handleoauth = async (e) => {
        try {
            const token = e.credential;
            const info = jwtDecode(token);
            const { email } = info;
            console.log(info);
            const res = await axios.post(`${process.env.REACT_APP_API_URI || "http://localhost:5000"}/glogin`, info, { validateStatus: () => true, withCredentials: true });
            console.log(res);
            if (res.status !== 200 && res.status !== 201) {
                setgFailed(true);
            }
            else if (res.status === 201) {
                navigate("/details")
            }
            else {
                navigate("/dashboard")
            }
        }
        catch (er) {
            console.log(`error: ${er}`)
        }
    }
    const handle = (e) => {
        e.preventDefault();
        axios.post(`${process.env.REACT_APP_API_URI || "http://localhost:5000"}/login`,
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
        <div style={{ maxWidth: 360, margin: "40px auto", padding: 20, border: "1px solid #ddd", borderRadius: 8, boxShadow: "0 2px 5px rgba(0,0,0,0.1)", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", backgroundColor: "#fff" }}>
            <p style={{ fontSize: 22, fontWeight: "600", color: "#333", marginBottom: 20 }}>Login<br /></p>
            <form onSubmit={handle} style={{ display: "flex", flexDirection: "column" }}>
                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
                    style={{ padding: 10, fontSize: 16, borderRadius: 4, border: "1px solid #bbb", outline: "none", marginBottom: 16, transition: "border-color 0.3s" }}
                    onFocus={e => e.currentTarget.style.borderColor = "#007BFF"}
                    onBlur={e => e.currentTarget.style.borderColor = "#bbb"}
                />
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    style={{ padding: 10, fontSize: 16, borderRadius: 4, border: "1px solid #bbb", outline: "none", marginBottom: 24, transition: "border-color 0.3s" }}
                    onFocus={e => e.currentTarget.style.borderColor = "#007BFF"}
                    onBlur={e => e.currentTarget.style.borderColor = "#bbb"}
                />
                <button type="submit" style={{ backgroundColor: "#007BFF", color: "white", border: "none", borderRadius: 4, padding: "12px 0", fontSize: 16, cursor: "pointer", fontWeight: "600", boxShadow: "0 3px 6px rgba(0,123,255,0.4)" }}>
                    Submit
                </button>
            </form>
            <p style={{ marginTop: 30, fontSize: 14, color: "#555" }}>New User? Click this button to</p>
            <button
                onClick={() => navigate("/add-user")}
                style={{ backgroundColor: "#28a745", color: "white", border: "none", borderRadius: 4, padding: "10px 20px", fontSize: 16, cursor: "pointer", fontWeight: "600", boxShadow: "0 3px 6px rgba(40,167,69,0.4)", marginTop: 10 }}
            >
                Sign Up
            </button>
            {failed && (
                <p style={{ marginTop: 20, color: "#dc3545", fontWeight: "600" }}>
                    Incorrect username or password, please try again
                </p>
            )}
            <div style={{ marginTop: 28 }}>
                <GoogleLogin
                    onSuccess={(e) => handleoauth(e)}
                    onError={() => {
                        navigate("/login");
                    }}
                />
                {gfailed && (
                    <p style={{ marginTop: 12, color: "#dc3545", fontWeight: "600" }}>
                        Could not login via Gmail...<br />please try again
                    </p>
                )}
            </div>
        </div>
    )

}