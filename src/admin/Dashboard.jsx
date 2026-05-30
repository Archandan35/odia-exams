import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import AdminLayout from "./AdminLayout";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from "recharts";
import { useNavigate } from "react-router-dom";

const PIE_COLORS = ["#059669", "#dc2626"];

function safeNum(v) { const n = Number(v); return isNaN(n) ? 0 : n; }
function formatDateTime(ts) { if (!ts) return "-"; return new Date(ts).toLocaleString(); }
function formatDate(ts) { if (!ts) return "-"; return new Date(ts).toLocaleDateString(); }

const today = () => {
  const d = new Date(); d.setHours(0,0,0,0); return d.getTime();
};
const daysAgo = (n) => Date.now() - n * 86400000;

export default function Dashboard() {
  const navigate = useNavigate();

  const [subjects,  setSubjects]  = useState([]);
  const [topics,    setTopics]    = useState([]);
  const [subTopics, setSubTopics] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [results,   setResults]   = useState([]);
  const [users,     setUsers]     = useState([]);

  useEffect(() => {
    const subs = [
      onSnapshot(collection(db,"subjects"),  s => setSubjects(s.docs.map(d=>({id:d.id,...d.data()})))),
      onSnapshot(collection(db,"topics"),    s => setTopics(s.docs.map(d=>({id:d.id,...d.data()})))),
      onSnapshot(collection(db,"subtopics"), s => setSubTopics(s.docs.map(d=>({id:d.id,...d.data()})))),
      onSnapshot(collection(db,"questions"), s => setQuestions(s.docs.map(d=>({id:d.id,...d.data()})))),
      onSnapshot(collection(db,"results"),   s => setResults(s.docs.map(d=>({id:d.id,...d.data()})))),
      onSnapshot(collection(db,"users"),     s => setUsers(s.docs.map(d=>({id:d.id,...d.data()})))),
    ];
    return () => subs.forEach(u => u());
  }, []);

  /* ─── Helpers ─── */
  const getName = (arr, id) => arr.find(x => x.id === id)?.name || null;
  const resolveSubject = (r) => getName(subjects, r.subject) || getName(subjects, r.subjectId) || r.subject || "-";
  const resolveTopic   = (r) => getName(topics, r.topicId) || r.topicId || "-";
  const resolveSubTopic= (r) => getName(subTopics, r.subTopicId) || r.subTopicId || "-";

  /* ─── KPI ─── */
  const totalStudents  = users.filter(u => !["admin","super-admin","superadmin"].includes(u.role)).length;
  const totalAdmins    = users.filter(u => ["admin","super-admin","superadmin"].includes(u.role)).length;
  const onlineNow      = users.filter(u => u.isOnline).length;
  const todayStart     = today();
  const loggedToday    = users.filter(u => (u.lastLogin || 0) >= todayStart).length;
  const newUsersToday  = users.filter(u => (u.createdAt || 0) >= todayStart).length;
  const active7Days    = users.filter(u => (u.lastLogin || 0) >= daysAgo(7)).length;
  const active30Days   = users.filter(u => (u.lastLogin || 0) >= daysAgo(30)).length;
  const attemptsToday  = results.filter(r => (r.createdAt || 0) >= todayStart).length;

  const validAccuracies = results.filter(r => !isNaN(Number(r.accuracy)));
  const avgAccuracy = validAccuracies.length > 0
    ? (validAccuracies.reduce((a,b) => a + safeNum(b.accuracy), 0) / validAccuracies.length).toFixed(1)
    : "0.0";
  const validScores = results.filter(r => !isNaN(Number(r.score)));
  const avgScore   = validScores.length > 0
    ? (validScores.reduce((a,b) => a + safeNum(b.score), 0) / validScores.length).toFixed(1)
    : "0.0";
  const topScore = results.length > 0 ? Math.max(...results.map(r => safeNum(r.score))) : 0;

  /* Best performing user */
  const userScoreMap = {};
  results.forEach(r => {
    const uid = r.userId || "unknown";
    if (!userScoreMap[uid]) userScoreMap[uid] = { uid, total: 0, count: 0 };
    userScoreMap[uid].total += safeNum(r.score);
    userScoreMap[uid].count++;
  });
  const bestUid = Object.values(userScoreMap).sort((a,b) => (b.total/b.count) - (a.total/a.count))[0]?.uid;
  const bestUser = users.find(u => u.uid === bestUid || u.id === bestUid);
  const bestUserName = bestUser?.name || bestUser?.email || "-";

  /* ─── Chart data ─── */
  const subjectChartData = subjects.map(s => ({
    name: s.name,
    questions: questions.filter(q => q.subjectId === s.id).length,
  }));

  const performanceTrend = [...results]
    .sort((a,b) => (b.createdAt||0) - (a.createdAt||0))
    .slice(0,10)
    .reverse()
    .map((r,i) => ({ name: `E${i+1}`, score: safeNum(r.score) }));

  const accuracyPie = [
    { name:"Correct", value: results.reduce((a,b) => a + safeNum(b.correct), 0) },
    { name:"Wrong",   value: results.reduce((a,b) => a + safeNum(b.wrong),   0) },
  ];

  /* ─── Recent Results (last 10, all users) ─── */
  const recentResults = [...results]
    .sort((a,b) => (b.createdAt||0) - (a.createdAt||0))
    .slice(0,10);

  return (
    <AdminLayout>
      <div className="page-header">
        <div>
          <h2>Analytics Dashboard</h2>
          <p>Realtime Admin Overview</p>
        </div>
      </div>

      {/* ── ROW 1: Platform Summary ── */}
      <div className="dashboard-grid">
        <div className="analytics-card"><h3>Total Subjects</h3><h1>{subjects.length}</h1><p>Available Subjects</p></div>
        <div className="analytics-card"><h3>Total Topics</h3><h1>{topics.length}</h1><p>Across Subjects</p></div>
        <div className="analytics-card"><h3>Total SubTopics</h3><h1>{subTopics.length}</h1><p>Nested Categories</p></div>
        <div className="analytics-card"><h3>Total Questions</h3><h1>{questions.length}</h1><p>Question Bank</p></div>
        <div className="analytics-card"><h3>Total Attempts</h3><h1>{results.length}</h1><p>Exam Attempts</p></div>
        <div className="analytics-card"><h3>Students</h3><h1>{totalStudents}</h1><p>Registered Students</p></div>
        <div className="analytics-card"><h3>Admins</h3><h1>{totalAdmins}</h1><p>Admin Accounts</p></div>
        <div className="analytics-card"><h3>Total Users</h3><h1>{users.length}</h1><p>All Registered</p></div>
      </div>

      {/* ── ROW 2: Live Stats ── */}
      <div className="dashboard-grid">
        <div className="analytics-card"><h3>Online Now</h3><h1>{onlineNow}</h1><p>Live Users</p></div>
        <div className="analytics-card"><h3>Logged In Today</h3><h1>{loggedToday}</h1><p>Active Today</p></div>
        <div className="analytics-card"><h3>Attempts Today</h3><h1>{attemptsToday}</h1><p>Exams Today</p></div>
        <div className="analytics-card"><h3>New Users Today</h3><h1>{newUsersToday}</h1><p>Registered Today</p></div>
        <div className="analytics-card"><h3>Active (7 Days)</h3><h1>{active7Days}</h1><p>Weekly Active</p></div>
        <div className="analytics-card"><h3>Active (30 Days)</h3><h1>{active30Days}</h1><p>Monthly Active</p></div>
        <div className="analytics-card"><h3>Avg Accuracy</h3><h1>{avgAccuracy}%</h1><p>Platform Average</p></div>
        <div className="analytics-card"><h3>Avg Score</h3><h1>{avgScore}</h1><p>Mean Score</p></div>
      </div>

      {/* ── ROW 3: Performance ── */}
      <div className="dashboard-grid">
        <div className="analytics-card"><h3>Top Score</h3><h1>{topScore}</h1><p>Highest Achieved</p></div>
        <div className="analytics-card"><h3>Best Performer</h3><h2>{bestUserName}</h2><p>Highest Avg Score</p></div>
      </div>

      {/* ── Charts ── */}
      <div className="charts-grid">
        <div className="chart-card">
          <h3>Questions Per Subject</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={subjectChartData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="questions" fill="#2563eb" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Accuracy Analysis</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={accuracyPie} dataKey="value" outerRadius={100} label>
                {accuracyPie.map((_,i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="chart-card">
        <h3>Performance Trends (Last 10 Exams)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={performanceTrend}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={2} dot={{ r:3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ── Recent Results (all users, last 10) ── */}
      <div className="table-card">
        <h3>Recent Results</h3>
        <div className="um-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>User</th>
                <th>Subject</th>
                <th>Topic</th>
                <th>SubTopic</th>
                <th>Score</th>
                <th>Accuracy</th>
                <th>Correct</th>
                <th>Wrong</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentResults.length === 0 ? (
                <tr><td colSpan={10} className="um-empty-row">No results yet.</td></tr>
              ) : recentResults.map(r => {
                const u = users.find(u => u.uid === r.userId || u.id === r.userId);
                return (
                  <tr key={r.id}>
                    <td className="um-date-cell">{formatDateTime(r.createdAt)}</td>
                    <td>
                      <div className="um-user-cell">
                        <div className="avatar um-avatar-sm">{(u?.name||u?.email||"?")[0].toUpperCase()}</div>
                        <div className="um-user-info">
                          <strong>{u?.name || "-"}</strong>
                          <span className="um-email">{u?.email || r.userId || "-"}</span>
                        </div>
                      </div>
                    </td>
                    <td>{resolveSubject(r)}</td>
                    <td>{resolveTopic(r)}</td>
                    <td>{resolveSubTopic(r)}</td>
                    <td>{safeNum(r.score)}</td>
                    <td>{safeNum(r.accuracy)}%</td>
                    <td>{r.correct ?? 0}</td>
                    <td>{r.wrong ?? 0}</td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          const usr = users.find(u => u.uid === r.userId || u.id === r.userId);
                          if (usr) navigate("/admin/user-activity", { state: { user: usr } });
                        }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
