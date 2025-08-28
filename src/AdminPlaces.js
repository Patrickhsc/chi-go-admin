import React, { useState, useEffect, useMemo } from "react";
import { attractionsAPI, restaurantsAPI, adminAPI } from "./services/api";

// Read backend API base URL from environment, fallback to empty string
const API_BASE = process.env.REACT_APP_API_BASE || "";

export default function AdminPlaces() {
  // States for places, filtering, editing, loading, error, and image uploading
  const [places, setPlaces] = useState([]);
  const [query, setQuery] = useState("");
  const [filteredPlaces, setFilteredPlaces] = useState([]);
  const [editingPlace, setEditingPlace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [uploading, setUploading] = useState(false); // For image upload feedback

  // Helper to get id (supports both 'id' and '_id' fields)
  const getId = (p) => p?.id ?? p?._id;

  // Normalize place object to support both location object and flat fields
  const normalizePlace = (p, category) => {
    const loc = p.location || {};
    return {
      ...p,
      category,
      location_lat: loc.lat ?? p.location_lat ?? "",
      location_lng: loc.lng ?? p.location_lng ?? "",
      location_address: loc.address ?? p.location_address ?? "",
      is_active:
        typeof p.is_active !== "undefined"
          ? p.is_active
          : typeof p.isActive !== "undefined"
          ? p.isActive
          : true,
    };
  };

  // Load places from backend on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const [aRes, rRes] = await Promise.all([
          attractionsAPI.getAll(),
          restaurantsAPI.getAll(),
        ]);
        const attractions = (aRes.data || []).map((x) =>
          normalizePlace(x, "Attraction")
        );
        const restaurants = (rRes.data || []).map((x) =>
          normalizePlace(x, "Restaurant")
        );
        const all = [...attractions, ...restaurants];
        if (!mounted) return;
        setPlaces(all);
        setFilteredPlaces(all);
      } catch (e) {
        setErr(e?.response?.data?.message || e.message || "Load places failed");
      } finally {
        mounted && setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Search functionality for places
  const handleSearch = () => {
    const q = query.trim().toLowerCase();
    if (!q) {
      setFilteredPlaces(places);
      return;
    }
    setFilteredPlaces(
      places.filter((p) =>
        [p.category, p.name, p.location_address, p.description]
          .filter(Boolean)
          .some((f) => String(f).toLowerCase().includes(q))
      )
    );
  };

  // Search on Enter key press
  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  // Prepare editing state for a place
  const editPlace = (place) => {
    setEditingPlace({
      name: place.name || "",
      description: place.description || "",
      location_address: place.location_address || "",
      location_lat: place.location_lat || "",
      location_lng: place.location_lng || "",
      image: place.image || "",
      is_active:
        typeof place.is_active === "undefined" ? true : place.is_active,
      category: place.category,
      id: getId(place),
      _id: place._id,
    });
  };

  // Handle editing field changes (text, checkbox)
  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditingPlace((prev) => ({
      ...prev,
      [name]:
        name === "is_active"
          ? type === "checkbox"
            ? checked
            : value === "true"
          : type === "checkbox"
          ? checked
          : value,
    }));
  };

  // Handle image file upload (same logic as AddPlace)
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      // Use the adminAPI helper for uploading image
      const url = await adminAPI.uploadImage(file);
      setEditingPlace((prev) => ({
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

  // Choose admin API endpoints based on place category
  const getAdminOps = (place) => {
    if (place.category === "Attraction") {
      return {
        update: adminAPI.updateAttraction,
        remove: adminAPI.deleteAttraction,
      };
    }
    if (place.category === "Restaurant") {
      return {
        update: adminAPI.updateRestaurant,
        remove: adminAPI.deleteRestaurant,
      };
    }
    throw new Error("Unknown category: " + place.category);
  };

  // Save the place after editing (PUT to admin endpoint)
  const saveEdit = async (e) => {
    e.preventDefault();
    try {
      const id = getId(editingPlace);
      if (!id) throw new Error("Missing place id");

      // Prepare payload in backend expected format
      const payload = {
        name: editingPlace.name,
        description: editingPlace.description,
        image: editingPlace.image,
        location: {
          lat: editingPlace.location_lat,
          lng: editingPlace.location_lng,
          address: editingPlace.location_address,
        },
        isActive: !!editingPlace.is_active,
      };

      const { update } = getAdminOps(editingPlace);
      await update(id, payload);

      // Update local state
      setPlaces((prev) =>
        prev.map((p) =>
          getId(p) === id
            ? {
                ...p,
                ...editingPlace,
                location_lat: editingPlace.location_lat,
                location_lng: editingPlace.location_lng,
                location_address: editingPlace.location_address,
                is_active: editingPlace.is_active,
              }
            : p
        )
      );
      setFilteredPlaces((prev) =>
        prev.map((p) =>
          getId(p) === id
            ? {
                ...p,
                ...editingPlace,
                location_lat: editingPlace.location_lat,
                location_lng: editingPlace.location_lng,
                location_address: editingPlace.location_address,
                is_active: editingPlace.is_active,
              }
            : p
        )
      );
      setEditingPlace(null);
    } catch (e) {
      alert(e?.response?.data?.message || e.message || "Update failed");
    }
  };

  // Cancel editing
  const cancelEdit = () => setEditingPlace(null);

  // Delete a place
  const deletePlace = async (id, place) => {
    if (!window.confirm("Are you sure you want to delete this place?")) return;
    try {
      const { remove } = getAdminOps(place);
      await remove(id);

      setPlaces((prev) => prev.filter((p) => getId(p) !== id));
      setFilteredPlaces((prev) => prev.filter((p) => getId(p) !== id));
    } catch (e) {
      alert(e?.response?.data?.message || e.message || "Delete failed");
    }
  };

  // Filter attractions and restaurants
  const attractions = useMemo(
    () => filteredPlaces.filter((p) => p.category === "Attraction"),
    [filteredPlaces]
  );
  const restaurants = useMemo(
    () => filteredPlaces.filter((p) => p.category === "Restaurant"),
    [filteredPlaces]
  );

  // Render each place row (read or edit mode)
  const renderPlaceRow = (place) => (
    <li key={getId(place)} className="list-row">
      {editingPlace && getId(editingPlace) === getId(place) ? (
        <form onSubmit={saveEdit} className="edit-form">
          {/* Editable fields for name, description, address, lat/lng */}
          <input
            name="name"
            value={editingPlace.name || ""}
            onChange={handleEditChange}
            placeholder="Name"
            required
          />
          <input
            name="description"
            value={editingPlace.description || ""}
            onChange={handleEditChange}
            placeholder="Description"
          />
          <input
            name="location_address"
            value={editingPlace.location_address || ""}
            onChange={handleEditChange}
            placeholder="Address"
          />
          <input
            name="location_lat"
            value={editingPlace.location_lat || ""}
            onChange={handleEditChange}
            placeholder="Latitude"
          />
          <input
            name="location_lng"
            value={editingPlace.location_lng || ""}
            onChange={handleEditChange}
            placeholder="Longitude"
          />

          {/* Image upload input, using the same logic as AddPlace */}
          <div style={{ margin: "6px 0" }}>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading}
            />
          </div>
          {/* Show image preview if there is one */}
          {editingPlace.image && (
            <div style={{ margin: "6px 0" }}>
              <img
                src={
                  editingPlace.image.startsWith("http")
                    ? editingPlace.image
                    : API_BASE + editingPlace.image
                }
                alt="preview"
                style={{ maxWidth: 80, maxHeight: 80, border: "1px solid #eee" }}
              />
            </div>
          )}
          {/* Image URL, can be manually edited as well */}
          <input
            name="image"
            value={editingPlace.image || ""}
            onChange={handleEditChange}
            placeholder="Image URL"
            style={{ width: "60%" }}
          />

          {/* Active checkbox */}
          <label style={{ marginLeft: "8px" }}>
            <input
              name="is_active"
              type="checkbox"
              checked={!!editingPlace.is_active}
              onChange={handleEditChange}
            />
            Active
          </label>
          <div style={{ display: "inline-flex", gap: 8, marginLeft: 8 }}>
            <button type="submit" disabled={uploading}>
              Save
            </button>
            <button type="button" onClick={cancelEdit} disabled={uploading}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        // Display mode for place row
        <>
          <div>
            <strong>{place.category}</strong> — {place.name}
            <div className="muted">
              <span>Description: {place.description}</span>
              <br />
              <span>Address: {place.location_address}</span>
              <br />
              <span>
                Lat/Lng: {place.location_lat}, {place.location_lng}
              </span>
              <br />
              {place.image && (
                <>
                  <span>
                    Image:{" "}
                    <a
                      href={
                        place.image.startsWith("http")
                          ? place.image
                          : API_BASE + place.image
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View
                    </a>
                  </span>
                  <br />
                </>
              )}
              {typeof place.is_active !== "undefined" && (
                <>
                  <span>Active: {place.is_active ? "Yes" : "No"}</span>
                  <br />
                </>
              )}
              {place.created_at && (
                <>
                  <span>Created: {place.created_at}</span>
                  <br />
                </>
              )}
              {place.updated_at && <span>Updated: {place.updated_at}</span>}
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
            <button onClick={() => editPlace(place)}>Edit</button>
            <button
              className="danger"
              onClick={() => deletePlace(getId(place), place)}
            >
              Delete
            </button>
          </div>
        </>
      )}
    </li>
  );

  if (loading)
    return <div className="container">Loading…</div>;
  if (err)
    return (
      <div className="container" style={{ color: "crimson" }}>
        {err}
      </div>
    );

  return (
    <div className="container">
      <h2>Admin · All Attractions/Restaurants</h2>
      <div
        className="card"
        style={{
          marginBottom: "1rem",
          padding: "1rem",
          display: "flex",
          alignItems: "center",
        }}
      >
        <input
          placeholder="Search by type/name/address/code"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          style={{ width: "80%", padding: "0.5rem", boxSizing: "border-box" }}
        />
        <button
          onClick={handleSearch}
          style={{
            marginLeft: "0.5rem",
            padding: "0.3rem 0.6rem",
            backgroundColor: "#d52349",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "0.9rem",
          }}
        >
          Search
        </button>
      </div>

      {/* Attractions section */}
      <div className="card" style={{ marginTop: "1rem" }}>
        <h3>Attractions</h3>
        <ul className="list">
          {attractions.map(renderPlaceRow)}
          {attractions.length === 0 && <li className="muted">No results</li>}
        </ul>
      </div>

      {/* Restaurants section */}
      <div className="card" style={{ marginTop: "1rem" }}>
        <h3>Restaurants</h3>
        <ul className="list">
          {restaurants.map(renderPlaceRow)}
          {restaurants.length === 0 && <li className="muted">No results</li>}
        </ul>
      </div>
    </div>
  );
}
