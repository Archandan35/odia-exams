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
  query,
  where,
  getDocs,
} from "firebase/firestore";

import toast from "react-hot-toast";

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

    if (!subjectName.trim()) {

      toast.error(
        "Subject name required"
      );

      return;

    }

    const duplicateQuery =
      query(
        collection(db, "subjects"),
        where(
          "name",
          "==",
          subjectName.trim()
        )
      );

    const duplicate =
      await getDocs(
        duplicateQuery
      );

    if (!duplicate.empty) {

      toast.error(
        "Subject already exists"
      );

      return;

    }

    await addDoc(
      collection(db, "subjects"),
      {

        name:
          subjectName.trim(),

        createdAt:
          Date.now(),

      }
    );

    toast.success(
      "Subject Added"
    );

    resetForm();

  }

  function editSubject(subject) {

    setEditingId(subject.id);

    setSubjectName(subject.name);

    setShowPopup(true);

  }

  async function updateSubject() {

    if (!subjectName.trim()) {

      toast.error(
        "Subject name required"
      );

      return;

    }

    await updateDoc(
      doc(
        db,
        "subjects",
        editingId
      ),
      {

        name:
          subjectName.trim(),

      }
    );

    toast.success(
      "Subject Updated"
    );

    resetForm();

  }

  async function handleDelete(id) {

    const confirmDelete =
      window.confirm(

`Deleting this subject may affect:
• Topics
• SubTopics
• Questions
• Exams

Continue?`

      );

    if (!confirmDelete)
      return;

    await deleteDoc(
      doc(
        db,
        "subjects",
        id
      )
    );

    toast.success(
      "Subject Deleted"
    );

  }

  function resetForm() {

    setSubjectName("");

    setEditingId(null);

    setShowPopup(false);

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
                onClick={
                  resetForm
                }
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
