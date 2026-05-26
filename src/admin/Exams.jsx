import {
  useEffect,
  useState,
} from "react";

import {
  collection,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";

import {
  db,
} from "../firebase/config";

import {
  listenSubjects,
} from "../services/subjectService";

import {
  listenTopics,
} from "../services/topicService";

import {
  listenSubTopics,
} from "../services/subTopicService";

export default function Exams() {

  // =========================================
  // STATES
  // =========================================

  const [exams,
    setExams] = useState([]);

  const [subjects,
    setSubjects] = useState([]);

  const [topics,
    setTopics] = useState([]);

  const [subTopics,
    setSubTopics] = useState([]);

  const [selectedSubject,
    setSelectedSubject] = useState("");

  const [selectedTopic,
    setSelectedTopic] = useState("");

  const [selectedSubTopic,
    setSelectedSubTopic] = useState("");

  const [showEditModal,
    setShowEditModal] = useState(false);

  const [editingExam,
    setEditingExam] = useState(null);

  // =========================================
  // LOAD EXAMS
  // =========================================

  useEffect(() => {

    const unsubscribe =
      onSnapshot(
        collection(db, "exams"),
        (snapshot) => {

          const data =
            snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));

          setExams(data);
        }
      );

    return () => unsubscribe();

  }, []);

  // =========================================
  // LOAD SUBJECTS
  // =========================================

  useEffect(() => {

    const unsubscribe =
      listenSubjects(setSubjects);

    return () => unsubscribe();

  }, []);

  // =========================================
  // LOAD TOPICS
  // =========================================

  useEffect(() => {

    const unsubscribe =
      listenTopics(setTopics);

    return () => unsubscribe();

  }, []);

  // =========================================
  // LOAD SUB TOPICS
  // =========================================

  useEffect(() => {

    const unsubscribe =
      listenSubTopics(setSubTopics);

    return () => unsubscribe();

  }, []);

  // =========================================
  // FILTERED EXAMS
  // =========================================

  const filteredExams =
    exams.filter((exam) => {

      const subjectMatch =
        selectedSubject
          ? exam.subjectId === selectedSubject
          : true;

      const topicMatch =
        selectedTopic
          ? exam.topicId === selectedTopic
          : true;

      const subTopicMatch =
        selectedSubTopic
          ? exam.subTopicId === selectedSubTopic
          : true;

      return (
        subjectMatch &&
        topicMatch &&
        subTopicMatch
      );
    });

  // =========================================
  // HELPERS
  // =========================================

  function getSubjectName(id) {

    return (
      subjects.find((s) => s.id === id)
        ?.name || "-"
    );
  }

  function getTopicName(id) {

    return (
      topics.find((t) => t.id === id)
        ?.name || "-"
    );
  }

  function getSubTopicName(id) {

    return (
      subTopics.find((s) => s.id === id)
        ?.name || "-"
    );
  }

  // =========================================
  // DELETE
  // =========================================

  async function handleDelete(id) {

    const confirmDelete =
      window.confirm(
        "Delete this exam?"
      );

    if (!confirmDelete) return;

    await deleteDoc(
      doc(db, "exams", id)
    );
  }

  // =========================================
  // EDIT
  // =========================================

  function handleEdit(exam) {

    setEditingExam(exam);

    setShowEditModal(true);
  }

  // =========================================
  // SAVE EDIT
  // =========================================

  async function handleSaveEdit() {

    if (!editingExam) return;

    await updateDoc(
      doc(db, "exams", editingExam.id),
      {

        name:
          editingExam.name,

        subjectId:
          editingExam.subjectId,

        topicId:
          editingExam.topicId,

        subTopicId:
          editingExam.subTopicId,

        totalQuestions:
          Number(
            editingExam.totalQuestions
          ),

        duration:
          Number(
            editingExam.duration
          ),

      }
    );

    alert(
      "Exam Updated Successfully"
    );

    setShowEditModal(false);
  }

  // =========================================
  // UI
  // =========================================

  return (

    <div
      style={{
        padding: "20px",
      }}
    >

      <h1>
        Exams
      </h1>

      {/* ===================================== */}
      {/* FILTERS */}
      {/* ===================================== */}

      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}
      >

        {/* SUBJECT */}

        <select
          value={selectedSubject}
          onChange={(e) =>
            setSelectedSubject(
              e.target.value
            )
          }
        >

          <option value="">
            All Subjects
          </option>

          {subjects.map((subject) => (

            <option
              key={subject.id}
              value={subject.id}
            >
              {subject.name}
            </option>

          ))}

        </select>

        {/* TOPIC */}

        <select
          value={selectedTopic}
          onChange={(e) =>
            setSelectedTopic(
              e.target.value
            )
          }
        >

          <option value="">
            All Topics
          </option>

          {topics.map((topic) => (

            <option
              key={topic.id}
              value={topic.id}
            >
              {topic.name}
            </option>

          ))}

        </select>

        {/* SUB TOPIC */}

        <select
          value={selectedSubTopic}
          onChange={(e) =>
            setSelectedSubTopic(
              e.target.value
            )
          }
        >

          <option value="">
            All Sub Topics
          </option>

          {subTopics.map((subTopic) => (

            <option
              key={subTopic.id}
              value={subTopic.id}
            >
              {subTopic.name}
            </option>

          ))}

        </select>

      </div>

      {/* ===================================== */}
      {/* GRID */}
      {/* ===================================== */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(300px,1fr))",
          gap: "20px",
        }}
      >

        {filteredExams.map((exam) => (

          <div
            key={exam.id}
            style={{
              background: "white",
              borderRadius: "16px",
              padding: "20px",
              boxShadow:
                "0 4px 12px rgba(0,0,0,0.1)",
              position: "relative",
            }}
          >

            {/* BADGE */}

            <div
              style={{
                position: "absolute",
                top: "15px",
                right: "15px",
                background: "#222",
                color: "white",
                padding: "6px 10px",
                borderRadius: "20px",
                fontSize: "12px",
              }}
            >

              {exam.mockType === "full"
                ? "FULL MOCK"
                : "SECTIONAL MOCK"}

            </div>

            {/* TITLE */}

            <h2
              style={{
                marginBottom: "16px",
              }}
            >
              {exam.name}
            </h2>

            {/* DETAILS */}

            <p>
              <strong>
                Subject:
              </strong>{" "}
              {getSubjectName(
                exam.subjectId
              )}
            </p>

            <p>
              <strong>
                Topic:
              </strong>{" "}
              {getTopicName(
                exam.topicId
              )}
            </p>

            <p>
              <strong>
                Sub Topic:
              </strong>{" "}
              {getSubTopicName(
                exam.subTopicId
              )}
            </p>

            <p>
              <strong>
                Quantity:
              </strong>{" "}
              {exam.totalQuestions}
            </p>

            <p>
              <strong>
                Duration:
              </strong>{" "}
              {exam.duration} mins
            </p>

            {/* ACTIONS */}

            <div
              style={{
                display: "flex",
                gap: "10px",
                marginTop: "20px",
              }}
            >

              <button
                onClick={() =>
                  handleEdit(exam)
                }
              >
                Edit
              </button>

              <button
                onClick={() =>
                  handleDelete(exam.id)
                }
              >
                Delete
              </button>

            </div>

          </div>

        ))}

      </div>

      {/* ===================================== */}
      {/* EDIT MODAL */}
      {/* ===================================== */}

      {showEditModal &&
        editingExam && (

        <div
          style={{
            position: "fixed",
            inset: 0,
            background:
              "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 999,
          }}
        >

          <div
            style={{
              background: "white",
              padding: "24px",
              borderRadius: "16px",
              width: "400px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >

            <h2>
              Edit Exam
            </h2>

            {/* NAME */}

            <input
              type="text"
              placeholder="Exam Name"
              value={editingExam.name}
              onChange={(e) =>
                setEditingExam({
                  ...editingExam,
                  name:
                    e.target.value,
                })
              }
            />

            {/* SUBJECT */}

            <select
              value={
                editingExam.subjectId
              }
              onChange={(e) =>
                setEditingExam({
                  ...editingExam,
                  subjectId:
                    e.target.value,
                })
              }
            >

              <option value="">
                Select Subject
              </option>

              {subjects.map((subject) => (

                <option
                  key={subject.id}
                  value={subject.id}
                >
                  {subject.name}
                </option>

              ))}

            </select>

            {/* TOPIC */}

            <select
              value={
                editingExam.topicId
              }
              onChange={(e) =>
                setEditingExam({
                  ...editingExam,
                  topicId:
                    e.target.value,
                })
              }
            >

              <option value="">
                Select Topic
              </option>

              {topics.map((topic) => (

                <option
                  key={topic.id}
                  value={topic.id}
                >
                  {topic.name}
                </option>

              ))}

            </select>

            {/* SUB TOPIC */}

            <select
              value={
                editingExam.subTopicId
              }
              onChange={(e) =>
                setEditingExam({
                  ...editingExam,
                  subTopicId:
                    e.target.value,
                })
              }
            >

              <option value="">
                Select Sub Topic
              </option>

              {subTopics.map((subTopic) => (

                <option
                  key={subTopic.id}
                  value={subTopic.id}
                >
                  {subTopic.name}
                </option>

              ))}

            </select>

            {/* QUANTITY */}

            <select
              value={
                editingExam.totalQuestions
              }
              onChange={(e) =>
                setEditingExam({
                  ...editingExam,
                  totalQuestions:
                    e.target.value,
                })
              }
            >

              <option value={100}>
                100
              </option>

              <option value={50}>
                50
              </option>

              <option value={25}>
                25
              </option>

            </select>

            {/* DURATION */}

            <select
              value={
                editingExam.duration
              }
              onChange={(e) =>
                setEditingExam({
                  ...editingExam,
                  duration:
                    e.target.value,
                })
              }
            >

              <option value={60}>
                60 mins
              </option>

              <option value={45}>
                45 mins
              </option>

              <option value={30}>
                30 mins
              </option>

              <option value={15}>
                15 mins
              </option>

              <option value={10}>
                10 mins
              </option>

            </select>

            {/* ACTIONS */}

            <div
              style={{
                display: "flex",
                gap: "10px",
              }}
            >

              <button
                onClick={
                  handleSaveEdit
                }
              >
                Save
              </button>

              <button
                onClick={() =>
                  setShowEditModal(
                    false
                  )
                }
              >
                Cancel
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}
