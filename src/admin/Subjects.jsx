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

export default function SubTopics() {

  const [subjects,
    setSubjects] =
    useState([]);

  const [topics,
    setTopics] =
    useState([]);

  const [subTopics,
    setSubTopics] =
    useState([]);

  const [selectedSubject,
    setSelectedSubject] =
    useState("");

  const [selectedTopic,
    setSelectedTopic] =
    useState("");

  const [showPopup,
    setShowPopup] =
    useState(false);

  const [subTopicName,
    setSubTopicName] =
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
      filteredTopics.length > 0 &&
      !selectedTopic
    ) {

      setSelectedTopic(
        filteredTopics[0].id
      );

    }

  }, [
    selectedSubject,
    topics,
  ]);

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
      !subTopicName.trim()
    ) {

      toast.error(
        "SubTopic name required"
      );

      return;

    }

    if (
      !selectedSubject ||
      !selectedTopic
    ) {

      toast.error(
        "Select subject and topic"
      );

      return;

    }

    const duplicateQuery =
      query(
        collection(db, "subtopics"),
        where(
          "name",
          "==",
          subTopicName.trim()
        ),
        where(
          "subjectId",
          "==",
          selectedSubject
        ),
        where(
          "topicId",
          "==",
          selectedTopic
        )
      );

    const duplicate =
      await getDocs(
        duplicateQuery
      );

    if (!duplicate.empty) {

      toast.error(
        "SubTopic already exists"
      );

      return;

    }

    await addDoc(
      collection(db, "subtopics"),
      {

        name:
          subTopicName.trim(),

        subjectId:
          selectedSubject,

        topicId:
          selectedTopic,

        createdAt:
          Date.now(),

      }
    );

    toast.success(
      "SubTopic Added"
    );

    resetForm();

  }

  function editSubTopic(subTopic) {

    setEditingId(subTopic.id);

    setSubTopicName(
      subTopic.name
    );

    setSelectedSubject(
      subTopic.subjectId
    );

    setSelectedTopic(
      subTopic.topicId
    );

    setShowPopup(true);

  }

  async function updateSubTopic() {

    if (
      !subTopicName.trim()
    ) {

      toast.error(
        "SubTopic name required"
      );

      return;

    }

    await updateDoc(
      doc(
        db,
        "subtopics",
        editingId
      ),
      {

        name:
          subTopicName.trim(),

        subjectId:
          selectedSubject,

        topicId:
          selectedTopic,

      }
    );

    toast.success(
      "SubTopic Updated"
    );

    resetForm();

  }

  async function handleDelete(id) {

    const confirmDelete =
      window.confirm(

`Deleting this subtopic may affect:
• Questions
• Exams

Continue?`

      );

    if (!confirmDelete)
      return;

    await deleteDoc(
      doc(
        db,
        "subtopics",
        id
      )
    );

    toast.success(
      "SubTopic Deleted"
    );

  }

  function getSubjectName(id) {

    const item =
      subjects.find(
        (s) => s.id === id
      );

    return item
      ? item.name
      : "Unknown";

  }

  function getTopicName(id) {

    const item =
      topics.find(
        (t) => t.id === id
      );

    return item
      ? item.name
      : "Unknown";

  }

  function resetForm() {

    setSubTopicName("");

    setEditingId(null);

    setShowPopup(false);

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

      </div>

      <div className="table-card">

        <table>

          <thead>

            <tr>

              <th>
                SubTopic
              </th>

              <th>
                Subject
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
                      getSubjectName(
                        s.subjectId
                      )
                    }
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
