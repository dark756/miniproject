import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Dash() {
  const navigate = useNavigate();
  const [name, setName] = useState(null);
  console.log("dash")
  useEffect(() => {
    const getname = async () => {
      try {
        const res = await axios.get("http://localhost:5000/dashboard", { withCredentials: true , validateStatus:()=>true});
        console.log(res.data);
        if (res.status === 200) {
          setName(res.data.name);
        } else {
          navigate("/login");
        }
      } catch (err) {
        console.error(err);
        console.log("err")
        navigate("/login"); 
      }
    };

    getname();
  }, [navigate]); 

  return (
    <div>
      {name && name !== "" && (
        <p>Welcome {name}</p>
      )}
    </div>
  );
}
