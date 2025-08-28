import React, { useState } from "react";
import "./AddPlace.css";
// Import your API helper if you have one, or use fetch directly
// import { adminAPI, uploadImage } from "./services/api"; 

// You can modify this to match your backend API base URL if needed
const API_BASE = ""; // e.g. "http://localhost:5000" or production base

export default function AddPlace() {
  // State for form fields
  const [form, setForm] = useState({
    category: "Attraction",
    name: "",
    description: "",
    image: "", // This will store the URL returned by backend after uploading
    location_lat: "",
    location_lng: "",
    location_address: "",
  });

  // State for submission and uploading status
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Handle change for text input fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prevForm) => ({
      ...prevForm,
      [name]: value,
    }));
  };

  // Handle file selection and upload to backend
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      // Prepare form data for file upload
      const formData = new FormData();
      formData.append("file", file);

      // Send POST request to backend upload endpoint
      const res = await fetch(API_BASE + "/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      // If upload is successful, set the returned URL to form.image
      if (data.url) {
        setForm((prevForm) => ({
          ...prevForm,
          image: data.url,
        }));
        alert("Image uploaded successfully!");
      } else {
        alert("Image upload failed.");
      }
    } catch (err) {
      alert("Image upload failed: " + (err?.message || "Unknown error"));
    } finally {
      setUploading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    try {
      // Validate latitude and longitude inputs
      const lat = parseFloat(form.location_lat);
      const lng = parseFloat(form.location_lng);
      if (Number.isNaN(lat) || Number.isNaN(lng)) {
        alert("Latitude/Longitude must be valid numbers.");
        setSubmitting(false);
        return;
      }

      // Build payload structure for backend
      const payload = {
        name: form.name,
        description: form.description,
        image: form.image || undefined,
        location: {
          lat,
          lng,
          address: form.location_address,
        },
        isActive: true,
      };

      // Choose API endpoint based on category
      let apiEndpoint = "";
      if (form.category === "Attraction") {
        apiEndpoint = API_BASE + "/admin/attractions";
      } else if (form.category === "Restaurant") {
        apiEndpoint = API_BASE + "/admin/restaurants";
      } else {
        throw new Error("Unknown category: " + form.category);
      }

      // Send POST request to backend to add the place
      const res = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        credentials: "include", // If your backend needs auth cookies
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Add failed");
      }

      alert("Place added successfully!");
      // Reset form after successful submission
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
      alert(err?.message || "Add failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="add-place-container">
      <h2 className="form-title">Admin · Add Attraction/Restaurant</h2>
      <form onSubmit={handleSubmit} className="card add-place-form">
        {/* Category select */}
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

        {/* Name input */}
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

        {/* Description input */}
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

        {/* Image upload */}
        <div className="form-group">
          <label>Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="form-input"
            disabled={uploading}
          />
          {/* Show preview if image URL exists */}
          {form.image && (
            <div style={{ marginTop: 8 }}>
              <img
                src={
                  form.image.startsWith("http") || form.image.startsWith("/")
                    ? API_BASE + form.image
                    : form.image
                }
                alt="Preview"
                style={{ maxWidth: 180, maxHeight: 120 }}
              />
            </div>
          )}
        </div>

        {/* Latitude input */}
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

        {/* Longitude input */}
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

        {/* Address input */}
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

        {/* Submit button */}
        <button type="submit" className="submit-btn" disabled={submitting || uploading}>
          {submitting ? "Adding..." : "Add Place"}
        </button>
      </form>
    </div>
  );
}
