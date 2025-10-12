import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
export default function AddUser() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [jobrole, setJobrole] = useState("");
  const [status, setStatus] = useState(false);
    const [error, setError] = useState(false);
    const [username, setUsername]=useState("")
    const [available, setAvailable]=useState(null);
  const [pass, setPass] = useState('')
  const [vpass, setVpass]=useState("");
  const [confirmPass, setConfirmPass]=useState(null);
  const [passError,setPassError]=useState([]);
  const nav=useNavigate();
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

useEffect(()=>
  {
    const timer = setTimeout(async () => {
      try {
        if(!pass || pass==="" || !vpass || vpass==="")
        {
          setConfirmPass(null);
          setPassError([]);
          return;
        }
        if(pass!==vpass)
        {
          setConfirmPass(false);
          setPassError([ "passwords do not match" ]);
          return;
        }
        if(!(/^(?=.*[A-Z])(?=.*\d).+$/.test(pass)))
        {
          setConfirmPass(false);
          setPassError([ "password must have atleast one capital letter and number"])
          return;
        }
        else
        {
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
  },[pass, vpass])




  const handleSubmit = (w) => {
    w.preventDefault();
    axios.post("http://localhost:5000/add-user", { username, name, pass, email, dob, jobrole }, { withCredentials: true, validateStatus: () => true })
      .then(res => {
        if (res.status === 200) {
          setError(false);
          setStatus(true);
           const timer = setTimeout(async () => {
            nav("/dashboard")
          },1000)
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
          password:{" "}
          <input
            type="password"
            required
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            placeholder="Enter Password"
          />
        </label>
      </div>

      <div>
        <label>
          verify password:{" "}
          <input
            type="password"
            required
            value={vpass}
            onChange={(e) => setVpass(e.target.value)}
            placeholder="Verify password"
          />
        </label>
          {confirmPass === true && <p style={{ color: "green" }}>✅ Password Usable</p>}
          {confirmPass === false && <p style={{ color: "red" }}>❌ Issues with Password{
          passError.map((e,i)=>{
            return (<p key={i}>{e}<br/></p>)
          })}</p>}  

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

      <button type="submit"
      disabled={!available || !confirmPass}
      style={{ 
    backgroundColor: (!available || !confirmPass) ? "grey" : "green", 
    cursor: (!available || !confirmPass) ? "not-allowed" : "pointer" 
  }}
      >Add User</button>
    </form>
    {
      status && (status === true && (
        <p>User created successfully</p>// username: "{user}"<br />password: "{pass}"</p>
      ))
    }
    {
      error===true && (<p>couldnt create user</p>)
    }
  </div>
  );
}