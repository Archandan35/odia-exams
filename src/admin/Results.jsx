import {
  useEffect,
  useState,
} from "react";

import {
  collection,
  onSnapshot,
} from "firebase/firestore";

import { db } from "../firebase/config";

import AdminLayout from "./AdminLayout";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import jsPDF from "jspdf";

import autoTable from "jspdf-autotable";

export default function Results() {

  const [results, setResults] =
    useState([]);

  useEffect(() => {

    const unsub =
      onSnapshot(
        collection(db, "results"),
        (snapshot) => {

          const data =
            snapshot.docs.map(
              (doc) => ({
                id: doc.id,
                ...doc.data(),
              })
            );

          data.sort(
            (a,b)=>
              b.score - a.score
          );

          setResults(data);

        }
      );

    return () => unsub();

  }, []);

  const totalAttempts =
    results.length;

  const averageAccuracy =
    results.length > 0
    ? (
      results.reduce(
        (sum,r)=>
          sum +
          Number(r.accuracy),
        0
      )
      /
      results.length
    ).toFixed(2)
    : 0;

  const leaderboard =
    results.slice(0,10);

  const subjectPerformance =
    Object.values(

      results.reduce(
        (acc,r)=>{

        if(!acc[r.subject]){

          acc[r.subject]={
            subject:r.subject,
            score:0,
            attempts:0,
          };

        }

        acc[r.subject]
        .score +=
          Number(r.score);

        acc[r.subject]
        .attempts++;

        return acc;

      },{})

    ).map((s)=>({

      subject:s.subject,

      avgScore:
        (
          s.score /
          s.attempts
        ).toFixed(2),

    }));

  const accuracyData = [

    {
      name:"Correct",
      value:
        results.reduce(
          (a,b)=>
            a + b.correct,
          0
        ),
    },

    {
      name:"Wrong",
      value:
        results.reduce(
          (a,b)=>
            a + b.wrong,
          0
        ),
    },

  ];

  function exportPDF() {

    const doc =
      new jsPDF();

    doc.text(
      "Results Report",
      14,
      20
    );

    autoTable(doc,{

      startY:30,

      head:[[
        "Rank",
        "Subject",
        "Score",
        "Accuracy",
      ]],

      body:
        leaderboard.map(
          (r,index)=>([
            index + 1,
            r.subject,
            r.score,
            r.accuracy + "%",
          ])
        ),

    });

    doc.save(
      "results-report.pdf"
    );

  }

  return (

    <AdminLayout>

      <div className="page-header">

        <div>

          <h2>
            Results Analytics
          </h2>

          <p>
            Total Attempts:
            {" "}
            {totalAttempts}
          </p>

        </div>

        <button
          onClick={exportPDF}
        >
          Export PDF
        </button>

      </div>

      <div className="dashboard-grid">

        <div className="analytics-card">

          <h3>
            Total Attempts
          </h3>

          <h1>
            {totalAttempts}
          </h1>

        </div>

        <div className="analytics-card">

          <h3>
            Average Accuracy
          </h3>

          <h1>
            {
              averageAccuracy
            }%
          </h1>

        </div>

        <div className="analytics-card">

          <h3>
            Top Score
          </h3>

          <h1>

            {
              leaderboard[0]
              ?.score || 0
            }

          </h1>

        </div>

      </div>

      <div className="charts-grid">

        <div className="chart-card">

          <h3>
            Subject Performance
          </h3>

          <ResponsiveContainer
            width="100%"
            height={300}
          >

            <BarChart
              data={
                subjectPerformance
              }
            >

              <XAxis
                dataKey="subject"
              />

              <YAxis />

              <Tooltip />

              <Bar
                dataKey="avgScore"
              />

            </BarChart>

          </ResponsiveContainer>

        </div>

        <div className="chart-card">

          <h3>
            Accuracy Analysis
          </h3>

          <ResponsiveContainer
            width="100%"
            height={300}
          >

            <PieChart>

              <Pie
                data={
                  accuracyData
                }
                dataKey="value"
                outerRadius={100}
                label
              >

                {
                  accuracyData.map(
                    (
                      entry,
                      index
                    ) => (

                    <Cell
                      key={index}
                    />

                  ))
                }

              </Pie>

              <Tooltip />

            </PieChart>

          </ResponsiveContainer>

        </div>

      </div>

      <div className="table-card">

        <h3>
          Leaderboard
        </h3>

        <table>

          <thead>

            <tr>

              <th>
                Rank
              </th>

              <th>
                Subject
              </th>

              <th>
                Score
              </th>

              <th>
                Accuracy
              </th>

            </tr>

          </thead>

          <tbody>

            {
              leaderboard.map(
                (
                  r,
                  index
                ) => (

                <tr key={r.id}>

                  <td>
                    #{index + 1}
                  </td>

                  <td>
                    {r.subject}
                  </td>

                  <td>
                    {r.score}
                  </td>

                  <td>
                    {r.accuracy}%
                  </td>

                </tr>

              ))
            }

          </tbody>

        </table>

      </div>

      <div className="table-card">

        <h3>
          Result History
        </h3>

        <table>

          <thead>

            <tr>

              <th>
                Subject
              </th>

              <th>
                Correct
              </th>

              <th>
                Wrong
              </th>

              <th>
                Score
              </th>

              <th>
                Accuracy
              </th>

            </tr>

          </thead>

          <tbody>

            {
              results.map(
                (r)=>(
                <tr key={r.id}>

                  <td>
                    {r.subject}
                  </td>

                  <td>
                    {r.correct}
                  </td>

                  <td>
                    {r.wrong}
                  </td>

                  <td>
                    {r.score}
                  </td>

                  <td>
                    {r.accuracy}%
                  </td>

                </tr>
              ))
            }

          </tbody>

        </table>

      </div>

    </AdminLayout>

  );
}
