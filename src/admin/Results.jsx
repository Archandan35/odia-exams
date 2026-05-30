import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import AdminLayout from "./AdminLayout";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const PIE_COLORS = ["#059669", "#dc2626"];

function safeNum(v) { const n = Number(v); return isNaN(n) ? 0 : n; }
function formatDateTime(ts) { if (!ts) return "-"; return new Date(ts).toLocaleString(); }

export default function Results() {
  const [results,   setResults]   = useState([]);
  const [subjects,  setSubjects]  = useState([]);
  const [topics,    setTopics]    = useState([]);
  const [subTopics, setSubTopics] = useState([]);
  const [users,     setUsers]     = useState([]);

  useEffect(() => {
    const subs = [
      onSnapshot(collection(db,"results"),   s => {
        const data = s.docs.map(d=>({id:d.id,...d.data()}));
        data.sort((a,b) => safeNum(b.score) - safeNum(a.score));
        setResults(data);
      }),
      onSnapshot(collection(db,"subjects"),  s => setSubjects(s.docs.map(d=>({id:d.id,...d.data()})))),
      onSnapshot(collection(db,"topics"),    s => setTopics(s.docs.map(d=>({id:d.id,...d.data()})))),
      onSnapshot(collection(db,"subtopics"), s => setSubTopics(s.docs.map(d=>({id:d.id,...d.data()})))),
      onSnapshot(collection(db,"users"),     s => setUsers(s.docs.map(d=>({id:d.id,...d.data()})))),
    ];
    return () => subs.forEach(u => u());
  }, []);

  /* ─── Name resolution ─── */
  const getName  = (arr, id) => arr.find(x => x.id === id)?.name || null;
  const resolveSubject  = (r) => getName(subjects, r.subject) || getName(subjects, r.subjectId) || r.subject || "-";
  const resolveTopic    = (r) => getName(topics, r.topicId) || r.topicId || "-";
  const resolveSubTopic = (r) => getName(subTopics, r.subTopicId) || r.subTopicId || "-";
  const resolveUser     = (r) => {
    const u = users.find(u => u.uid === r.userId || u.id === r.userId);
    return u ? (u.name || u.email || "-") : (r.userId || "-");
  };

  /* ─── Stats ─── */
  const totalAttempts = results.length;
  const validAcc = results.filter(r => !isNaN(Number(r.accuracy)));
  const averageAccuracy = validAcc.length > 0
    ? (validAcc.reduce((s,r) => s + safeNum(r.accuracy), 0) / validAcc.length).toFixed(2)
    : "0.00";

  const leaderboard = results.slice(0,10);

  const subjectPerformance = Object.values(
    results.reduce((acc, r) => {
      const name = resolveSubject(r);
      if (!acc[name]) acc[name] = { subject: name, score: 0, attempts: 0 };
      acc[name].score    += safeNum(r.score);
      acc[name].attempts++;
      return acc;
    }, {})
  ).map(s => ({ subject: s.subject, avgScore: (s.score / s.attempts).toFixed(2) }));

  const accuracyData = [
    { name:"Correct", value: results.reduce((a,b) => a + safeNum(b.correct), 0) },
    { name:"Wrong",   value: results.reduce((a,b) => a + safeNum(b.wrong),   0) },
  ];

  function exportPDF() {
    const doc = new jsPDF();
    doc.text("Results Report", 14, 20);
    autoTable(doc, {
      startY: 30,
      head: [["Rank","User","Subject","Topic","Score","Accuracy"]],
      body: leaderboard.map((r, i) => [
        i+1,
        resolveUser(r),
        resolveSubject(r),
        resolveTopic(r),
        safeNum(r.score),
        safeNum(r.accuracy) + "%",
      ]),
    });
    doc.save("results-report.pdf");
  }

  return (
    <AdminLayout>
      <div className="page-header">
        <div>
          <h2>Results Analytics</h2>
          <p>Total Attempts: {totalAttempts}</p>
        </div>
        <button onClick={exportPDF}>Export PDF</button>
      </div>

      <div className="dashboard-grid">
        <div className="analytics-card"><h3>Total Attempts</h3><h1>{totalAttempts}</h1></div>
        <div className="analytics-card"><h3>Average Accuracy</h3><h1>{averageAccuracy}%</h1></div>
        <div className="analytics-card"><h3>Top Score</h3><h1>{leaderboard[0] ? safeNum(leaderboard[0].score) : 0}</h1></div>
        <div className="analytics-card"><h3>Subjects Tested</h3><h1>{subjectPerformance.length}</h1></div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>Subject Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={subjectPerformance}>
              <XAxis dataKey="subject" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="avgScore" fill="#2563eb" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Accuracy Analysis</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={accuracyData} dataKey="value" outerRadius={100} label>
                {accuracyData.map((_,i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="table-card">
        <h3>Leaderboard (Top 10)</h3>
        <div className="um-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>User</th>
                <th>Subject</th>
                <th>Topic</th>
                <th>SubTopic</th>
                <th>Score</th>
                <th>Accuracy</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((r, i) => (
                <tr key={r.id}>
                  <td>#{i+1}</td>
                  <td>{resolveUser(r)}</td>
                  <td>{resolveSubject(r)}</td>
                  <td>{resolveTopic(r)}</td>
                  <td>{resolveSubTopic(r)}</td>
                  <td>{safeNum(r.score)}</td>
                  <td>{safeNum(r.accuracy)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Full History */}
      <div className="table-card">
        <h3>Result History</h3>
        <div className="um-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>User</th>
                <th>Subject</th>
                <th>Topic</th>
                <th>SubTopic</th>
                <th>Correct</th>
                <th>Wrong</th>
                <th>Score</th>
                <th>Accuracy</th>
              </tr>
            </thead>
            <tbody>
              {results.length === 0 ? (
                <tr><td colSpan={9} className="um-empty-row">No results found.</td></tr>
              ) : results.map(r => (
                <tr key={r.id}>
                  <td className="um-date-cell">{formatDateTime(r.createdAt)}</td>
                  <td>{resolveUser(r)}</td>
                  <td>{resolveSubject(r)}</td>
                  <td>{resolveTopic(r)}</td>
                  <td>{resolveSubTopic(r)}</td>
                  <td>{r.correct ?? 0}</td>
                  <td>{r.wrong ?? 0}</td>
                  <td>{safeNum(r.score)}</td>
                  <td>{safeNum(r.accuracy)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
