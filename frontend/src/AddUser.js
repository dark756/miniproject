import axios from "axios";
import { useEffect, useState } from "react";
export default function AddUser() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [user, setUser] = useState("");
  const [jobrole, setJobrole] = useState("");
  const [status, setStatus] = useState(false);
    const [error, setError] = useState(false);
    const [username, setUsername]=useState("")
    const [available, setAvailable]=useState(null);
  const [pass, setPass] = useState('')
  useEffect(()=>
  {
    const timer = setTimeout(async () => {
      try {
        if(!username ||username==="")
        {
          setAvailable(null);
          return;
        }
        const res = await axios.get(`http://localhost:5000/check-username?username=${username}`);
        setAvailable(res.data.available); 
      } catch (err) {
        console.error("Error checking username:", err);
        setAvailable(null);
      }
    }, 500);

    return () => clearTimeout(timer);
  },[username])
  const handleSubmit = (w) => {
    w.preventDefault();
    axios.post("http://localhost:5000/add-user", { username, name, email, dob, jobrole }, { withCredentials: true, validateStatus: () => true })
      .then(res => {
        if (res.status === 200) {
          setPass(res.data.password);
          setUser(res.data.username);
          setError(false);
          setStatus(true)
        }
        else {
          console.log(res.data.statusMessage)
          setError(true);
        }
      })
  }
  return (<div>
    <form onSubmit={handleSubmit}>
      <div>
        <label>
          Username:{" "}
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
          />
        </label>
          {available === true && <p style={{ color: "green" }}>✅ Username available</p>}
          {available === false && <p style={{ color: "red" }}>❌ Username taken</p>}  
      </div>

      <div>
        <label>
          Name:{" "}
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter name"
          />
        </label>
      </div>

      <div>
        <label>
          Email:{" "}
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email"
          />
        </label>
      </div>

      <div>
        <label>
          Date of Birth:{" "}
          <input
            type="date"
            required
            value={dob}
            onChange={(e) => setDob(e.target.value)}
          />
        </label>
      </div>

      <div>
        <label>
          Job Role:{" "}
          <input
            type="text"
            required
            value={jobrole}
            onChange={(e) => setJobrole(e.target.value)}
            placeholder="Enter job role"
          />
        </label>
      </div>

      <button type="submit">Add User</button>
    </form>
    {
      status && (status === true && (
        <p>User created username: "{user}"<br />password: "{pass}"</p>
      ))
    }
    {
      error===true && (<p>couldnt create user</p>)
    }
  </div>
  );
}