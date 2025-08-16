import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { FixedSizeList as List } from "react-window";
import { useNavigate } from "react-router-dom";

export default function Admin({ name }) {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [filterJobRole, setFilterJobRole] = useState("");
  const [sortBy, setSortBy] = useState("");

  useEffect(() => {
    axios
      .get("http://localhost:5000/get-users", {
        withCredentials: true,
        validateStatus: () => true,
      })
      .then((res) => {
        setData(res.data.users || []);
      });
  }, []);

  const filteredData = useMemo(() => {
    let filtered = [...data];
    if (search.trim()) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.name.toLowerCase().includes(lower) ||
          u.username.toLowerCase().includes(lower) ||
          (u.email && u.email.toLowerCase().includes(lower))
      );
    }
    if (filterJobRole) {
      filtered = filtered.filter(
        (u) => u.jobrole && u.jobrole === filterJobRole
      );
    }
    if (sortBy) {
      filtered.sort((a, b) => {
        if (!a[sortBy]) return 1;
        if (!b[sortBy]) return -1;
        return a[sortBy].localeCompare(b[sortBy]);
      });
    }

    return filtered;
  }, [data, search, filterJobRole, sortBy]);

  const Row = ({ index, style }) => {
    const user = filteredData[index];
    return (
      <div
        style={{
          ...style,
          top: `${parseFloat(style.top) + 5}px`,
          height: `${parseFloat(style.height) - 5}px`,
          paddingLeft: "10px",
          paddingRight: "10px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            border: "1px solid #ccc",
            borderRadius: "8px",
            padding: "10px",
            background: "#f9f9f9ff",
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            gap: "20px",
          }}
        >
          <strong>{user.name}</strong>
          <small>username: {user.username}</small>
          {user.dob && <small>DOB: {user.dob}</small>}
          {user.email && <small>Email: {user.email}</small>}
          {user.jobrole && <small>Job Role: {user.jobrole}</small>}
        </div>
      </div>
    );
  };

  // Get unique job roles for filter dropdown
  const jobRoles = [...new Set(data.map((u) => u.jobrole).filter(Boolean))];

  return (
    <div style={{ marginTop: "20px", padding: "0 10px" }}>

      {/* Search and filter controls */}
      <div
        style={{
          marginBottom: "10px",
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <button
          onClick={() => navigate("/admin/add-user")}
          style={{ padding: "6px 12px" }}
        >
          +
        </button>
        <input
          type="search"
          placeholder="Search by name, username, or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: "1 1 300px", padding: "6px 10px" }}
        />

        <select
          value={filterJobRole}
          onChange={(e) => setFilterJobRole(e.target.value)}
          style={{ padding: "6px 10px" }}
        >
          <option value="">All Job Roles</option>
          {jobRoles.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{ padding: "6px 10px" }}
        >
          <option value="">Sort By</option>
          <option value="name">Name</option>
          <option value="username">Username</option>
          <option value="jobrole">Job Role</option>
        </select>

      </div>

      {/* The list */}
      {filteredData.length > 0 ? (
        <List
          height={window.innerHeight * 0.8}
          itemCount={filteredData.length}
          itemSize={53}
          width={"100%"}
          style={{ overflowX: "hidden" }}
        >
          {Row}
        </List>
      ) : (
        <p>No users found.</p>
      )}
    </div>
  );
}
