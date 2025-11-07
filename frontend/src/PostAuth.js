import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import React from "react";
export default function RequireAuth({ allowedRoles, children }) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const nav = useNavigate();
  const [name, setName] = useState(null);
  useEffect(() => {
    const verify = async () => {
      const res = await axios.get(`${process.env.REACT_APP_API_URI || "http://localhost:5000"}/token`, { withCredentials: true, validateStatus: () => true });
      if (res.status === 200) {
        const { role, name } = res.data;
        setName(name);
        if (allowedRoles.includes(role)) {
          setAuthorized(true);
        } else {
          nav("/login");
        }
        setLoading(false);
      }
      else {
        if (res.status === 404) {
          const resp = await axios.get(`${process.env.REACT_APP_API_URI || "http://localhost:5000"}/refresh`, { withCredentials: true, validateStatus: () => true });
          if (resp.status === 200) {
            const { role, name } = resp.data;
            setName(name);
            if (allowedRoles.includes(role)) {
              setAuthorized(true);
            } else {
              nav("/login");
            }
            setLoading(false);
          }
          else {
            nav("/login")
          }
        }
        else {
          nav("/login")
        }
      }
    };
    verify();
  }, [allowedRoles, nav]);

  if (loading) return <p>Loading...</p>;
  return authorized
    ? React.cloneElement(children, { name })
    : null;
}
