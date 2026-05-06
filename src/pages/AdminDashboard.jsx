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
  addSubject,
  deleteSubject,
  listenSubjects,
} from "../services/subjectService";

export default function AdminDashboard() {

  const nav =
    useNavigate();

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

  async function logout() {

    await signOut(auth);

    nav("/");

  }

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
          Admin Dashboard
        </h1>

        <button
          onClick={logout}
        >
          Logout
        </button>

      </div>

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
