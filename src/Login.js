import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import { auth } from "./services/api"; // ★ 新增：使用封装的 /auth 实例

export default function Login({ setIsLoggedIn, setUsername }) {
  const [mode, setMode] = useState("login");       // "login" | "register"
  const [role, setRole] = useState("admin");       // 注册时使用
  const [usernameInput, setUsernameInput] = useState("");
  const [email, setEmail] = useState("");          // 仅注册用
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (mode === "login") {
        // 登录：POST /auth/login
        const res = await auth.post("/login", {
          username: usernameInput,
          password,
        });

        const data = res.data || {};
        // 这里可按需保存 token/用户信息
        localStorage.setItem("user", JSON.stringify(data));

        setIsLoggedIn?.(true);
        setUsername?.(data.username || "");

        if (role === "admin") {
          navigate("/admin/users");   // 管理端首页
        } else {
          navigate("/user");          // 普通用户页
        }
      } else {
        // 注册：POST /auth/register
        const res = await auth.post("/register", {
          username: usernameInput,
          email,
          password,
          role, // 你页面里有 Role 下拉，顺手带上
        });

        // 成功
        alert("Registration successful!");
        setMode("login");
      }
    } catch (err) {
      // 统一错误提示
      const status = err?.response?.status;
      if (mode === "login") {
        alert(status === 401 ? "Invalid credentials" : "Login failed");
      } else {
        alert(status === 409 ? "Email has been registered!" : "Registration failed!");
      }
      console.error(`${mode} error:`, err);
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
            <select value={role} onChange={(e) => setRole(e.target.value)} required>
              <option value="admin">Admin</option>
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
