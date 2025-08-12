import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Admin({name}) {
  const navigate = useNavigate();
  const [data, setData]=useState(null);
  useEffect(()=>
    {
        axios.get("http://localhost:5000/get-users",{withCredentials:true, validateStatus:()=>true}).then(
            (res)=>
            {
                setData(res.data.users);
            }
        )
    },[])
  return (
    <div>
        <p>Welcome {name}</p>
        {data && data.map((user)=>
        {
            return <p>{user.username}. {user.name}</p>
        })}
    </div>
  );
}
