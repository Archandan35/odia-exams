import {
  useEffect,
  useState,
} from "react";

import {
  signOut,
} from "firebase/auth";

import {
  auth,
} from "../firebase/config";

import {
  useNavigate,
} from "react-router-dom";

import {
  listenSubjects,
} from "../services/subjectService";

export default function StudentDashboard() {

  const nav =
    useNavigate();

  const [subjects,
    setSubjects] =
    useState([]);

  useEffect(() => {

    const unsubscribe =
      listenSubjects(
        setSubjects
      );

    return () =>
      unsubscribe();

  }, []);

  async function logout() {

    await signOut(auth);

    nav("/");

  }

  return (

    <div className="page">

      <div
        style={{
          display:"flex",
          justifyContent:
            "space-between",
          alignItems:
            "center",
        }}
      >

        <h1>
          Student Dashboard
        </h1>

        <button
          onClick={logout}
        >
          Logout
        </button>

      </div>

      <div className="grid">

        {subjects.map((s) => (

          <div
            key={s.id}
            className="subject-card"
          >

            <h2>
              {s.title}
            </h2>

            <p>
              {s.description}
            </p>

            <p>
              Duration:
              {s.duration} mins
            </p>

            <button
              onClick={() =>
                nav("/exam")
              }
            >
              Start Test
            </button>

          </div>

        ))}

      </div>

    </div>
  );
}
