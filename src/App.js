// src/App.js
import "./App.css";
import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink,
  useLocation,
  Navigate,
  useNavigate,
} from "react-router-dom";

import AdminUsers from "./AdminUsers";
import AdminPosts from "./AdminPosts";
import AdminPlaces from "./AdminPlaces";
import AddPlace from "./AddPlace";
import Login from "./Login";
import AdminAnalytics from "./AdminAnalytics";
import "./admin.min.css";
import "./admin-custom.css";

function RequireAdmin({ children }) {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user?.role === "admin") return children;
  } catch (_) {}
  return <Navigate to="/login" replace />;
}

function HeaderNav({ isLoggedIn, username, onLogout }) {
  const location = useLocation();
  const hideHeader = location.pathname === "/login" || location.pathname === "/";

  if (hideHeader) return null;

  return (
    <div className="header">
      <div
        className="logo-title"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          padding: "1rem",
          justifyContent: "center",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "1.8rem", color: "#394150" }}>
          Chi-go Admin
        </h1>
      </div>

      <div
        className="admin-nav"
        style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "1.5rem" }}
      >
        <NavLink to="/admin/users" className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}>
          Manage Users
        </NavLink>
        <NavLink to="/admin/posts" className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}>
          User Posts
        </NavLink>
        <NavLink to="/admin/places" className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}>
          View Places
        </NavLink>
        <NavLink to="/admin/add" className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}>
          Add Place
        </NavLink>
        <NavLink to="/admin/analytics" className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}>
          Analytics
        </NavLink>

        {!isLoggedIn ? (
          <NavLink to="/login" className="nav-item">
            Login
          </NavLink>
        ) : (
          <>
            <span style={{ color: "#394150", fontWeight: 500 }}>
              Hello, {username || "Admin"}
            </span>
            <button
              className="nav-item"
              style={{
                background: "#fff",
                color: "#333",
                border: "1px solid #ddd",
                borderRadius: "6px",
                cursor: "pointer",
              }}
              onClick={onLogout}
            >
              Logout
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function AppRoutes({ isLoggedIn, setIsLoggedIn, username, setUsername }) {
  const navigate = useNavigate();

  // 刷新后恢复登录态
  useEffect(() => {
    try {
      const cached = JSON.parse(localStorage.getItem("user") || "{}");
      if (cached?.username) setUsername(cached.username);
      if (cached?.role) setIsLoggedIn(true);
    } catch (_) {}
  }, [setIsLoggedIn, setUsername]);

  const handleLogout = () => {
    try {
      localStorage.removeItem("user");
    } catch (_) {}
    setIsLoggedIn(false);
    setUsername("");
    navigate("/login", { replace: true });
  };

  return (
    <>
      <HeaderNav isLoggedIn={isLoggedIn} username={username} onLogout={handleLogout} />

      <div className="content">
        <Routes>
          {/* 登录页 */}
          <Route
            path="/login"
            element={<Login setIsLoggedIn={setIsLoggedIn} setUsername={setUsername} />}
          />

          {/* 受保护的后台路由 */}
          <Route
            path="/admin/users"
            element={
              <RequireAdmin>
                <AdminUsers />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/posts"
            element={
              <RequireAdmin>
                <AdminPosts />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/places"
            element={
              <RequireAdmin>
                <AdminPlaces />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/add"
            element={
              <RequireAdmin>
                <AddPlace />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <RequireAdmin>
                <AdminAnalytics />
              </RequireAdmin>
            }
          />

          {/* 其它页面/占位 */}
          <Route
            path="/user"
            element={
              <div style={{ padding: "2rem", textAlign: "center" }}>
                <h2>User Page Placeholder</h2>
              </div>
            }
          />

          {/* 默认：去登录 */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </>
  );
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");

  return (
    <Router>
      <AppRoutes
        isLoggedIn={isLoggedIn}
        setIsLoggedIn={setIsLoggedIn}
        username={username}
        setUsername={setUsername}
      />
    </Router>
  );
}
