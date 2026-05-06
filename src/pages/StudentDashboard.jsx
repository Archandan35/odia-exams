import {
  useEffect,
  useState,
} from "react";

import {
  listenSubjects,
} from "../services/subjectService";

import {
  useNavigate,
} from "react-router-dom";

export default function StudentDashboard() {

  const [subjects,
    setSubjects] =
    useState([]);

  const nav =
    useNavigate();

  useEffect(() => {

    const unsubscribe =
      listenSubjects(
        setSubjects
      );

    return () =>
      unsubscribe();

  }, []);

  return (

    <div className="page">

      <h1>
        Student Dashboard
      </h1>

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
