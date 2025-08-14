// src/AdminAnalytics.js
import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import "chart.js/auto";
import api, {
  adminAPI,
  communityAPI,
  attractionsAPI,
  restaurantsAPI,
} from "./services/api";

// 安全计数
const countOf = (data) => {
  if (!data) return 0;
  if (Array.isArray(data)) return data.length;
  if (Array.isArray(data.items)) return data.items.length;
  if (Array.isArray(data.data)) return data.data.length;
  if (typeof data.count === "number") return data.count;
  if (typeof data.total === "number") return data.total;
  return 0;
};

export default function AdminAnalytics() {
  const [totalUsers, setTotalUsers] = useState(0);
  const [attractions, setAttractions] = useState([]); // [{name, userCount}]
  const [restaurants, setRestaurants] = useState([]); // [{name, userCount}]
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");

      try {
        // 1) 优先尝试统一聚合接口：/admin/analytics
        try {
          const res = await api.get("/admin/analytics");
          const d = res.data || {};
          if (typeof d.users !== "undefined") setTotalUsers(countOf(d.users));
          if (Array.isArray(d.attractions))
            setAttractions(d.attractions.map((x) => ({
              name: x.name ?? x.title ?? "Unknown",
              userCount: Number(x.userCount ?? x.count ?? 0),
            })));
          if (Array.isArray(d.restaurants))
            setRestaurants(d.restaurants.map((x) => ({
              name: x.name ?? x.title ?? "Unknown",
              userCount: Number(x.userCount ?? x.count ?? 0),
            })));
          setLoading(false);
          return;
        } catch (_) {
          // 没有该接口或 404/501，继续回退逻辑
        }

        // 2) 用户总数：先试 /api/users/count；失败则拉 /admin/users 计数
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

        // 3) 排行榜：先试 /api/places/rankings（期望 {attractions:[{name,userCount}], restaurants:[...] }）
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
          // 4) 再回退：没有排行榜接口就分别读取列表，给个“0”占位
          // 你后端若在列表项里就带了使用人数字段（如 likes / checklistCount），可在这里改成读取对应字段
          try {
            const a = await attractionsAPI.getAll(); // /api/attractions
            const list = a.data || [];
            topAttr = list.map((x) => ({
              name: x.name ?? x.title ?? "Unknown",
              userCount: Number(x.userCount ?? x.count ?? 0), // 没有就为 0
            }));
          } catch {
            topAttr = [];
          }
          try {
            const r = await restaurantsAPI.getAll(); // /api/restaurants
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
        console.error("analytics error:", e?.response || e);
        setError(e?.response?.data?.message || e.message || "Failed to load analytics data.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // 准备图表数据
  const attractionData = {
    labels: attractions.map((a) => a.name),
    datasets: [
      {
        label: "Users",
        data: attractions.map((a) => a.userCount),
        backgroundColor: "rgba(75, 192, 192, 0.6)",
      },
    ],
  };
  const restaurantData = {
    labels: restaurants.map((r) => r.name),
    datasets: [
      {
        label: "Users",
        data: restaurants.map((r) => r.userCount),
        backgroundColor: "rgba(255, 99, 132, 0.6)",
      },
    ],
  };

  const chartOptions = {
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          callback: (v) => (Number.isInteger(v) ? v : null),
        },
      },
    },
  };

  return (
    <div className="container">
      <h2>Admin · Analytics</h2>

      {loading && <div>Loading analytics...</div>}
      {!loading && error && <div style={{ color: "red" }}>{error}</div>}

      {!loading && !error && (
        <>
          {/* Total Users */}
          <div className="card" style={{ marginBottom: "1rem", padding: "1rem" }}>
            <h3>Total Users</h3>
            <p>{totalUsers}</p>
          </div>

          {/* Top Attractions */}
          <div className="card" style={{ marginBottom: "1rem", padding: "1rem" }}>
            <h3>Top Attractions</h3>
            <ul>
              {attractions.map((a, idx) => (
                <li key={idx}>
                  {idx + 1}. {a.name} — Users: {a.userCount}
                </li>
              ))}
            </ul>
          </div>

          {/* Top Restaurants */}
          <div className="card" style={{ marginBottom: "1rem", padding: "1rem" }}>
            <h3>Top Restaurants</h3>
            <ul>
              {restaurants.map((r, idx) => (
                <li key={idx}>
                  {idx + 1}. {r.name} — Users: {r.userCount}
                </li>
              ))}
            </ul>
          </div>

          {/* Charts */}
          <div className="card" style={{ marginBottom: "1rem", padding: "1rem" }}>
            <h3>Attractions Popularity</h3>
            <Bar data={attractionData} options={chartOptions} />
          </div>
          <div className="card" style={{ marginBottom: "1rem", padding: "1rem" }}>
            <h3>Restaurants Popularity</h3>
            <Bar data={restaurantData} options={chartOptions} />
          </div>
        </>
      )}
    </div>
  );
}
