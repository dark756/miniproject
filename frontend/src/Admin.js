import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { FixedSizeList as List } from "react-window";
import { useNavigate } from "react-router-dom";
import { FaTrash } from 'react-icons/fa';

export default function Admin({ name }) {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [filterJobRole, setFilterJobRole] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [delUser, setDelUser] = useState({})
  const [pop, setPop] = useState(false)
  const initDel = (user) => {
    setDelUser(user)
    setPop(true);
  }
  const deleteUser = async () => {
    const user = delUser;
    setPop(false);
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URI || "http://localhost:5000"}/delete-user`, { user }, {
        withCredentials: true,
        validateStatus: () => true,
      });

      if (res.status === 200) {
        setData(prevData => prevData.filter(u => u.username !== user.username));
        alert("User deleted successfully");
      } else {
        alert("Failed to delete user");
      }
    } catch (err) {
      alert("Error deleting user");
      console.error(err);
    }
  };
  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_API_URI || "http://localhost:5000"}/get-users`, {
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
          {user.username && <small>username: {user.username}</small>}
          {user.dob && <small>DOB: {user.dob}</small>}
          {user.email && <small>Email: {user.email}</small>}
          {user.jobrole && <small>Job Role: {user.jobrole}</small>}
          <button
            onClick={() => initDel(user)}
            style={{
              marginLeft: "auto",
              backgroundColor: "transparent",
              color: "#666",
              border: "none",
              cursor: "pointer",
              padding: "5px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <FaTrash size={16} />
          </button>
        </div>
      </div>
    );
  };


  const jobRoles = [...new Set(data.map((u) => u.jobrole).filter(Boolean))];

  return (
    <div style={{ marginTop: "20px", padding: "0 10px" }}>

      <div
        style={{
          marginBottom: "10px",
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
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

      {pop && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
          background: "rgba(0,0,0,0.34)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
        }}>
          <div style={{
            background: "white", borderRadius: "8px", padding: "30px 26px", boxShadow: "0 2px 18px #6667", width: "320px",
            textAlign: "center", fontSize: "17px"
          }}>
            <strong>Are you sure you want to delete {delUser.username ?? delUser.email}</strong>
            <div style={{ marginTop: 28, display: "flex", gap: 14, justifyContent: "center" }}>
              <button
                onClick={deleteUser}
                style={{ padding: "8px 22px", background: "#19d260ff", color: "#fff", border: "none", borderRadius: 4, fontWeight: 700, cursor: "pointer" }}>
                Confirm
              </button>
              <button
                onClick={
                  () => {
                    setDelUser(null);
                    setPop(false);
                  }
                }
                style={{ padding: "8px 22px", background: "#ee0d0dff", color: "#fff", border: "none", borderRadius: 4, fontWeight: 700, cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}