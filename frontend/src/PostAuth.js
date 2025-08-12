import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import React from "react";
export default function RequireAuth({ allowedRoles, children }) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const nav = useNavigate();
  const [name, setName]=useState(null);
  useEffect(() => {
    const verify = async () => {
      try {
        const res = await axios.get("http://localhost:5000/token", { withCredentials: true });
        const { role,name } = res.data;
        setName(name);
        if (allowedRoles.includes(role)) {
          setAuthorized(true);
        } else {
          nav("/login");
        }
      } catch {
        nav("/login");
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, [allowedRoles, nav]);

  if (loading) return <p>Loading...</p>;
   return authorized
    ? React.cloneElement(children, { name })
    : null;
}
