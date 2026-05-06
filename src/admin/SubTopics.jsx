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

export default function SubTopics() {

  const [subjects, setSubjects] =
    useState([]);

  const [topics, setTopics] =
    useState([]);

  const [subTopics, setSubTopics] =
    useState([]);

  const [selectedSubject,
    setSelectedSubject] =
    useState("");

  const [selectedTopic,
    setSelectedTopic] =
    useState("");

  const [subTopicName,
    setSubTopicName] =
    useState("");

  const [showPopup,
    setShowPopup] =
    useState(false);

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

  useEffect(() => {

    const unsubSubTopics =
      onSnapshot(
        collection(db, "subtopics"),
        (snapshot) => {

          const data =
            snapshot.docs.map(
              (doc) => ({
                id: doc.id,
                ...doc.data(),
              })
            );

          setSubTopics(data);

        }
      );

    return () =>
      unsubSubTopics();

  }, []);

  const filteredTopics =
    topics.filter(
      (t) =>
        t.subjectId ===
        selectedSubject
    );

  useEffect(() => {

    if (
      filteredTopics.length > 0
    ) {
      setSelectedTopic(
        filteredTopics[0].id
      );
    }

  }, [selectedSubject]);

  const filteredSubTopics =
    subTopics.filter(
      (s) =>
        s.subjectId ===
          selectedSubject &&
        s.topicId ===
          selectedTopic
    );

  async function handleAddSubTopic() {

    if (
      !subTopicName ||
      !selectedSubject ||
      !selectedTopic
    ) return;

    await addDoc(
      collection(db, "subtopics"),
      {
        name: subTopicName,
        subjectId:
          selectedSubject,
        topicId:
          selectedTopic,
        createdAt:
          Date.now(),
      }
    );

    setSubTopicName("");
    setShowPopup(false);
  }

  function editSubTopic(sub) {

    setEditingId(sub.id);

    setSubTopicName(sub.name);

    setSelectedSubject(
      sub.subjectId
    );

    setSelectedTopic(
      sub.topicId
    );

    setShowPopup(true);
  }

  async function updateSubTopic() {

    await updateDoc(
      doc(
        db,
        "subtopics",
        editingId
      ),
      {
        name: subTopicName,
        subjectId:
          selectedSubject,
        topicId:
          selectedTopic,
      }
    );

    setEditingId(null);

    setSubTopicName("");

    setShowPopup(false);
  }

  async function handleDelete(id) {

    const confirmDelete =
      window.confirm(
        "Delete this subtopic?"
      );

    if (!confirmDelete) return;

    await deleteDoc(
      doc(
        db,
        "subtopics",
        id
      )
    );
  }

  function getTopicName(id) {

    const topic =
      topics.find(
        (t) => t.id === id
      );

    return topic
      ? topic.name
      : "Unknown";
  }

  return (

    <AdminLayout>

      <div className="page-header">

        <div>

          <h2>
            SubTopic Management
          </h2>

          <p>
            Total SubTopics:
            {" "}
            {
              filteredSubTopics.length
            }
          </p>

        </div>

        <button
          onClick={() =>
            setShowPopup(true)
          }
        >
          + Add SubTopic
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

        <select
          value={selectedTopic}
          onChange={(e) =>
            setSelectedTopic(
              e.target.value
            )
          }
        >

          {
            filteredTopics.map(
              (t) => (

              <option
                key={t.id}
                value={t.id}
              >
                {t.name}
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
                SubTopic
              </th>

              <th>
                Topic
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
              filteredSubTopics.map(
                (s) => (

                <tr key={s.id}>

                  <td>
                    {s.name}
                  </td>

                  <td>
                    {
                      getTopicName(
                        s.topicId
                      )
                    }
                  </td>

                  <td>

                    <button
                      className="edit-btn"
                      onClick={() =>
                        editSubTopic(s)
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
                          s.id
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
                    ? "Edit SubTopic"
                    : "Add SubTopic"
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

              <select
                value={
                  selectedTopic
                }
                onChange={(e) =>
                  setSelectedTopic(
                    e.target.value
                  )
                }
              >

                {
                  filteredTopics.map(
                    (t) => (

                    <option
                      key={t.id}
                      value={t.id}
                    >
                      {t.name}
                    </option>

                  ))
                }

              </select>

              <input
                type="text"
                placeholder="SubTopic Name"
                value={subTopicName}
                onChange={(e) =>
                  setSubTopicName(
                    e.target.value
                  )
                }
              />

              {
                editingId ? (

                  <button
                    onClick={
                      updateSubTopic
                    }
                  >
                    Update SubTopic
                  </button>

                ) : (

                  <button
                    onClick={
                      handleAddSubTopic
                    }
                  >
                    Add SubTopic
                  </button>

                )
              }

              <button
                className="cancel-btn"
                onClick={() => {

                  setShowPopup(false);

                  setEditingId(null);

                  setSubTopicName("");

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
