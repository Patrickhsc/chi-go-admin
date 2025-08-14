import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

export default function Login({ setIsLoggedIn, setUsername }) {
  const [mode, setMode] = useState("login"); // "login" or "register"
  const [role, setRole] = useState("admin");
  const [usernameInput, setUsernameInput] = useState("");
  const [email, setEmail] = useState(""); // Only used in register mode
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === "login") {
      // Login logic
      fetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username: usernameInput, password }),
      })
        .then((res) => {
          if (res.ok) {
            return res.json();
          } else {
            throw new Error("Invalid credentials");
          }
        })
        .then((data) => {
          setIsLoggedIn(true);
          if (setUsername) setUsername(data.username || "");
          if (role === "admin") {
            navigate("/admin/users"); // Redirect to admin dashboard
          } else {
            navigate("/user"); // Redirect to user page
          }
        })
        .catch((err) => {
          console.error("Login failed:", err);
          alert("Incorrect credentials!");
        });
    } else {
      // Register logic
      fetch("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username: usernameInput, email, password }),
      })
        .then((res) => {
          if (res.ok) {
            return res.json();
          } else if (res.status === 409) {
            // Email already registered
            throw new Error("409");
          } else {
            throw new Error("Registration failed");
          }
        })
        .then((data) => {
          alert("Registration successful!");
          setMode("login"); // Switch back to login mode
        })
        .catch((err) => {
          if (err.message === "409") {
            alert("Email has been registered!");
          } else {
            alert("Registration failed!");
          }
          console.error("Error registering user:", err);
        });
    }
  };

  return (
    <div>
    <div
        className="header"
        style={{
            backgroundColor: "#333",
            padding: "1rem 0",
            width: "100vw",
            marginLeft: "calc(50% - 50vw)",
            marginRight: "calc(50% - 50vw)",
            boxSizing: "border-box",
        }}
        >
        <h1 style={{ margin: 0, color: "#fff", textAlign: "center" }}>
            Welcome to Chi-go
        </h1>
        </div>

    <div className="login-container">
      <h2>{mode === "login" ? "Login" : "Register"}</h2>
      <form onSubmit={handleSubmit} className="login-form">
        <div className="form-group">
          <label>Role:</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            required
          >
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
        </div>
        <div className="form-group">
          <label>Username:</label>
          <input
            type="text"
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value)}
            required
          />
        </div>
        {mode === "register" && (
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        )}
        <div className="form-group">
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="submit-btn">
          {mode === "login" ? "Login" : "Register"}
        </button>
      </form>
      <div className="toggle-container">
        <span
          className="toggle-link"
          onClick={() => setMode(mode === "login" ? "register" : "login")}
        >
          {mode === "login" ? "Switch to Register" : "Switch to Login"}
        </span>
      </div>
    </div>
    </div>
  );
}