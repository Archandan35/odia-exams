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
      !topicName ||
      !selectedSubject
    ) return;

    await addDoc(
      collection(db, "topics"),
      {
        name: topicName,
        subjectId:
          selectedSubject,
        createdAt:
          Date.now(),
      }
    );

    setTopicName("");
    setShowPopup(false);
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

    await updateDoc(
      doc(db, "topics", editingId),
      {
        name: topicName,
        subjectId:
          selectedSubject,
      }
    );

    setEditingId(null);

    setTopicName("");

    setShowPopup(false);
  }

  async function handleDelete(id) {

    const confirmDelete =
      window.confirm(
        "Delete this topic?"
      );

    if (!confirmDelete) return;

    await deleteDoc(
      doc(db, "topics", id)
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
            {filteredTopics.length}
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
                onClick={() => {

                  setShowPopup(false);

                  setEditingId(null);

                  setTopicName("");

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
