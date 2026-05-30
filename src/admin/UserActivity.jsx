import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import AdminSidebar from "../components/AdminSidebar";
import TopNavbar from "../components/TopNavbar";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip,
  BarChart, Bar, PieChart, Pie, Cell,
} from "recharts";

const PIE_COLORS = ["#059669", "#dc2626"];

function safeNum(v) { const n = Number(v); return isNaN(n) ? 0 : n; }
function formatDate(ts)     { if (!ts) return "-"; return new Date(ts).toLocaleDateString(); }
function formatDateTime(ts) { if (!ts) return "-"; return new Date(ts).toLocaleString(); }
function formatTime(sec)    {
  if (!sec || isNaN(sec)) return "0s";
  const m = Math.floor(sec / 60); const s = sec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

const today  = () => { const d = new Date(); d.setHours(0,0,0,0); return d.getTime(); };
const daysAgo = (n) => Date.now() - n * 86400000;

/* =========================================
   DETAIL VIEW — single user analytics
========================================= */
function UserDetail({ user, results, subjects, topics, subTopics, onBack }) {
  const navigate = useNavigate();
  const getName = (arr, id) => arr.find(x => x.id === id)?.name || null;
  const resolveSubject  = (r) => getName(subjects, r.subject) || getName(subjects, r.subjectId) || r.subject || "-";
  const resolveTopic    = (r) => getName(topics, r.topicId) || r.topicId || "-";
  const resolveSubTopic = (r) => getName(subTopics, r.subTopicId) || r.subTopicId || "-";

  const totalAttempts = results.length;
  const avgAccuracy   = totalAttempts > 0
    ? (results.reduce((a,b) => a + safeNum(b.accuracy), 0) / totalAttempts).toFixed(1)
    : "0.0";
  const totalScore = results.reduce((a,b) => a + safeNum(b.score), 0);
  const bestScore  = totalAttempts > 0 ? Math.max(...results.map(r => safeNum(r.score))) : 0;

  const trendData = [...results].reverse().map((r,i) => ({
    attempt: i+1,
    score: safeNum(r.score),
    accuracy: safeNum(r.accuracy),
  }));

  const subjectAnalytics = Object.values(
    results.reduce((acc, r) => {
      const name = resolveSubject(r);
      if (!acc[name]) acc[name] = { subject: name, score: 0, attempts: 0 };
      acc[name].score    += safeNum(r.score);
      acc[name].attempts++;
      return acc;
    }, {})
  ).map(s => ({ subject: s.subject, avgScore: (s.score / s.attempts).toFixed(1) }));

  const accuracyData = [
    { name:"Correct", value: results.reduce((a,b) => a + safeNum(b.correct), 0) },
    { name:"Wrong",   value: results.reduce((a,b) => a + safeNum(b.wrong), 0) },
  ];

  function buildStats(keyFn) {
    return Object.values(results.reduce((acc, r) => {
      const name = keyFn(r);
      if (!acc[name]) acc[name] = { name, score: 0, attempts: 0 };
      acc[name].score    += safeNum(r.score);
      acc[name].attempts++;
      return acc;
    }, {}));
  }

  function getWeakStrong(data) {
    if (!data.length) return { weak: "-", strong: "-" };
    const sorted = [...data].sort((a,b) => (a.score/a.attempts) - (b.score/b.attempts));
    return { weak: sorted[0]?.name || "-", strong: sorted[sorted.length-1]?.name || "-" };
  }

  const { weak: weakSubject,  strong: strongSubject  } = getWeakStrong(buildStats(r => resolveSubject(r)));
  const { weak: weakTopic,    strong: strongTopic    } = getWeakStrong(buildStats(r => resolveTopic(r)));
  const { weak: weakSubTopic, strong: strongSubTopic } = getWeakStrong(buildStats(r => resolveSubTopic(r)));

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <TopNavbar />

        <div className="page-header">
          <div>
            <h2>User Activity</h2>
            <p>Detailed performance logs for {user.name || user.email}</p>
          </div>
          <div className="header-actions">
            <button className="cancel-btn" onClick={onBack}>← Back to Activity</button>
          </div>
        </div>

        {/* Identity Card */}
        <div className="glass-card um-identity-card">
          <div className="um-profile-header">
            <div className="avatar um-avatar-lg">
              {(user.name || user.email || "?")[0].toUpperCase()}
            </div>
            <div className="um-profile-info">
              <h2>{user.name || "-"}</h2>
              <p>{user.email}</p>
              <div className="um-identity-meta">
                <span className={`role-badge role-badge--${(user.role||"student").replace("-","")}`}>
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

        {/* Top Stats */}
        <div className="dashboard-grid">
          <div className="analytics-card"><h3>Attempts</h3><h1>{totalAttempts}</h1></div>
          <div className="analytics-card"><h3>Avg Accuracy</h3><h1>{avgAccuracy}%</h1></div>
          <div className="analytics-card"><h3>Total Score</h3><h1>{totalScore}</h1></div>
          <div className="analytics-card"><h3>Best Score</h3><h1>{bestScore}</h1></div>
        </div>

        {/* Weak / Strong */}
        <div className="dashboard-grid">
          <div className="analytics-card"><h3>Weak Subject</h3><h2>{weakSubject}</h2></div>
          <div className="analytics-card"><h3>Strong Subject</h3><h2>{strongSubject}</h2></div>
          <div className="analytics-card"><h3>Weak Topic</h3><h2>{weakTopic}</h2></div>
          <div className="analytics-card"><h3>Strong Topic</h3><h2>{strongTopic}</h2></div>
          <div className="analytics-card"><h3>Weak SubTopic</h3><h2>{weakSubTopic}</h2></div>
          <div className="analytics-card"><h3>Strong SubTopic</h3><h2>{strongSubTopic}</h2></div>
        </div>

        {/* Charts */}
        <div className="charts-grid">
          <div className="chart-card">
            <h3>Performance Trend</h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={trendData}>
                <XAxis dataKey="attempt" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="score"    stroke="#2563eb" strokeWidth={2} dot={{ r:3 }} />
                <Line type="monotone" dataKey="accuracy" stroke="#059669" strokeWidth={2} dot={{ r:3 }} />
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
                <Bar dataKey="avgScore" fill="#2563eb" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-card">
            <h3>Accuracy Distribution</h3>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={accuracyData} dataKey="value" outerRadius={90} label>
                  {accuracyData.map((_,i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Attempt History */}
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
                  {results.map(r => (
                    <tr key={r.id}>
                      <td className="um-date-cell">{formatDate(r.createdAt)}</td>
                      <td>{resolveSubject(r)}</td>
                      <td>{resolveTopic(r)}</td>
                      <td>{resolveSubTopic(r)}</td>
                      <td>{r.correct ?? 0}</td>
                      <td>{r.wrong ?? 0}</td>
                      <td>{safeNum(r.score)}</td>
                      <td>{safeNum(r.accuracy)}%</td>
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

/* =========================================
   MAIN — User Activity Table (all users)
========================================= */
export default function UserActivity() {
  const location = useLocation();
  const navigate = useNavigate();

  /* If navigated with a user via state (from UserManagement),
     show detail view directly */
  const initialUser = location.state?.user || null;

  const [users,     setUsers]     = useState([]);
  const [results,   setResults]   = useState([]);
  const [subjects,  setSubjects]  = useState([]);
  const [topics,    setTopics]    = useState([]);
  const [subTopics, setSubTopics] = useState([]);
  const [selectedUser, setSelectedUser] = useState(initialUser);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const subs = [
      onSnapshot(collection(db,"users"),     s => setUsers(s.docs.map(d=>({id:d.id,...d.data()})))),
      onSnapshot(collection(db,"results"),   s => setResults(s.docs.map(d=>({id:d.id,...d.data()})))),
      onSnapshot(collection(db,"subjects"),  s => setSubjects(s.docs.map(d=>({id:d.id,...d.data()})))),
      onSnapshot(collection(db,"topics"),    s => setTopics(s.docs.map(d=>({id:d.id,...d.data()})))),
      onSnapshot(collection(db,"subtopics"), s => setSubTopics(s.docs.map(d=>({id:d.id,...d.data()})))),
    ];
    return () => subs.forEach(u => u());
  }, []);

  const getName = (arr, id) => arr.find(x => x.id === id)?.name || null;
  const resolveSubject  = (r) => getName(subjects, r.subject) || getName(subjects, r.subjectId) || r.subject || "-";
  const resolveTopic    = (r) => getName(topics, r.topicId) || r.topicId || "-";
  const resolveSubTopic = (r) => getName(subTopics, r.subTopicId) || r.subTopicId || "-";

  /* Per-user analytics */
  function getUserStats(user) {
    const uid = user.uid || user.id;
    const userResults = results.filter(r => r.userId === uid);
    userResults.sort((a,b) => (b.createdAt||0) - (a.createdAt||0));

    const totalAttempts  = userResults.length;
    const todayStart     = today();
    const todayAttempts  = userResults.filter(r => (r.createdAt||0) >= todayStart).length;
    const last7          = userResults.filter(r => (r.createdAt||0) >= daysAgo(7)).length;
    const last30         = userResults.filter(r => (r.createdAt||0) >= daysAgo(30)).length;
    const avgScore       = totalAttempts > 0
      ? (userResults.reduce((a,b) => a + safeNum(b.score), 0) / totalAttempts).toFixed(1)
      : "0.0";
    const bestScore      = totalAttempts > 0 ? Math.max(...userResults.map(r => safeNum(r.score))) : 0;
    const avgAccuracy    = totalAttempts > 0
      ? (userResults.reduce((a,b) => a + safeNum(b.accuracy), 0) / totalAttempts).toFixed(1)
      : "0.0";

    const last = userResults[0] || null;

    function buildStats(keyFn) {
      return Object.values(userResults.reduce((acc, r) => {
        const name = keyFn(r);
        if (!acc[name]) acc[name] = { name, score: 0, attempts: 0 };
        acc[name].score    += safeNum(r.score);
        acc[name].attempts++;
        return acc;
      }, {}));
    }
    function getWeakStrong(data) {
      if (!data.length) return { weak: "-", strong: "-" };
      const sorted = [...data].sort((a,b) => (a.score/a.attempts) - (b.score/b.attempts));
      return { weak: sorted[0]?.name || "-", strong: sorted[sorted.length-1]?.name || "-" };
    }

    const { weak: weakSubject,  strong: strongSubject  } = getWeakStrong(buildStats(r => resolveSubject(r)));
    const { weak: weakTopic,    strong: strongTopic    } = getWeakStrong(buildStats(r => resolveTopic(r)));
    const { weak: weakSubTopic, strong: strongSubTopic } = getWeakStrong(buildStats(r => resolveSubTopic(r)));

    return {
      userResults, totalAttempts, todayAttempts, last7, last30,
      avgScore, bestScore, avgAccuracy,
      lastAttempt:  last ? formatDate(last.createdAt) : "-",
      lastSubject:  last ? resolveSubject(last) : "-",
      lastTopic:    last ? resolveTopic(last) : "-",
      lastSubTopic: last ? resolveSubTopic(last) : "-",
      lastScore:    last ? safeNum(last.score) : 0,
      weakSubject, strongSubject,
      weakTopic,   strongTopic,
      weakSubTopic,strongSubTopic,
    };
  }

  /* If a user is selected, render detail view */
  if (selectedUser) {
    const uid = selectedUser.uid || selectedUser.id;
    const userResults = results
      .filter(r => r.userId === uid)
      .sort((a,b) => (b.createdAt||0) - (a.createdAt||0));

    return (
      <UserDetail
        user={selectedUser}
        results={userResults}
        subjects={subjects}
        topics={topics}
        subTopics={subTopics}
        onBack={() => setSelectedUser(null)}
      />
    );
  }

  /* Main table */
  const filtered = users.filter(u => {
    const t = search.toLowerCase();
    return !t ||
      (u.name||"").toLowerCase().includes(t) ||
      (u.email||"").toLowerCase().includes(t) ||
      (u.username||"").toLowerCase().includes(t);
  });

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <TopNavbar />

        <div className="page-header">
          <div>
            <h2>User Activity</h2>
            <p>Performance overview for all registered users</p>
          </div>
        </div>

        {/* Summary cards */}
        <div className="dashboard-grid">
          <div className="analytics-card"><h3>Total Users</h3><h1>{users.length}</h1></div>
          <div className="analytics-card"><h3>Online Now</h3><h1>{users.filter(u=>u.isOnline).length}</h1></div>
          <div className="analytics-card"><h3>Total Results</h3><h1>{results.length}</h1></div>
          <div className="analytics-card"><h3>Today's Attempts</h3><h1>{results.filter(r=>(r.createdAt||0)>=today()).length}</h1></div>
        </div>

        {/* Search */}
        <div className="filter-grid">
          <input
            placeholder="Search by name, email, or username…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Activity Table */}
        <div className="table-card">
          <h3 className="um-table-title">
            Users
            <span className="um-count-badge">{filtered.length}</span>
          </h3>
          <div className="um-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Online</th>
                  <th>Last Login</th>
                  <th>Last Attempt</th>
                  <th>Last Subject</th>
                  <th>Last Topic</th>
                  <th>Last SubTopic</th>
                  <th>Latest Score</th>
                  <th>Best Score</th>
                  <th>Avg Score</th>
                  <th>Avg Accuracy</th>
                  <th>Total Attempts</th>
                  <th>Today</th>
                  <th>7 Days</th>
                  <th>30 Days</th>
                  <th>Weak Subject</th>
                  <th>Strong Subject</th>
                  <th>Weak Topic</th>
                  <th>Strong Topic</th>
                  <th>Weak SubTopic</th>
                  <th>Strong SubTopic</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={25} className="um-empty-row">No users found.</td></tr>
                ) : filtered.map(user => {
                  const s = getUserStats(user);
                  return (
                    <tr key={user.id}>
                      <td>
                        <div className="um-user-cell">
                          <div className="avatar um-avatar-sm">
                            {(user.name||user.email||"?")[0].toUpperCase()}
                          </div>
                          <div className="um-user-info">
                            <strong>{user.name || "-"}</strong>
                            <span className="um-email">{user.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>{user.username || "-"}</td>
                      <td>
                        <span className={`role-badge role-badge--${(user.role||"student").replace("-","")}`}>
                          {user.role || "student"}
                        </span>
                      </td>
                      <td>
                        <span className={user.isOnline ? "um-online-dot um-online" : "um-online-dot um-offline"} />
                        <span className="um-online-label">{user.isOnline ? "Online" : "Offline"}</span>
                      </td>
                      <td className="um-date-cell">{formatDateTime(user.lastLogin)}</td>
                      <td className="um-date-cell">{s.lastAttempt}</td>
                      <td>{s.lastSubject}</td>
                      <td>{s.lastTopic}</td>
                      <td>{s.lastSubTopic}</td>
                      <td>{s.lastScore}</td>
                      <td>{s.bestScore}</td>
                      <td>{s.avgScore}</td>
                      <td>{s.avgAccuracy}%</td>
                      <td>{s.totalAttempts}</td>
                      <td>{s.todayAttempts}</td>
                      <td>{s.last7}</td>
                      <td>{s.last30}</td>
                      <td>{s.weakSubject}</td>
                      <td>{s.strongSubject}</td>
                      <td>{s.weakTopic}</td>
                      <td>{s.strongTopic}</td>
                      <td>{s.weakSubTopic}</td>
                      <td>{s.strongSubTopic}</td>
                      <td className="um-date-cell">{formatDateTime(user.createdAt)}</td>
                      <td>
                        <div className="um-action-group">
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => setSelectedUser(user)}
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
