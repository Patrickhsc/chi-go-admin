import React, { useState } from "react";
import "./AddPlace.css";
// Import the adminAPI helper for consistent backend calls
import { adminAPI, uploadImage } from "./services/api"; 

export default function AddPlace() {
  // State for form fields
  const [form, setForm] = useState({
    category: "Attraction",
    name: "",
    description: "",
    image: "", // Will store backend-returned image URL
    location_lat: "",
    location_lng: "",
    location_address: "",
  });

  // State for UI feedback
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Handle changes to text input fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle file selection and upload to backend
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      // Use the unified API helper for image upload
      const url = await adminAPI.uploadImage(file);
      setForm((prev) => ({
        ...prev,
        image: url,
      }));
      alert("Image uploaded successfully!");
    } catch (err) {
      alert("Image upload failed: " + (err?.message || "Unknown error"));
    } finally {
      setUploading(false);
    }
  };

  // Handle form submission to add a new place
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    try {
      // Validate latitude and longitude
      const lat = parseFloat(form.location_lat);
      const lng = parseFloat(form.location_lng);
      if (Number.isNaN(lat) || Number.isNaN(lng)) {
        alert("Latitude/Longitude must be valid numbers.");
        setSubmitting(false);
        return;
      }

      // Prepare payload for backend
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

      // Choose correct API call based on category
      if (form.category === "Attraction") {
        await adminAPI.createAttraction(payload);
      } else if (form.category === "Restaurant") {
        await adminAPI.createRestaurant(payload);
      } else {
        throw new Error("Unknown category: " + form.category);
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
          {/* Show preview if image URL is set */}
          {form.image && (
            <div style={{ marginTop: 8 }}>
              <img
                src={form.image}
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
