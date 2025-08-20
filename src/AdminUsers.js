// src/AdminUsers.js
import React, { useState, useEffect } from "react";
import { adminAPI } from "./services/api"; // ✅ 使用封装好的后端客户端（/admin/...）

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  // 统一取 id（兼容 id / _id）
  const getId = (u) => u?.id ?? u?._id;

  // 拉取用户列表（GET /admin/users）
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setErr(null);
      const res = await adminAPI.getAllUsers();
      setUsers(res.data || []);
    } catch (e) {
      console.error("Error fetching users:", e?.response || e);
      setErr(e?.response?.data?.message || e.message || "Load users failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 编辑表单输入处理
  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditingUser((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // 保存编辑（PUT /admin/users/:id）
  const saveEdit = async (e) => {
    e.preventDefault();
    try {
      const id = getId(editingUser);
      if (!id) throw new Error("Missing user id");
      // 可根据后端字段精简 payload
      const payload = {
        username: editingUser.username,
        email: editingUser.email,
        avatar: editingUser.avatar,
        role: editingUser.role,
        is_active: !!editingUser.is_active,
      };
      await adminAPI.updateUser(id, payload);
      setEditingUser(null);
      await fetchUsers();
    } catch (e) {
      console.error("Error updating user:", e?.response || e);
      alert(e?.response?.data?.message || e.message || "Update failed");
    }
  };

  // 取消编辑
  const cancelEdit = () => setEditingUser(null);

  // DELETE /admin/users/:id）
const deleteUser = async (userId) => {
  if (!window.confirm("Are you sure you want to delete this user?")) return;
  try {
    await adminAPI.deleteUser(userId);
    await fetchUsers();
  } catch (e) {
    console.error("Error deleting user:", e, e?.response?.data);
    alert(e?.response?.data?.message || e.message || "Delete failed");
  }
};


  if (loading) return <div className="container">Loading…</div>;
  if (err) return <div className="container" style={{ color: "crimson" }}>{err}</div>;

  return (
    <div className="container">
      <h2>Admin · Manage Users</h2>
      <ul className="list">
        {users.length === 0 && <li className="muted">No users found.</li>}
        {users.map((u) => {
          const id = getId(u);
          const isEditing = editingUser && getId(editingUser) === id;
          return (
            <li key={id} className="list-row">
              {isEditing ? (
                <form onSubmit={saveEdit} className="edit-form">
                  <input
                    name="username"
                    value={editingUser.username || ""}
                    onChange={handleEditChange}
                    placeholder="Username"
                    required
                  />
                  <input
                    name="email"
                    type="email"
                    value={editingUser.email || ""}
                    onChange={handleEditChange}
                    placeholder="Email"
                    required
                  />
                  <input
                    name="avatar"
                    value={editingUser.avatar || ""}
                    onChange={handleEditChange}
                    placeholder="Avatar URL"
                  />
                  <select
                    name="role"
                    value={editingUser.role || "user"}
                    onChange={handleEditChange}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                  <label style={{ marginLeft: 8 }}>
                    Active:&nbsp;
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={!!editingUser.is_active}
                      onChange={handleEditChange}
                    />
                  </label>
                  <div style={{ display: "inline-flex", gap: 8, marginLeft: 12 }}>
                    <button type="submit">Save</button>
                    <button type="button" onClick={cancelEdit}>
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div>
                    <strong>{u.username}</strong>{" "}
                    <span className="muted">({u.role})</span>
                    <br />
                    <span>Email: {u.email}</span>
                    <br />
                    {u.avatar && (
                      <>
                        <span>
                          Avatar:{" "}
                          <a
                            href={u.avatar}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View
                          </a>
                        </span>
                        <br />
                      </>
                    )}
                    <span>Active: {u.is_active ? "Yes" : "No"}</span>
                    <br />
                    {u.created_at && <span>Created: {u.created_at}</span>}
                    <br />
                    {u.updated_at && <span>Updated: {u.updated_at}</span>}
                  </div>
                  <div className="actions">
                    <button onClick={() => setEditingUser(u)}>Edit</button>
                    <button
                      className="danger"
                      onClick={() => deleteUser(id)}
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
