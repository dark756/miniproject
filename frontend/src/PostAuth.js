import axios from "axios";
import { useEffect, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Admin from "./Admin";
import Dash from "./Dash";
export default function PostAuth() {
  const nav = useNavigate();
  const [role, setRole] = useState(null);

  useEffect(() => {
    axios.get("http://localhost:5000/token", { withCredentials: true })
      .then(res => {
        const { name, role } = res.data;

        if (!name || !["user", "admin"].includes(role)) {
          nav("/login");
          return;
        }
        setRole(role);
      })
      .catch(() => {
        nav("/login");
      });
  }, [nav]);

  if (!role) return <p>Loading...</p>; // avoid rendering until role is known

  return (
    <Routes>
      {role === "user" && <Route path="/*" element={<Dash />} />}
      {role === "admin" && <Route path="/*" element={<Admin />} />}
    </Routes>
  );
}
    