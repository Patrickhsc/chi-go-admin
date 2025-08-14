// src/AdminRoutes.js
// 用法（示例，在 App.js 里）：
// import { AdminNav, AdminRoutes } from "./AdminRoutes";
// ...
// <BrowserRouter>
//   <Header />
//   <AdminNav />               // 显示后台导航
//   <Routes>
//     <Route path="/" element={<Home />} />
//     {/* 你的其他前台路由 */}
//     <AdminRoutes />          // 注入后台路由
//   </Routes>
// </BrowserRouter>

import React from "react";
import { NavLink, Route, Navigate } from "react-router-dom";
import AdminUsers from "./AdminUsers";
import AdminPosts from "./AdminPosts";
import AdminPlaces from "./AdminPlaces";
import AddPlace from "./AddPlace";

// 简单鉴权：要求本地存的 user.role === 'admin'
function RequireAdmin({ children }) {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user?.role === "admin") return children;
  } catch (_) {}
  return <Navigate to="/login" replace />;
}

export function AdminNav() {
  const baseStyle = {
    padding: "8px 12px",
    textDecoration: "none",
    borderRadius: 6,
    marginRight: 8,
  };
  const activeStyle = { background: "#222", color: "#fff" };

  return (
    <nav className="admin-nav" style={{ padding: 12 }}>
      <NavLink
        to="/admin/users"
        style={({ isActive }) => ({ ...baseStyle, ...(isActive ? activeStyle : {}) })}
      >
        Manage Users
      </NavLink>
      <NavLink
        to="/admin/posts"
        style={({ isActive }) => ({ ...baseStyle, ...(isActive ? activeStyle : {}) })}
      >
        User Posts
      </NavLink>
      <NavLink
        to="/admin/places"
        style={({ isActive }) => ({ ...baseStyle, ...(isActive ? activeStyle : {}) })}
      >
        View Places
      </NavLink>
      <NavLink
        to="/admin/add"
        style={({ isActive }) => ({ ...baseStyle, ...(isActive ? activeStyle : {}) })}
      >
        Add Place
      </NavLink>
    </nav>
  );
}

export function AdminRoutes() {
  return (
    <>
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
    </>
  );
}
