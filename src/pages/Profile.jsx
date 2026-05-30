import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db, auth } from "../firebase/config";
import { useNavigate } from "react-router-dom";
import TopNavbar from "../components/TopNavbar";
import AdminSidebar from "../components/AdminSidebar";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip,
  BarChart, Bar, PieChart, Pie, Cell,
} from "recharts";

const PIE_COLORS = ["#059669", "#dc2626"];

/* =========================================
   ROLE CHECK HELPER
========================================= */
function isAdminRole(role) {
  return role === "admin" || role === "super-admin";
}

export default function Profile() {
  const navigate = useNavigate();

  /* =========================================
     STATE
  ========================================= */
  const [results,   setResults]   = useState([]);
  const [subjects,  setSubjects]  = useState([]);
  const [topics,    setTopics]    = useState([]);
  const [subTopics, setSubTopics] = useState([]);
  const [userRole,  setUserRole]  = useState(null);

  /* =========================================
     LOAD CURRENT USER ROLE FROM FIRESTORE
  ========================================= */
  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(
      collection(db, "users"),
      where("uid", "==", auth.currentUser.uid)
    );
    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        setUserRole(snap.docs[0].data().role || "student");
      }
    });
    return () => unsub();
  }, []);

  /* =========================================
     LOAD RESULTS
  ========================================= */
  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(
      collection(db, "results"),
      where("userId", "==", auth.currentUser.uid)
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => b.createdAt - a.createdAt);
      setResults(data);
    });
    return () => unsub();
  }, []);

  /* =========================================
     LOAD SUBJECTS / TOPICS / SUBTOPICS
  ========================================= */
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

  function formatDate(ts) {
    if (!ts) return "-";
    return new Date(ts).toLocaleDateString();
  }

  function formatTime(sec) {
    if (!sec) return "0s";
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
  }

  /* =========================================
     ANALYTICS
  ========================================= */
  const totalAttempts = results.length;
  const avgAccuracy   = results.length > 0
    ? (results.reduce((a, b) => a + Number(b.accuracy), 0) / results.length).toFixed(2)
    : 0;
  const totalScore = results.reduce((a, b) => a + Number(b.score), 0);
  const bestScore  = results.length > 0 ? Math.max(...results.map((r) => Number(r.score))) : 0;

  const trendData = [...results].reverse().map((r, i) => ({
    attempt:  i + 1,
    score:    Number(r.score),
    accuracy: Number(r.accuracy),
  }));

  const subjectAnalytics = Object.values(
    results.reduce((acc, r) => {
      const name = getName(subjects, r.subject);
      if (!acc[name]) acc[name] = { subject: name, score: 0, attempts: 0 };
      acc[name].score    += Number(r.score);
      acc[name].attempts++;
      return acc;
    }, {})
  ).map((s) => ({ subject: s.subject, avgScore: (s.score / s.attempts).toFixed(2) }));

  /* =========================================
     WEAK / STRONG CALCULATION
  ========================================= */
  function getWeakStrong(data) {
    if (data.length === 0) return { weak: "-", strong: "-" };
    const sorted = [...data].sort((a, b) => (a.score / a.attempts) - (b.score / b.attempts));
    return {
      weak:   sorted[0]?.name || "-",
      strong: sorted[sorted.length - 1]?.name || "-",
    };
  }

  function buildStats(keyFn) {
    return Object.values(
      results.reduce((acc, r) => {
        const name = keyFn(r);
        if (!acc[name]) acc[name] = { name, score: 0, attempts: 0 };
        acc[name].score    += Number(r.score);
        acc[name].attempts++;
        return acc;
      }, {})
    );
  }

  const { weak: weakSubject,  strong: strongSubject  } = getWeakStrong(buildStats((r) => getName(subjects,  r.subject)));
  const { weak: weakTopic,    strong: strongTopic    } = getWeakStrong(buildStats((r) => getName(topics,    r.topicId)));
  const { weak: weakSubTopic, strong: strongSubTopic } = getWeakStrong(buildStats((r) => getName(subTopics, r.subTopicId)));

  const accuracyData = [
    { name: "Correct", value: results.reduce((a, b) => a + Number(b.correct || 0), 0) },
    { name: "Wrong",   value: results.reduce((a, b) => a + Number(b.wrong   || 0), 0) },
  ];

  /* =========================================
     UI — ADMIN LAYOUT vs STUDENT LAYOUT
  ========================================= */
  const isAdmin = isAdminRole(userRole);

  const content = (
    <>
      <div className="page-header">
        <div>
          <h2>Student Analytics</h2>
          <p>Advanced Performance Dashboard</p>
        </div>
        {!isAdmin && (
          <div className="header-actions">
            <button onClick={() => navigate("/dashboard")}>Dashboard</button>
            <button onClick={() => navigate("/leaderboard")}>Leaderboard</button>
          </div>
        )}
      </div>

      {/* TOP STATS */}
      <div className="dashboard-grid">
        <div className="analytics-card"><h3>Attempts</h3><h1>{totalAttempts}</h1></div>
        <div className="analytics-card"><h3>Accuracy</h3><h1>{avgAccuracy}%</h1></div>
        <div className="analytics-card"><h3>Total Score</h3><h1>{totalScore}</h1></div>
        <div className="analytics-card"><h3>Best Score</h3><h1>{bestScore}</h1></div>
      </div>

      {/* AI INSIGHTS */}
      <div className="dashboard-grid">
        <div className="analytics-card"><h3>Weak Subject</h3><h2>{weakSubject}</h2></div>
        <div className="analytics-card"><h3>Strong Subject</h3><h2>{strongSubject}</h2></div>
        <div className="analytics-card"><h3>Weak Topic</h3><h2>{weakTopic}</h2></div>
        <div className="analytics-card"><h3>Strong Topic</h3><h2>{strongTopic}</h2></div>
        <div className="analytics-card"><h3>Weak SubTopic</h3><h2>{weakSubTopic}</h2></div>
        <div className="analytics-card"><h3>Strong SubTopic</h3><h2>{strongSubTopic}</h2></div>
      </div>

      {/* CHARTS */}
      <div className="charts-grid">
        <div className="chart-card">
          <h3>Performance Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <XAxis dataKey="attempt" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="score"    stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="accuracy" stroke="#059669" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Subject Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={subjectAnalytics}>
              <XAxis dataKey="subject" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="avgScore" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* PIE CHART */}
      <div className="charts-grid">
        <div className="chart-card">
          <h3>Accuracy Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={accuracyData} dataKey="value" outerRadius={100} label>
                {accuracyData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ATTEMPT HISTORY */}
      <div className="table-card">
        <h3>Advanced Attempt History</h3>
        {results.length === 0 ? (
          <p className="um-empty-msg">No exam attempts yet.</p>
        ) : (
          <div className="um-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Subject</th>
                  <th>Topic</th>
                  <th>SubTopic</th>
                  <th>Correct</th>
                  <th>Wrong</th>
                  <th>Score</th>
                  <th>Accuracy</th>
                  <th>Time</th>
                  <th>Warnings</th>
                  <th>Review</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.id}>
                    <td>{formatDate(r.createdAt)}</td>
                    <td>{getName(subjects,  r.subject)}</td>
                    <td>{getName(topics,    r.topicId)}</td>
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
    </>
  );

  /* Admin users see sidebar layout, students see plain page */
  if (isAdmin) {
    return (
      <div className="admin-layout">
        <AdminSidebar />
        <div className="admin-content">
          <TopNavbar />
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <TopNavbar />
      {content}
    </div>
  );
}
