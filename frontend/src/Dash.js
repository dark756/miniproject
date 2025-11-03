import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

export default function Dash({ name }) {
  const navigate = useNavigate();
  const [details, setDetails]=useState(false);
  useEffect(()=>
  {
    //call get
    const checkStatus=async()=>
    {
      const res=await axios.get("http://localhost:5000/check-details", { withCredentials: true, validateStatus: () => true })
      if (res.status===200)
      {
        setDetails(res.data.detailsFound);
      }
      else
      {
        console.log(res.data);
        //figure it out
      }
    };
    checkStatus();
  },[])
  return (
    <div>
      <p>Welcome {name}</p>
      {details ? (<p>you have details...</p>):(<p>you do not have details...</p>)}
      <button onClick={()=>navigate("/details")}>click me</button>
      <p></p>
      <button 
      disabled={!details}
      style={{
    backgroundColor: !details ? 'grey' : 'blue',
    color: !details ? 'darkgray' : 'white'}}
      onClick={()=>navigate("/face-id")}>start interview</button>
    </div>
  );
}




/*


check details
if not{request so and make tests unhoverable}
else{continue as normal}



*/