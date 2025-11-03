// src/App.js
import React, { useEffect } from "react";
import { Routes, Route, Link, useNavigate } from "react-router-dom";
import Login from "./Login";
import RequireAuth from "./PostAuth";
import axios from "axios";
import Dash from "./Dash";
import Admin from "./Admin";
import AddUser from "./AddUser";
import Details from "./details";
import FaceId from "./FaceId";
import Interview from "./Interview";

// Page components (placeholder for now)


function NotFound() {
  return <h1>404 - Page Not Found</h1>;
}
function Home()
{
  const nav=useNavigate();
  useEffect(()=>
  {
    nav("/dashboard")
  },[])
  
}
export default function App() {
  const navigate = useNavigate();
  const logout = () => {
    axios.get("http://localhost:5000/logout", { withCredentials: true })
    navigate("/login")
  }
  return (
    <div>
      {/* Navigation */}
      <nav style={{ display: "flex", gap: "1rem", padding: "1rem", background: "#eee" }}>
        
        <button onClick={logout}>logout</button>

      </nav>

      {/* Routes */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard/*" element={<RequireAuth allowedRoles={['user']}><Dash /></RequireAuth>} />
        <Route path="/details" element={<RequireAuth allowedRoles={['user']}><Details /></RequireAuth>} />
        <Route path="/admin" element={<RequireAuth allowedRoles={['admin']}><Admin /></RequireAuth>} />
        <Route path="/add-user" element={<AddUser/>}/>
        <Route path="/face-id" element={<RequireAuth allowedRoles={['user']}><FaceId /></RequireAuth>} />
        <Route path="/interview/*" element={<RequireAuth allowedRoles={['user']}><Interview /></RequireAuth>} />
        {/* Catch-all for 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}
