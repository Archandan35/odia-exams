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
  LineChart,
  Line,
} from "recharts";

export default function Dashboard() {

  const [subjects,
    setSubjects] =
    useState([]);

  const [topics,
    setTopics] =
    useState([]);

  const [subTopics,
    setSubTopics] =
    useState([]);

  const [questions,
    setQuestions] =
    useState([]);

  const [results,
    setResults] =
    useState([]);

  const [users,
    setUsers] =
    useState([]);

  useEffect(()=>{

    const unsubSubjects =
      onSnapshot(
        collection(db,"subjects"),
        (snapshot)=>{

          setSubjects(
            snapshot.docs.map(
              (doc)=>({
                id:doc.id,
                ...doc.data(),
              })
            )
          );

        }
      );

    const unsubTopics =
      onSnapshot(
        collection(db,"topics"),
        (snapshot)=>{

          setTopics(
            snapshot.docs.map(
              (doc)=>({
                id:doc.id,
                ...doc.data(),
              })
            )
          );

        }
      );

    const unsubSubTopics =
      onSnapshot(
        collection(db,"subtopics"),
        (snapshot)=>{

          setSubTopics(
            snapshot.docs.map(
              (doc)=>({
                id:doc.id,
                ...doc.data(),
              })
            )
          );

        }
      );

    const unsubQuestions =
      onSnapshot(
        collection(db,"questions"),
        (snapshot)=>{

          setQuestions(
            snapshot.docs.map(
              (doc)=>({
                id:doc.id,
                ...doc.data(),
              })
            )
          );

        }
      );

    const unsubResults =
      onSnapshot(
        collection(db,"results"),
        (snapshot)=>{

          setResults(
            snapshot.docs.map(
              (doc)=>({
                id:doc.id,
                ...doc.data(),
              })
            )
          );

        }
      );

    const unsubUsers =
      onSnapshot(
        collection(db,"users"),
        (snapshot)=>{

          setUsers(
            snapshot.docs.map(
              (doc)=>({
                id:doc.id,
                ...doc.data(),
              })
            )
          );

        }
      );

    return ()=>{

      unsubSubjects();
      unsubTopics();
      unsubSubTopics();
      unsubQuestions();
      unsubResults();
      unsubUsers();

    };

  },[]);

  const totalSubjects =
    subjects.length;

  const totalTopics =
    topics.length;

  const totalSubTopics =
    subTopics.length;

  const totalQuestions =
    questions.length;

  const totalAttempts =
    results.length;

  const totalStudents =
    users.filter(
      (u)=>
        u.role ===
        "student"
    ).length;

  const averageAccuracy =
    results.length > 0
    ? (
      results.reduce(
        (a,b)=>
          a +
          Number(
            b.accuracy
          ),
        0
      )
      /
      results.length
    ).toFixed(2)
    : 0;

  const topScore =
    results.length > 0
    ? Math.max(
      ...results.map(
        (r)=>
          Number(r.score)
      )
    )
    : 0;

  const subjectChartData =
    subjects.map((s)=>{

      const related =
        questions.filter(
          (q)=>
            q.subjectId ===
            s.id
        );

      return {

        name:s.name,

        questions:
          related.length,

      };

    });

  const performanceTrend =
    results.slice(0,10)
    .map((r,index)=>({

      name:`Exam ${index+1}`,

      score:Number(r.score),

    }));

  const accuracyPie = [

    {
      name:"Correct",
      value:
        results.reduce(
          (a,b)=>
            a + Number(b.correct || 0),
          0
        ),
    },

    {
      name:"Wrong",
      value:
        results.reduce(
          (a,b)=>
            a + Number(b.wrong || 0),
          0
        ),
    },

  ];

  const recentResults =
    [...results]
    .sort(
      (a,b)=>
        b.createdAt -
        a.createdAt
    )
    .slice(0,5);

  return (

    <AdminLayout>

      <div className="page-header">

        <div>

          <h2>
            Analytics Dashboard
          </h2>

          <p>
            Realtime Admin Overview
          </p>

        </div>

      </div>

      <div className="dashboard-grid">

        <div className="analytics-card">
          <h3>Total Subjects</h3>
          <h1>{totalSubjects}</h1>
          <p>Available Subjects</p>
        </div>

        <div className="analytics-card">
          <h3>Total Topics</h3>
          <h1>{totalTopics}</h1>
          <p>Across Subjects</p>
        </div>

        <div className="analytics-card">
          <h3>Total SubTopics</h3>
          <h1>{totalSubTopics}</h1>
          <p>Nested Categories</p>
        </div>

        <div className="analytics-card">
          <h3>Total Questions</h3>
          <h1>{totalQuestions}</h1>
          <p>Question Bank</p>
        </div>

        <div className="analytics-card">
          <h3>Total Attempts</h3>
          <h1>{totalAttempts}</h1>
          <p>Exam Attempts</p>
        </div>

        <div className="analytics-card">
          <h3>Students</h3>
          <h1>{totalStudents}</h1>
          <p>Registered Students</p>
        </div>

        <div className="analytics-card">
          <h3>Average Accuracy</h3>
          <h1>{averageAccuracy}%</h1>
          <p>Overall Performance</p>
        </div>

        <div className="analytics-card">
          <h3>Top Score</h3>
          <h1>{topScore}</h1>
          <p>Highest Performance</p>
        </div>

      </div>

      <div className="charts-grid">

        <div className="chart-card">

          <h3>
            Questions Per Subject
          </h3>

          <ResponsiveContainer
            width="100%"
            height={300}
          >

            <BarChart
              data={
                subjectChartData
              }
            >

              <XAxis
                dataKey="name"
              />

              <YAxis />

              <Tooltip />

              <Bar
                dataKey="questions"
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
                  accuracyPie
                }
                dataKey="value"
                outerRadius={100}
                label
              >

                {
                  accuracyPie.map(
                    (
                      entry,
                      index
                    )=>(
                      <Cell
                        key={index}
                      />
                    )
                  )
                }

              </Pie>

              <Tooltip />

            </PieChart>

          </ResponsiveContainer>

        </div>

      </div>

      <div className="chart-card">

        <h3>
          Performance Trends
        </h3>

        <ResponsiveContainer
          width="100%"
          height={300}
        >

          <LineChart
            data={
              performanceTrend
            }
          >

            <XAxis
              dataKey="name"
            />

            <YAxis />

            <Tooltip />

            <Line
              type="monotone"
              dataKey="score"
            />

          </LineChart>

        </ResponsiveContainer>

      </div>

      <div className="table-card">

        <h3>
          Recent Results
        </h3>

        <table>

          <thead>

            <tr>

              <th>
                Subject
              </th>

              <th>
                Score
              </th>

              <th>
                Accuracy
              </th>

              <th>
                Correct
              </th>

              <th>
                Wrong
              </th>

            </tr>

          </thead>

          <tbody>

            {
              recentResults.map(
                (r)=>(
                <tr key={r.id}>

                  <td>
                    {r.subject}
                  </td>

                  <td>
                    {r.score}
                  </td>

                  <td>
                    {r.accuracy}%
                  </td>

                  <td>
                    {r.correct}
                  </td>

                  <td>
                    {r.wrong}
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
