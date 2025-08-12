// src/App.js
import React from "react";
import { Routes, Route, Link } from "react-router-dom";

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
  return (
    <div>
      {/* Navigation */}
      <nav style={{ display: "flex", gap: "1rem", padding: "1rem", background: "#eee" }}>
        <Link to="/">Home</Link>
        <Link to="/users">Users</Link>
        <Link to="/products">Products</Link>
      </nav>

      {/* Routes */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/users" element={<Users />} />
        <Route path="/products" element={<Products />} />
        {/* Catch-all for 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}
