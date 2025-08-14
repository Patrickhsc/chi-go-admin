import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import "chart.js/auto";
import api, {
  adminAPI,
  communityAPI,
  attractionsAPI,
  restaurantsAPI,
} from "./services/api";

// Utility: Safely count items from various API response structures
const countOf = (data) => {
  if (!data) return 0;
  if (Array.isArray(data)) return data.length;
  if (Array.isArray(data.items)) return data.items.length;
  if (Array.isArray(data.data)) return data.data.length;
  if (typeof data.count === "number") return data.count;
  if (typeof data.total === "number") return data.total;
  return 0;
};

// Color palette for bar charts
const palette = [
  "rgba(75,192,192,0.7)",
  "rgba(255,99,132,0.7)",
  "rgba(255,205,86,0.7)",
  "rgba(54,162,235,0.7)",
  "rgba(153,102,255,0.7)",
  "rgba(201,203,207,0.7)",
  "rgba(255,159,64,0.7)"
];

// Chart container style for unified width
const chartContainerStyle = {
  maxWidth: 600,
  width: "100%",
  margin: "0 auto",
};

export default function AdminAnalytics() {
  const [totalUsers, setTotalUsers] = useState(0);
  const [attractions, setAttractions] = useState([]); // [{name, userCount}]
  const [restaurants, setRestaurants] = useState([]); // [{name, userCount}]
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Helper for generating color arrays for bars
  const getColors = (len) =>
    Array(len)
      .fill(0)
      .map((_, i) => palette[i % palette.length]);

  // Fetch analytics data on mount
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");

      try {
        // 1. Try unified analytics API first
        try {
          const res = await api.get("/admin/analytics");
          const d = res.data || {};
          if (typeof d.users !== "undefined") setTotalUsers(countOf(d.users));
          if (Array.isArray(d.attractions))
            setAttractions(
              d.attractions.map((x) => ({
                name: x.name ?? x.title ?? "Unknown",
                userCount: Number(x.userCount ?? x.count ?? 0),
              }))
            );
          if (Array.isArray(d.restaurants))
            setRestaurants(
              d.restaurants.map((x) => ({
                name: x.name ?? x.title ?? "Unknown",
                userCount: Number(x.userCount ?? x.count ?? 0),
              }))
            );
          setLoading(false);
          return;
        } catch (_) {
          // Fallback if API not found or fails
        }

        // 2. Get total users count (fallback)
        let usersCount = 0;
        try {
          const r = await api.get("/api/users/count");
          usersCount = countOf(r.data);
        } catch {
          try {
            const r2 = await adminAPI.getAllUsers();
            usersCount = countOf(r2.data);
          } catch {
            usersCount = 0;
          }
        }
        setTotalUsers(usersCount);

        // 3. Try to get rankings for attractions/restaurants
        let topAttr = [];
        let topRest = [];
        try {
          const r = await api.get("/api/places/rankings");
          const d = r.data || {};
          if (Array.isArray(d.attractions)) {
            topAttr = d.attractions.map((x) => ({
              name: x.name ?? x.title ?? "Unknown",
              userCount: Number(x.userCount ?? x.count ?? 0),
            }));
          }
          if (Array.isArray(d.restaurants)) {
            topRest = d.restaurants.map((x) => ({
              name: x.name ?? x.title ?? "Unknown",
              userCount: Number(x.userCount ?? x.count ?? 0),
            }));
          }
        } catch {
          // 4. Fallback: get all and set userCount to 0 if not found
          try {
            const a = await attractionsAPI.getAll();
            const list = a.data || [];
            topAttr = list.map((x) => ({
              name: x.name ?? x.title ?? "Unknown",
              userCount: Number(x.userCount ?? x.count ?? 0),
            }));
          } catch {
            topAttr = [];
          }
          try {
            const r = await restaurantsAPI.getAll();
            const list = r.data || [];
            topRest = list.map((x) => ({
              name: x.name ?? x.title ?? "Unknown",
              userCount: Number(x.userCount ?? x.count ?? 0),
            }));
          } catch {
            topRest = [];
          }
        }

        setAttractions(topAttr);
        setRestaurants(topRest);
      } catch (e) {
        // Set error message
        console.error("analytics error:", e?.response || e);
        setError(
          e?.response?.data?.message || e.message || "Failed to load analytics data."
        );
      } finally {
        setLoading(false);
      }
    };

    load();
    // Only run on mount
    // eslint-disable-next-line
  }, []);

  // Bar chart data for attractions
  const attractionData = {
    labels: attractions.map((a) => a.name),
    datasets: [
      {
        label: "Users",
        data: attractions.map((a) => a.userCount),
        backgroundColor: getColors(attractions.length),
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: "#fff",
        hoverBackgroundColor: getColors(attractions.length).map((c) =>
          c.replace(/0\.7/, "1")
        ),
      },
    ],
  };

  // Bar chart data for restaurants
  const restaurantData = {
    labels: restaurants.map((r) => r.name),
    datasets: [
      {
        label: "Users",
        data: restaurants.map((r) => r.userCount),
        backgroundColor: getColors(restaurants.length),
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: "#fff",
        hoverBackgroundColor: getColors(restaurants.length).map((c) =>
          c.replace(/0\.7/, "1")
        ),
      },
    ],
  };

  // Unified chart options for both charts
  const chartOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y || ctx.parsed}`,
        },
        backgroundColor: "rgba(0,0,0,0.8)",
        titleFont: { weight: "bold" },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 14 } },
      },
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          font: { size: 14 },
          callback: (v) => (Number.isInteger(v) ? v : null),
        },
        grid: {
          color: "#eee",
          borderDash: [4, 4],
        },
      },
    },
    animation: {
      duration: 700,
      easing: "easeOutQuart",
    },
  };

  return (
    <div className="container">
      <h2 style={{ textAlign: "center", margin: "2rem 0" }}>Admin · Analytics</h2>

      {loading && <div>Loading analytics...</div>}
      {!loading && error && <div style={{ color: "red" }}>{error}</div>}

      {!loading && !error && (
        <>
          {/* Total Users Card */}
          <div
            className="card"
            style={{
              marginBottom: "1rem",
              padding: "1rem",
              textAlign: "center",
            }}
          >
            <h3>Total Users</h3>
            <p style={{ fontWeight: "bold", fontSize: 28 }}>{totalUsers}</p>
          </div>

          {/* Top Attractions List (numbered, no dots) */}
          <div className="card" style={{ marginBottom: "1rem", padding: "1rem" }}>
            <h3>Top Attractions</h3>
            <div>
              {attractions.map((a, idx) => (
                <div
                  key={idx}
                  style={{
                    marginBottom: 4,
                    fontSize: 16,
                  }}
                >
                  {idx + 1}. {a.name} — Users: {a.userCount}
                </div>
              ))}
            </div>
          </div>

          {/* Top Restaurants List (numbered, no dots) */}
          <div className="card" style={{ marginBottom: "1rem", padding: "1rem" }}>
            <h3>Top Restaurants</h3>
            <div>
              {restaurants.map((r, idx) => (
                <div
                  key={idx}
                  style={{
                    marginBottom: 4,
                    fontSize: 16,
                  }}
                >
                  {idx + 1}. {r.name} — Users: {r.userCount}
                </div>
              ))}
            </div>
          </div>

          {/* Attractions popularity chart */}
          <div
            className="card"
            style={{
              marginBottom: "1.5rem",
              padding: "1rem",
              ...chartContainerStyle,
              height: 340,
            }}
          >
            <h3 style={{ textAlign: "center" }}>Attractions Popularity</h3>
            <Bar data={attractionData} options={chartOptions} height={300} />
          </div>

          {/* Restaurants popularity chart */}
          <div
            className="card"
            style={{
              marginBottom: "1.5rem",
              padding: "1rem",
              ...chartContainerStyle,
              height: 340,
            }}
          >
            <h3 style={{ textAlign: "center" }}>Restaurants Popularity</h3>
            <Bar data={restaurantData} options={chartOptions} height={300} />
          </div>
        </>
      )}
    </div>
  );
}
