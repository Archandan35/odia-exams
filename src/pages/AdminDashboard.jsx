import {
  useEffect,
  useState,
} from "react";

import {
  addSubject,
  deleteSubject,
  listenSubjects,
} from "../services/subjectService";

export default function AdminDashboard() {

  const [subjects,
    setSubjects] =
    useState([]);

  const [title,
    setTitle] =
    useState("");

  const [description,
    setDescription] =
    useState("");

  const [duration,
    setDuration] =
    useState("");

  useEffect(() => {

    const unsubscribe =
      listenSubjects(
        setSubjects
      );

    return () =>
      unsubscribe();

  }, []);

  async function createSubject() {

    if (!title) return;

    await addSubject({
      title,
      description,
      duration,
      negativeMarking:0.25,
    });

    setTitle("");
    setDescription("");
    setDuration("");

  }

  return (

    <div className="page">

      <h1>
        Admin Dashboard
      </h1>

      <div className="card">

        <h2>
          Add Subject
        </h2>

        <input
          placeholder="Subject Title"
          value={title}
          onChange={(e)=>
            setTitle(
              e.target.value
            )
          }
        />

        <input
          placeholder="Description"
          value={description}
          onChange={(e)=>
            setDescription(
              e.target.value
            )
          }
        />

        <input
          placeholder="Duration"
          value={duration}
          onChange={(e)=>
            setDuration(
              e.target.value
            )
          }
        />

        <button
          onClick={
            createSubject
          }
        >
          Add Subject
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
                deleteSubject(
                  s.id
                )
              }
            >
              Delete
            </button>

          </div>

        ))}

      </div>

    </div>
  );
}
