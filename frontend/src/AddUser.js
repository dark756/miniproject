import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
export default function AddUser() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(false);
  const [error, setError] = useState(false);
  const [username, setUsername] = useState("")
  const [available, setAvailable] = useState(null);
  const [pass, setPass] = useState('')
  const [vpass, setVpass] = useState("");
  const [confirmPass, setConfirmPass] = useState(null);
  const [passError, setPassError] = useState([]);
  const nav = useNavigate();
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        if (!username || username === "") {
          setAvailable(null);
          return;
        }
        const res = await axios.get(`${process.env.REACT_APP_API_URI || "http://localhost:5000"}/check-username?username=${username}`);
        setAvailable(res.data.available);
      } catch (err) {
        console.error("Error checking username:", err);
        setAvailable(null);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [username])

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        if (!pass || pass === "" || !vpass || vpass === "") {
          setConfirmPass(null);
          setPassError([]);
          return;
        }
        if (pass !== vpass) {
          setConfirmPass(false);
          setPassError(["passwords do not match"]);
          return;
        }
        if (!(/^(?=.*[A-Z])(?=.*\d).+$/.test(pass))) {
          setConfirmPass(false);
          setPassError(["password must have atleast one capital letter and number"])
          return;
        }
        else {
          setConfirmPass(true);
          setPassError([]);
          return;
        }
      } catch (err) {
        console.error("Error verifying password:", err);
        setConfirmPass(null);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [pass, vpass])


  const handleSubmit = (w) => {
    w.preventDefault();
    axios.post(`${process.env.REACT_APP_API_URI || "http://localhost:5000"}/add-user`, { username, name, pass, email }, { withCredentials: true, validateStatus: () => true })
      .then(res => {
        if (res.status === 200) {
          setError(false);
          setStatus(true);
          const timer = setTimeout(async () => {
            nav("/dashboard")
          }, 1000)
        }
        else {
          console.log(res.data.statusMessage)
          setError(true);
        }
      })
  }
  return (
    <div style={{
      maxWidth: 380,
      margin: "40px auto",
      padding: "28px 20px",
      border: "1px solid #ddd",
      borderRadius: 10,
      boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      background: "#fff"
    }}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: "block", marginBottom: 7, fontWeight: "600", color: "#222" }}>
            Username:
          </label>
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
            style={{
              width: "98%",
              padding: "9px 12px",
              fontSize: 16,
              borderRadius: 5,
              border: "1px solid #bbb",
              outline: "none",
              marginLeft: 0,
              marginRight: 0,
              boxSizing: "border-box"
            }}
          />
          {available === true && <p style={{ color: "green", marginTop: 5 }}>✅ Username available</p>}
          {available === false && <p style={{ color: "red", marginTop: 5 }}>❌ Username taken</p>}
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={{ display: "block", marginBottom: 7, fontWeight: "600", color: "#222" }}>
            Password:
          </label>
          <input
            type="password"
            required
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            placeholder="Enter Password"
            style={{
              width: "98%",
              padding: "9px 12px",
              fontSize: 16,
              borderRadius: 5,
              border: "1px solid #bbb",
              outline: "none",
              marginLeft: 0,
              marginRight: 0,
              boxSizing: "border-box"
            }}
          />
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={{ display: "block", marginBottom: 7, fontWeight: "600", color: "#222" }}>
            Verify Password:
          </label>
          <input
            type="password"
            required
            value={vpass}
            onChange={(e) => setVpass(e.target.value)}
            placeholder="Verify password"
            style={{
              width: "98%",
              padding: "9px 12px",
              fontSize: 16,
              borderRadius: 5,
              border: "1px solid #bbb",
              outline: "none",
              marginLeft: 0,
              marginRight: 0,
              boxSizing: "border-box"
            }}
          />
          {confirmPass === true && <p style={{ color: "green", marginTop: 5 }}>✅ Password usable</p>}
          {confirmPass === false && (
            <div style={{ color: "red", marginTop: 5 }}>
              ❌ Issues with Password:
              {passError.map((e, i) => (
                <p key={i} style={{ margin: 0 }}>{e}</p>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={{ display: "block", marginBottom: 7, fontWeight: "600", color: "#222" }}>
            Name:
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter name"
            style={{
              width: "98%",
              padding: "9px 12px",
              fontSize: 16,
              borderRadius: 5,
              border: "1px solid #bbb",
              outline: "none",
              marginLeft: 0,
              marginRight: 0,
              boxSizing: "border-box"
            }}
          />
        </div>

        <div style={{ marginBottom: 22 }}>
          <label style={{ display: "block", marginBottom: 7, fontWeight: "600", color: "#222" }}>
            Email:
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email"
            style={{
              width: "98%",
              padding: "9px 12px",
              fontSize: 16,
              borderRadius: 5,
              border: "1px solid #bbb",
              outline: "none",
              marginLeft: 0,
              marginRight: 0,
              boxSizing: "border-box"
            }}
          />
        </div>

        <button
          type="submit"
          disabled={!available || !confirmPass}
          style={{
            width: "100%",
            backgroundColor: (!available || !confirmPass) ? "#999" : "green",
            cursor: (!available || !confirmPass) ? "not-allowed" : "pointer",
            color: "white",
            border: "none",
            borderRadius: 8,
            padding: "14px 0",
            fontSize: 17,
            fontWeight: "600",
            boxShadow: (!available || !confirmPass) ? "none" : "0 3px 9px rgba(0,128,0,0.21)",
            transition: "background-color 0.3s, box-shadow 0.3s"
          }}
        >
          Add User
        </button>
      </form>

      {status && (
        <p style={{ marginTop: 18, color: "green", fontWeight: "600" }}>
          User created successfully
        </p>
      )}
      {error && (
        <p style={{ marginTop: 18, color: "red", fontWeight: "600" }}>
          Couldn't create user
        </p>
      )}
    </div>
  )

}