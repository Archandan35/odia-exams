import {
  useEffect,
  useMemo,
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

import AdminLayout from "./AdminLayout";

export default function Exams() {

  // =========================================
  // STATES
  // =========================================

  const [exams, setExams]                       = useState([]);
  const [subjects, setSubjects]                 = useState([]);
  const [selectedSubject, setSelectedSubject]   = useState("");
  const [selectedTopic, setSelectedTopic]       = useState("");
  const [selectedSubTopic, setSelectedSubTopic] = useState("");
  const [editingExam, setEditingExam]           = useState(null);
  const [showModal, setShowModal]               = useState(false);

  // =========================================
  // LOAD EXAMS
  // =========================================

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "exams"),
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
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
    const unsubscribe = listenSubjects(setSubjects);
    return () => unsubscribe();
  }, []);

  // =========================================
  // TOPICS (derived from exams)
  // =========================================

  const topics = useMemo(() => {
    return [...new Set(exams.map((e) => e.topicName).filter(Boolean))];
  }, [exams]);

  // =========================================
  // SUB TOPICS (derived from exams)
  // =========================================

  const subTopics = useMemo(() => {
    return [...new Set(exams.map((e) => e.subTopicName).filter(Boolean))];
  }, [exams]);

  // =========================================
  // FILTERED EXAMS
  // =========================================

  const filteredExams = exams.filter((exam) => {
    const subjectMatch  = selectedSubject  ? exam.subjectId    === selectedSubject  : true;
    const topicMatch    = selectedTopic    ? exam.topicName    === selectedTopic    : true;
    const subTopicMatch = selectedSubTopic ? exam.subTopicName === selectedSubTopic : true;
    return subjectMatch && topicMatch && subTopicMatch;
  });

  // =========================================
  // HELPERS
  // =========================================

  function getSubjectName(id) {
    return subjects.find((s) => s.id === id)?.name || "-";
  }

  // =========================================
  // DELETE
  // =========================================

  async function handleDelete(id) {
    const confirmDelete = window.confirm("Delete this exam?");
    if (!confirmDelete) return;
    await deleteDoc(doc(db, "exams", id));
  }

  // =========================================
  // EDIT
  // =========================================

  function handleEdit(exam) {
    setEditingExam({
      ...exam,
      mockType:       exam.mockType       || "sectional",
      totalQuestions: exam.totalQuestions || exam.questionCount || 0,
      duration:       exam.duration       || 0,
    });
    setShowModal(true);
  }

  // =========================================
  // SAVE
  // =========================================

  async function handleSave() {
    if (!editingExam) return;
    await updateDoc(doc(db, "exams", editingExam.id), {
      name:           editingExam.name,
      mockType:       editingExam.mockType,
      subjectId:      editingExam.subjectId,
      topicName:      editingExam.topicName,
      subTopicName:   editingExam.subTopicName,
      totalQuestions: Number(editingExam.totalQuestions),
      duration:       Number(editingExam.duration),
    });
    alert("Exam Updated Successfully");
    setShowModal(false);
  }

  // =========================================
  // UI
  // =========================================

  return (

    <AdminLayout>

      <div className="page">

        {/* HEADER */}
        <div className="page-header">
          <div>
            <h2>Exams</h2>
            <p>Manage generated mocks</p>
          </div>
        </div>

        {/* FILTERS */}
        <div className="filter-bar">

          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
          >
            <option value="">All Subjects</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>

          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
          >
            <option value="">All Topics</option>
            {topics.map((topic) => (
              <option key={topic} value={topic}>{topic}</option>
            ))}
          </select>

          <select
            value={selectedSubTopic}
            onChange={(e) => setSelectedSubTopic(e.target.value)}
          >
            <option value="">All Sub Topics</option>
            {subTopics.map((subTopic) => (
              <option key={subTopic} value={subTopic}>{subTopic}</option>
            ))}
          </select>

        </div>

        {/* EXAMS GRID */}
        <div className="exam-grid">

          {filteredExams.map((exam) => (

            <div key={exam.id} className="exam-card">

              {/*
                FIX 4: Badge on ROW 1, title on ROW 2, details below.
                Uses flex-direction:column so nothing overlaps.
              */}

              {/* ROW 1 — Badge only */}
              <div className="exam-card-badge-row">
                <div className={`exam-badge ${
                  (exam.mockType || "sectional") === "full"
                    ? "full-badge"
                    : "sectional-badge"
                }`}>
                  {(exam.mockType || "sectional") === "full"
                    ? "FULL MOCK"
                    : "SECTIONAL MOCK"}
                </div>
              </div>

              {/* ROW 2 — Full title on its own line */}
              <h2 className="exam-card-title">
                {exam.name}
              </h2>

              {/* DETAILS */}
              <div className="exam-details">

                <p>
                  <strong>Subject:</strong>{" "}
                  {getSubjectName(exam.subjectId)}
                </p>

                <p>
                  <strong>Topic:</strong>{" "}
                  {exam.topicName || "Topic Missing"}
                </p>

                <p>
                  <strong>Sub Topic:</strong>{" "}
                  {exam.subTopicName || "Sub Topic Missing"}
                </p>

                <p>
                  <strong>Quantity:</strong>{" "}
                  {exam.totalQuestions || exam.questionCount || 0} Questions
                </p>

                <p>
                  <strong>Duration:</strong>{" "}
                  {exam.duration} mins
                </p>

              </div>

              {/* ACTIONS */}
              <div className="exam-actions">

                <button
                  className="edit-btn"
                  onClick={() => handleEdit(exam)}
                >
                  Edit
                </button>

                <button
                  className="delete-btn"
                  onClick={() => handleDelete(exam.id)}
                >
                  Delete
                </button>

              </div>

            </div>

          ))}

        </div>

        {/* EDIT MODAL */}
        {showModal && editingExam && (

          <div className="popup-overlay">

            <div className="popup exam-edit-modal">

              <h3>Edit Exam</h3>

              <div className="exam-edit-grid">

                {/* NAME */}
                <input
                  className="exam-full-width"
                  type="text"
                  placeholder="Exam Name"
                  value={editingExam.name}
                  onChange={(e) =>
                    setEditingExam({ ...editingExam, name: e.target.value })
                  }
                />

                {/* MOCK TYPE */}
                <select
                  value={editingExam.mockType}
                  onChange={(e) =>
                    setEditingExam({ ...editingExam, mockType: e.target.value })
                  }
                >
                  <option value="full">Full Mock</option>
                  <option value="sectional">Sectional Mock</option>
                </select>

                {/* SUBJECT */}
                <select
                  value={editingExam.subjectId}
                  onChange={(e) =>
                    setEditingExam({ ...editingExam, subjectId: e.target.value })
                  }
                >
                  <option value="">Select Subject</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>

                {/* TOPIC */}
                <input
                  type="text"
                  placeholder="Topic Name"
                  value={editingExam.topicName || ""}
                  onChange={(e) =>
                    setEditingExam({ ...editingExam, topicName: e.target.value })
                  }
                />

                {/* SUB TOPIC */}
                <input
                  type="text"
                  placeholder="Sub Topic Name"
                  value={editingExam.subTopicName || ""}
                  onChange={(e) =>
                    setEditingExam({ ...editingExam, subTopicName: e.target.value })
                  }
                />

                {/* QUANTITY */}
                <div className="custom-input-group">
                  <select
                    value={editingExam.totalQuestions}
                    onChange={(e) =>
                      setEditingExam({ ...editingExam, totalQuestions: e.target.value })
                    }
                  >
                    <option value={100}>100 Questions</option>
                    <option value={50}>50 Questions</option>
                    <option value={25}>25 Questions</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Custom Questions"
                    value={editingExam.totalQuestions}
                    onChange={(e) =>
                      setEditingExam({ ...editingExam, totalQuestions: e.target.value })
                    }
                  />
                </div>

                {/* DURATION */}
                <div className="custom-input-group">
                  <select
                    value={editingExam.duration}
                    onChange={(e) =>
                      setEditingExam({ ...editingExam, duration: e.target.value })
                    }
                  >
                    <option value={60}>60 mins</option>
                    <option value={45}>45 mins</option>
                    <option value={30}>30 mins</option>
                    <option value={15}>15 mins</option>
                    <option value={10}>10 mins</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Custom Duration"
                    value={editingExam.duration}
                    onChange={(e) =>
                      setEditingExam({ ...editingExam, duration: e.target.value })
                    }
                  />
                </div>

              </div>

              {/* ACTIONS */}
              <div className="exam-actions">

                <button
                  className="submit-btn"
                  onClick={handleSave}
                >
                  Save
                </button>

                <button
                  className="cancel-btn"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>

              </div>

            </div>

          </div>

        )}

      </div>

    </AdminLayout>
  );
}
