import axios from "axios";
import { useState } from "react";
export default function AddUser()
{
    const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [jobrole, setJobrole] = useState("");
  const [status, setStatus]=useState(null);
const [pass, setPass]=useState('')
  const handleSubmit=()=>{
    axios.post("http://localhost:5000/add-user",{name, email, dob, jobrole},{withCredentials:true, validateStatus:()=>true})
    .then(res=>{
        if (res.status===200)
        {
            setPass(res.data.password);
            setStatus(true)
        }
        else{
            setStatus(false);
        }
    })
  }
   return (<div>
    <form onSubmit={handleSubmit}>
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
        status && status===true ?(
            <p>User created password: {pass}</p>
        ):(<p>couldnt create user</p>)
    }
    </div>
  );
}