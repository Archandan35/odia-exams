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

export default function Topics() {

  const [subjects, setSubjects] =
    useState([]);

  const [topics, setTopics] =
    useState([]);

  const [selectedSubject,
    setSelectedSubject] =
    useState("");

  const [showPopup,
    setShowPopup] =
    useState(false);

  const [topicName,
    setTopicName] =
    useState("");

  const [editingId,
    setEditingId] =
    useState(null);

  useEffect(() => {

    const unsubSubjects =
      onSnapshot(
        collection(db, "subjects"),
        (snapshot) => {

          const data =
            snapshot.docs.map(
              (doc) => ({
                id: doc.id,
                ...doc.data(),
              })
            );

          setSubjects(data);

          if (
            data.length > 0 &&
            !selectedSubject
          ) {

            setSelectedSubject(
              data[0].id
            );

          }

        }
      );

    return () =>
      unsubSubjects();

  }, []);

  useEffect(() => {

    const unsubTopics =
      onSnapshot(
        collection(db, "topics"),
        (snapshot) => {

          const data =
            snapshot.docs.map(
              (doc) => ({
                id: doc.id,
                ...doc.data(),
              })
            );

          setTopics(data);

        }
      );

    return () =>
      unsubTopics();

  }, []);

  async function handleAddTopic() {

    if (
      !topicName.trim()
    ) {

      toast.error(
        "Topic name required"
      );

      return;

    }

    if (!selectedSubject) {

      toast.error(
        "Select subject"
      );

      return;

    }

    const duplicateQuery =
      query(
        collection(db, "topics"),
        where(
          "name",
          "==",
          topicName.trim()
        ),
        where(
          "subjectId",
          "==",
          selectedSubject
        )
      );

    const duplicate =
      await getDocs(
        duplicateQuery
      );

    if (!duplicate.empty) {

      toast.error(
        "Topic already exists in this subject"
      );

      return;

    }

    await addDoc(
      collection(db, "topics"),
      {

        name:
          topicName.trim(),

        subjectId:
          selectedSubject,

        createdAt:
          Date.now(),

      }
    );

    toast.success(
      "Topic Added"
    );

    resetForm();

  }

  function editTopic(topic) {

    setEditingId(topic.id);

    setTopicName(topic.name);

    setSelectedSubject(
      topic.subjectId
    );

    setShowPopup(true);

  }

  async function updateTopic() {

    if (
      !topicName.trim()
    ) {

      toast.error(
        "Topic name required"
      );

      return;

    }

    await updateDoc(
      doc(
        db,
        "topics",
        editingId
      ),
      {

        name:
          topicName.trim(),

        subjectId:
          selectedSubject,

      }
    );

    toast.success(
      "Topic Updated"
    );

    resetForm();

  }

  async function handleDelete(id) {

    const confirmDelete =
      window.confirm(

`Deleting this topic may affect:
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
        "topics",
        id
      )
    );

    toast.success(
      "Topic Deleted"
    );

  }

  const filteredTopics =
    topics.filter(
      (t) =>
        t.subjectId ===
        selectedSubject
    );

  function getSubjectName(id) {

    const subject =
      subjects.find(
        (s) => s.id === id
      );

    return subject
      ? subject.name
      : "Unknown";

  }

  function resetForm() {

    setTopicName("");

    setEditingId(null);

    setShowPopup(false);

  }

  return (

    <AdminLayout>

      <div className="page-header">

        <div>

          <h2>
            Topic Management
          </h2>

          <p>
            Total Topics:
            {" "}
            {
              filteredTopics.length
            }
          </p>

        </div>

        <button
          onClick={() =>
            setShowPopup(true)
          }
        >
          + Add Topic
        </button>

      </div>

      <div className="filter-bar">

        <select
          value={
            selectedSubject
          }
          onChange={(e) =>
            setSelectedSubject(
              e.target.value
            )
          }
        >

          {
            subjects.map((s) => (

              <option
                key={s.id}
                value={s.id}
              >
                {s.name}
              </option>

            ))
          }

        </select>

      </div>

      <div className="table-card">

        <table>

          <thead>

            <tr>

              <th>
                Topic
              </th>

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
              filteredTopics.map(
                (t) => (

                <tr key={t.id}>

                  <td>
                    {t.name}
                  </td>

                  <td>
                    {
                      getSubjectName(
                        t.subjectId
                      )
                    }
                  </td>

                  <td>

                    <button
                      className="edit-btn"
                      onClick={() =>
                        editTopic(t)
                      }
                    >
                      Edit
                    </button>

                  </td>

                  <td>

                    <button
                      className="delete-btn"
                      onClick={() =>
                        handleDelete(
                          t.id
                        )
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
                    ? "Edit Topic"
                    : "Add Topic"
                }

              </h3>

              <select
                value={
                  selectedSubject
                }
                onChange={(e) =>
                  setSelectedSubject(
                    e.target.value
                  )
                }
              >

                {
                  subjects.map(
                    (s) => (

                    <option
                      key={s.id}
                      value={s.id}
                    >
                      {s.name}
                    </option>

                  ))
                }

              </select>

              <input
                type="text"
                placeholder="Topic Name"
                value={topicName}
                onChange={(e) =>
                  setTopicName(
                    e.target.value
                  )
                }
              />

              {
                editingId ? (

                  <button
                    onClick={
                      updateTopic
                    }
                  >
                    Update Topic
                  </button>

                ) : (

                  <button
                    onClick={
                      handleAddTopic
                    }
                  >
                    Add Topic
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
