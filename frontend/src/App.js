// src/App.js
import React from "react";
import { Routes, Route, Link, useNavigate } from "react-router-dom";
import Login from "./Login";
import RequireAuth from "./PostAuth";
import axios from "axios";
import Dash from "./Dash";
import Admin from "./Admin";
import AddUser from "./AddUser";

// Page components (placeholder for now)
function Home() {
  return <h1>Home Page</h1>;
}

function Users() {
  return <h1>Users List</h1>;
}

function Products() {
  return <h1>Products Page</h1>;
}

function NotFound() {
  return <h1>404 - Page Not Found</h1>;
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
        <Link to="/">Home</Link>
        <Link to="/users">Users</Link>
        <Link to="/products">Products</Link>
        <button onClick={logout}>logout</button>

      </nav>

      {/* Routes */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/users" element={<Users />} />
        <Route path="/products" element={<Products />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard/*" element={<RequireAuth allowedRoles={['user']}><Dash /></RequireAuth>} />
        <Route path="/admin" element={<RequireAuth allowedRoles={['admin']}><Admin /></RequireAuth>} />
        <Route path="/admin/add-user" element={<RequireAuth allowedRoles={['admin']}><AddUser /></RequireAuth>} />
        {/* Catch-all for 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}
