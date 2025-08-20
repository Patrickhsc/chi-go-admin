import React, { useState, useEffect } from "react";
import { adminAPI, communityAPI } from "./services/api"; // ✅ 使用封装好的 API

export default function AdminPosts() {
  const [posts, setPosts] = useState([]);
  const [editingPost, setEditingPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  // 兼容 id / _id
  const getId = (p) => p?.id ?? p?._id;

  // 拉取全部帖子（GET /admin/posts）
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const res = await adminAPI.getAllPosts(); // -> /admin/posts
        if (!mounted) return;
        setPosts(res.data || []);
      } catch (e) {
        console.error("Error fetching posts:", e?.response || e);
        setErr(e?.response?.data?.message || e.message || "Load posts failed");
      } finally {
        mounted && setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // 编辑输入
  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditingPost((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // 保存编辑（优先 /admin/posts/:id；否则回退 /api/posts/:id）
  const saveEdit = async (e) => {
    e.preventDefault();
    try {
      const id = getId(editingPost);
      if (!id) throw new Error("Missing post id");

      const payload = {
        title: editingPost.title,
        description: editingPost.description,
        is_public: !!editingPost.is_public,
      };

      const doUpdate =
        typeof adminAPI.updatePost === "function"
          ? adminAPI.updatePost
          : communityAPI.updatePost;

      const res = await doUpdate(id, payload);
      const updated = res.data || payload;

      setPosts((prev) =>
        prev.map((p) => (getId(p) === id ? { ...p, ...updated } : p))
      );
      setEditingPost(null);
    } catch (e) {
      console.error("Error updating post:", e?.response || e);
      alert(e?.response?.data?.message || e.message || "Update failed");
    }
  };

  const cancelEdit = () => setEditingPost(null);

  // 删除（DELETE /admin/posts/:id）
  const deletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await adminAPI.deletePost(postId);
      setPosts((prev) => prev.filter((p) => getId(p) !== postId));
    } catch (e) {
      console.error("Error deleting post:", e?.response || e);
      alert(e?.response?.data?.message || e.message || "Delete failed");
    }
  };

  if (loading) return <div className="container">Loading…</div>;
  if (err) return <div className="container" style={{ color: "crimson" }}>{err}</div>;

  return (
    <div className="container">
      <h2>Admin · All Posts</h2>
      <ul className="list">
        {posts.length === 0 && <li className="muted">No posts found.</li>}
        {posts.map((post) => {
          const id = getId(post);
          const isEditing = editingPost && getId(editingPost) === id;

          return (
            <li key={id} className="list-row">
              <div className="post-box">
                {isEditing ? (
                  <form onSubmit={saveEdit} className="edit-form">
                    <input
                      name="title"
                      value={editingPost.title || ""}
                      onChange={handleEditChange}
                      placeholder="Title"
                      required
                    />
                    <input
                      name="description"
                      value={editingPost.description || ""}
                      onChange={handleEditChange}
                      placeholder="Description"
                      required
                    />
                    <label style={{ marginLeft: 8 }}>
                      Public:&nbsp;
                      <input
                        type="checkbox"
                        name="is_public"
                        checked={!!editingPost.is_public}
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
                      <strong>Title:</strong> {post.title}
                      <br />
                      <strong>Description:</strong> {post.description}
                      <br />
                      <strong>User ID:</strong> {post.user_id}
                      <br />
                      <strong>Checklist:</strong>
                      <ul style={{ margin: "0 0 0 1em", padding: 0 }}>
                        {Array.isArray(post.checklist) && post.checklist.length > 0 ? (
                          post.checklist.map((item, idx) => (
                            <li key={idx}>
                              {item.name}{" "}
                              <span style={{ color: "#888" }}>
                                ({item.itemType})
                              </span>
                            </li>
                          ))
                        ) : (
                          <li style={{ color: "#888" }}>No items</li>
                        )}
                      </ul>
                      <strong>Public:</strong> {post.is_public ? "Yes" : "No"}
                      <br />
                      {post.created_at && (
                        <>
                          <strong>Created:</strong> {post.created_at}
                          <br />
                        </>
                      )}
                      {post.updated_at && (
                        <>
                          <strong>Updated:</strong> {post.updated_at}
                        </>
                      )}
                    </div>
                    <div className="actions">
                      <button onClick={() => setEditingPost(post)}>Edit</button>
                      <button className="danger" onClick={() => deletePost(id)}>
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
