import React, { useState, useEffect } from "react";
import { adminAPI } from "./services/api";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const getId = (u) => u?.id ?? u?._id;

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setErr(null);
      const res = await adminAPI.getAllUsers();
      setUsers(res.data || []);
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || "Load users failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditingUser((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    try {
      const id = getId(editingUser);
      if (!id) throw new Error("Missing user id");
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
      alert(e?.response?.data?.message || e.message || "Update failed");
    }
  };

  const cancelEdit = () => setEditingUser(null);

  const deleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await adminAPI.deleteUser(userId);
      await fetchUsers();
    } catch (e) {
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
              <div className="post-box" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 32 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
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
                        value={editingUser.email || ""}
                        onChange={handleEditChange}
                        placeholder="Email"
                        required
                      />
                      <input
                        name="role"
                        value={editingUser.role || ""}
                        onChange={handleEditChange}
                        placeholder="Role"
                        required
                      />
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
                      <strong>Username:</strong> {u.username}
                      <br />
                      <strong>Email:</strong> {u.email}
                      <br />
                      <strong>Role:</strong> {u.role}
                      <br />
                      <strong>Active:</strong> {u.is_active ? "Yes" : "No"}
                      <br />
                    </>
                  )}
                </div>
                {!isEditing && (
                  <div style={{ display: "flex", flexDirection: "row", gap: 8, alignItems: "flex-start", marginLeft: 12 }}>
                    <button onClick={() => setEditingUser(u)}>Edit</button>
                    <button className="danger" onClick={() => deleteUser(id)}>
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
