import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "../firebase/config";
import AdminSidebar from "../components/AdminSidebar";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

function formatDate(ts) {
  if (!ts) return "-";
  return new Date(ts).toLocaleDateString();
}

function formatDateTime(ts) {
  if (!ts) return "-";
  return new Date(ts).toLocaleString();
}

function formatTime(sec) {
  if (!sec) return "0s";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
}

export default function UserActivity() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = location.state?.user;

  const [results, setResults] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [subTopics, setSubTopics] = useState([]);

  /* =========================================
     REDIRECT IF NO USER
  ========================================= */
  useEffect(() => {
    if (!user) navigate("/admin/users");
  }, [user, navigate]);

  /* =========================================
     LOAD DATA
  ========================================= */
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "results"),
      where("userId", "==", user.uid || user.id)
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => b.createdAt - a.createdAt);
      setResults(data);
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "subjects"), (snap) => {
      setSubjects(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "topics"), (snap) => {
      setTopics(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "subtopics"), (snap) => {
      setSubTopics(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  /* =========================================
     HELPERS
  ========================================= */
  const getName = (arr, id) => arr.find((x) => x.id === id)?.name || id || "-";

  /* =========================================
     ANALYTICS
  ========================================= */
  const totalAttempts = results.length;
  const avgAccuracy = results.length > 0
    ? (results.reduce((a, b) => a + Number(b.accuracy), 0) / results.length).toFixed(2)
    : 0;
  const totalScore = results.reduce((a, b) => a + Number(b.score), 0);
  const bestScore = results.length > 0 ? Math.max(...results.map((r) => Number(r.score))) : 0;

  const trendData = [...results].reverse().map((r, i) => ({
    attempt: i + 1,
    score: Number(r.score),
    accuracy: Number(r.accuracy),
  }));

  const subjectAnalytics = Object.values(
    results.reduce((acc, r) => {
      const name = getName(subjects, r.subject);
      if (!acc[name]) acc[name] = { subject: name, score: 0, attempts: 0 };
      acc[name].score += Number(r.score);
      acc[name].attempts++;
      return acc;
    }, {})
  ).map((s) => ({ subject: s.subject, avgScore: (s.score / s.attempts).toFixed(2) }));

  const accuracyData = [
    { name: "Correct", value: results.reduce((a, b) => a + Number(b.correct || 0), 0) },
    { name: "Wrong",   value: results.reduce((a, b) => a + Number(b.wrong   || 0), 0) },
  ];

  const PIE_COLORS = ["#059669", "#dc2626"];

  if (!user) return null;

  /* =========================================
     UI
  ========================================= */
  return (
    <div className="admin-layout">
      <AdminSidebar />

      <div className="admin-content">

        {/* PAGE HEADER */}
        <div className="page-header">
          <div>
            <h2>User Activity</h2>
            <p>Detailed performance logs for {user.name || user.email}</p>
          </div>
          <div className="header-actions">
            <button className="cancel-btn" onClick={() => navigate("/admin/users")}>
              ← Back to Users
            </button>
          </div>
        </div>

        {/* USER IDENTITY CARD */}
        <div className="glass-card um-identity-card">
          <div className="um-profile-header">
            <div className="avatar um-avatar-lg">
              {(user.name || user.email || "?")[0].toUpperCase()}
            </div>
            <div className="um-profile-info">
              <h2>{user.name || "-"}</h2>
              <p>{user.email}</p>
              <div className="um-identity-meta">
                <span className={`role-badge role-badge--${user.role}`}>
                  {user.role || "student"}
                </span>
                <span className={user.status === "active" ? "um-status-badge um-status-active" : "um-status-badge um-status-inactive"}>
                  {user.status || "active"}
                </span>
                <span>
                  <span className={user.isOnline ? "um-online-dot um-online" : "um-online-dot um-offline"} />
                  {user.isOnline ? "Online" : "Offline"}
                </span>
              </div>
            </div>
            <div className="um-identity-dates">
              <p>Last Login: <strong>{formatDateTime(user.lastLogin)}</strong></p>
              <p>Joined: <strong>{formatDateTime(user.createdAt)}</strong></p>
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="dashboard-grid">
          <div className="analytics-card">
            <h3>Attempts</h3>
            <h1>{totalAttempts}</h1>
          </div>
          <div className="analytics-card">
            <h3>Avg Accuracy</h3>
            <h1>{avgAccuracy}%</h1>
          </div>
          <div className="analytics-card">
            <h3>Total Score</h3>
            <h1>{totalScore}</h1>
          </div>
          <div className="analytics-card">
            <h3>Best Score</h3>
            <h1>{bestScore}</h1>
          </div>
        </div>

        {/* CHARTS */}
        <div className="charts-grid">
          <div className="chart-card">
            <h3>Performance Trend</h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={trendData}>
                <XAxis dataKey="attempt" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="accuracy" stroke="#059669" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h3>Subject Performance</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={subjectAnalytics}>
                <XAxis dataKey="subject" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="avgScore" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h3>Accuracy Distribution</h3>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={accuracyData} dataKey="value" outerRadius={90} label>
                  {accuracyData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ATTEMPT HISTORY TABLE */}
        <div className="table-card">
          <h3>Exam Attempt History</h3>

          {results.length === 0 ? (
            <p className="um-empty-msg">No exam attempts yet for this user.</p>
          ) : (
            <div className="um-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Subject</th>
                    <th>Topic</th>
                    <th>Sub Topic</th>
                    <th>Correct</th>
                    <th>Wrong</th>
                    <th>Score</th>
                    <th>Accuracy</th>
                    <th>Time Taken</th>
                    <th>Warnings</th>
                    <th>Review</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => (
                    <tr key={r.id}>
                      <td>{formatDate(r.createdAt)}</td>
                      <td>{getName(subjects, r.subject)}</td>
                      <td>{getName(topics, r.topicId)}</td>
                      <td>{getName(subTopics, r.subTopicId)}</td>
                      <td>{r.correct}</td>
                      <td>{r.wrong}</td>
                      <td>{r.score}</td>
                      <td>{r.accuracy}%</td>
                      <td>{formatTime(r.timeTaken)}</td>
                      <td>{r.cheatCount || 0}</td>
                      <td>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => navigate("/result", { state: r })}
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
