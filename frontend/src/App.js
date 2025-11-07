import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Routes, Route, useNavigate } from "react-router-dom";
import Login from "./Login";
import RequireAuth from "./PostAuth";
import axios from "axios";
import Dash from "./Dash";
import Admin from "./Admin";
import AddUser from "./AddUser";
import Details from "./details";
import FaceId from "./FaceId";
import Interview from "./Interview";
import Hist, { HistID } from "./Hist"

function NotFound() {
  return <h1>404 - Page Not Found</h1>;
}
function Home() {
  const nav = useNavigate();
  useEffect(() => {
    nav("/dashboard")
  }, [])

}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const logout = () => {
    axios.get(`${process.env.REACT_APP_API_URI || "http://localhost:5000"}/logout`, { withCredentials: true });
    navigate("/login");
  };

  const showLogout = location.pathname !== "/login" && location.pathname !== "/add-user"

  return (
    <div>
      <nav
        style={{
          display: "flex",
          justifyContent: "flex-end", 
          padding: "1rem 1.5rem",
          background: "#eee"
        }}
      >
        {showLogout && (
          <button
            onClick={logout}
            style={{
              backgroundColor: "#d9534f", 
              color: "white",
              border: "none",
              borderRadius: "20px",
              padding: "8px 18px",
              fontWeight: "600",
              cursor: "pointer",
              fontSize: "1rem",
              boxShadow: "0 2px 6px rgba(217, 83, 79, 0.65)",
              transition: "background-color 0.3s"
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = "#c9302c"}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = "#d9534f"}
          >
            Logout
          </button>
        )}
      </nav>

      {/* Routes */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard/*" element={<RequireAuth allowedRoles={['user']}><Dash /></RequireAuth>} />
        <Route path="/details" element={<RequireAuth allowedRoles={['user']}><Details /></RequireAuth>} />
        <Route path="/admin" element={<RequireAuth allowedRoles={['admin']}><Admin /></RequireAuth>} />
        <Route path="/add-user" element={<AddUser />} />
        <Route path="/face-id" element={<RequireAuth allowedRoles={['user']}><FaceId /></RequireAuth>} />
        <Route path="/interview/*" element={<RequireAuth allowedRoles={['user']}><Interview /></RequireAuth>} />
        <Route path="/history/:id" element={<RequireAuth allowedRoles={['user']}><HistID /></RequireAuth>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}
