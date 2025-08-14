import React, { useState } from "react";
import "./AddPlace.css";
import { adminAPI } from "./services/api"; // ✅ 使用封装好的后端客户端

export default function AddPlace() {
  const [form, setForm] = useState({
    category: "Attraction",
    name: "",
    description: "",
    image: "",
    location_lat: "",
    location_lng: "",
    location_address: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Add this function
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prevForm) => ({
      ...prevForm,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    try {
      // 规范化/校验
      const lat = parseFloat(form.location_lat);
      const lng = parseFloat(form.location_lng);
      if (Number.isNaN(lat) || Number.isNaN(lng)) {
        alert("Latitude/Longitude must be valid numbers.");
        setSubmitting(false);
        return;
      }

      // 关键：location 做成对象，isActive 用驼峰
      const payload = {
        name: form.name,
        description: form.description,
        image: form.image || undefined,
        location: {
          lat,
          lng,
          address: form.location_address,
        },
        isActive: true, // 注意字段名
      };

      console.log('提交的 payload:', payload);

      // 按分类走不同的 admin 接口
      if (form.category === "Attraction") {
        await adminAPI.createAttraction(payload); // POST /admin/attractions
      } else if (form.category === "Restaurant") {
        await adminAPI.createRestaurant(payload); // POST /admin/restaurants
      } else {
        throw new Error("Unknown category: " + form.category);
      }

      alert("Place added successfully!");
      // 清表单
      setForm({
        category: "Attraction",
        name: "",
        description: "",
        image: "",
        location_lat: "",
        location_lng: "",
        location_address: "",
      });
    } catch (err) {
      console.error("Error adding place:", err?.response || err);
      alert(err?.response?.data?.message || err.message || "Add failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="add-place-container">
      <h2 className="form-title">Admin · Add Attraction/Restaurant</h2>
      <form onSubmit={handleSubmit} className="card add-place-form">
        <div className="form-group">
          <label>Category</label>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className="form-select"
          >
            <option value="Attraction">Attraction</option>
            <option value="Restaurant">Restaurant</option>
          </select>
        </div>

        <div className="form-group">
          <label>Name</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="e.g., City Museum"
            required
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Short description"
            required
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label>Image URL</label>
          <input
            name="image"
            value={form.image}
            onChange={handleChange}
            placeholder="https://..."
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label>Latitude</label>
          <input
            name="location_lat"
            value={form.location_lat}
            onChange={handleChange}
            placeholder="e.g., 41.8781"
            required
            className="form-input"
            type="number"
            step="any"
          />
        </div>

        <div className="form-group">
          <label>Longitude</label>
          <input
            name="location_lng"
            value={form.location_lng}
            onChange={handleChange}
            placeholder="e.g., -87.6298"
            required
            className="form-input"
            type="number"
            step="any"
          />
        </div>

        <div className="form-group">
          <label>Address</label>
          <input
            name="location_address"
            value={form.location_address}
            onChange={handleChange}
            placeholder="e.g., 123 Main St"
            required
            className="form-input"
          />
        </div>

        <button type="submit" className="submit-btn" disabled={submitting}>
          {submitting ? "Adding..." : "Add Place"}
        </button>
      </form>
    </div>
  );
}
