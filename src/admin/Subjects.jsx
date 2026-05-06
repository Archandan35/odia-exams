import {
  useEffect,
  useState,
} from "react";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";

import { db } from "../firebase/config";

import AdminLayout from "./AdminLayout";

export default function Subjects() {

  const [subjects, setSubjects] =
    useState([]);

  const [showPopup, setShowPopup] =
    useState(false);

  const [subjectName, setSubjectName] =
    useState("");

  const [editingId, setEditingId] =
    useState(null);

  useEffect(() => {

    const unsub = onSnapshot(
      collection(db, "subjects"),
      (snapshot) => {

        const data = snapshot.docs.map(
          (doc) => ({
            id: doc.id,
            ...doc.data(),
          })
        );

        setSubjects(data);
      }
    );

    return () => unsub();

  }, []);

  async function handleAddSubject() {

    if (!subjectName) return;

    await addDoc(
      collection(db, "subjects"),
      {
        name: subjectName,
        createdAt: Date.now(),
      }
    );

    setSubjectName("");
    setShowPopup(false);
  }

  function editSubject(subject) {

    setEditingId(subject.id);

    setSubjectName(subject.name);

    setShowPopup(true);
  }

  async function updateSubject() {

    await updateDoc(
      doc(db, "subjects", editingId),
      {
        name: subjectName,
      }
    );

    setEditingId(null);

    setSubjectName("");

    setShowPopup(false);
  }

  async function handleDelete(id) {

    const confirmDelete =
      window.confirm(
        "Delete this subject?"
      );

    if (!confirmDelete) return;

    await deleteDoc(
      doc(db, "subjects", id)
    );
  }

  return (

    <AdminLayout>

      <div className="page-header">

        <div>

          <h2>
            Subject Management
          </h2>

          <p>
            Total Subjects:
            {" "}
            {subjects.length}
          </p>

        </div>

        <button
          onClick={() =>
            setShowPopup(true)
          }
        >
          + Add Subject
        </button>

      </div>

      <div className="table-card">

        <table>

          <thead>

            <tr>

              <th>
                Subject
              </th>

              <th>
                Edit
              </th>

              <th>
                Delete
              </th>

            </tr>

          </thead>

          <tbody>

            {
              subjects.map((s) => (

                <tr key={s.id}>

                  <td>
                    {s.name}
                  </td>

                  <td>

                    <button
                      className="edit-btn"
                      onClick={() =>
                        editSubject(s)
                      }
                    >
                      Edit
                    </button>

                  </td>

                  <td>

                    <button
                      className="delete-btn"
                      onClick={() =>
                        handleDelete(s.id)
                      }
                    >
                      Delete
                    </button>

                  </td>

                </tr>

              ))
            }

          </tbody>

        </table>

      </div>

      {
        showPopup && (

          <div className="popup-overlay">

            <div className="popup">

              <h3>

                {
                  editingId
                    ? "Edit Subject"
                    : "Add Subject"
                }

              </h3>

              <input
                type="text"
                placeholder="Subject Name"
                value={subjectName}
                onChange={(e) =>
                  setSubjectName(
                    e.target.value
                  )
                }
              />

              {
                editingId ? (

                  <button
                    onClick={
                      updateSubject
                    }
                  >
                    Update Subject
                  </button>

                ) : (

                  <button
                    onClick={
                      handleAddSubject
                    }
                  >
                    Add Subject
                  </button>

                )
              }

              <button
                className="cancel-btn"
                onClick={() => {

                  setShowPopup(false);

                  setEditingId(null);

                  setSubjectName("");

                }}
              >
                Cancel
              </button>

            </div>

          </div>

        )
      }

    </AdminLayout>
  );
}
