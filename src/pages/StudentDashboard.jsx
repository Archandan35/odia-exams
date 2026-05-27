import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  collection,
  onSnapshot,
} from "firebase/firestore";

import { db } from "../firebase/config";

import { useNavigate } from "react-router-dom";

import TopNavbar from "../components/TopNavbar";

export default function StudentDashboard() {

  const navigate = useNavigate();

  /* =========================================
    STATE
  ========================================= */

  const [exams,     setExams]     = useState([]);
  const [subjects,  setSubjects]  = useState([]);
  const [topics,    setTopics]    = useState([]);
  const [subTopics, setSubTopics] = useState([]);

  // Filters
  const [selectedMockType,  setSelectedMockType]  = useState("");
  const [selectedSubject,   setSelectedSubject]   = useState("");
  const [selectedTopic,     setSelectedTopic]     = useState("");
  const [selectedSubTopic,  setSelectedSubTopic]  = useState("");

  /* =========================================
    LOAD EXAMS
  ========================================= */

  useEffect(() => {

    const unsub = onSnapshot(
      collection(db, "exams"),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setExams(data);
      }
    );

    return () => unsub();

  }, []);

  /* =========================================
    LOAD SUBJECTS
  ========================================= */

  useEffect(() => {

    const unsub = onSnapshot(
      collection(db, "subjects"),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSubjects(data);
      }
    );

    return () => unsub();

  }, []);

  /* =========================================
    LOAD TOPICS
  ========================================= */

  useEffect(() => {

    const unsub = onSnapshot(
      collection(db, "topics"),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTopics(data);
      }
    );

    return () => unsub();

  }, []);

  /* =========================================
    LOAD SUBTOPICS
  ========================================= */

  useEffect(() => {

    const unsub = onSnapshot(
      collection(db, "subTopics"),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSubTopics(data);
      }
    );

    return () => unsub();

  }, []);

  /* =========================================
    DERIVED LABEL HELPERS
  ========================================= */

  function getSubjectName(id) {
    return subjects.find((s) => s.id === id)?.name || "-";
  }

  function getTopicName(id) {
    return topics.find((t) => t.id === id)?.name || "-";
  }

  ffunction getSubTopicName(id) {
    if (!id) return "-";
    // This safely checks against both 'subTopics' collection data items
    const found = subTopics.find((s) => s.id === id);
    return found ? found.name : "-";
  }

  function getQuestionCount(exam) {

    if (typeof exam.totalQuestions === "number" && exam.totalQuestions > 0)
      return exam.totalQuestions;

    if (typeof exam.questionCount === "number" && exam.questionCount > 0)
      return exam.questionCount;

    if (Array.isArray(exam.questionIds) && exam.questionIds.length > 0)
      return exam.questionIds.length;

    if (Array.isArray(exam.questions) && exam.questions.length > 0)
      return exam.questions.length;

    return 0;

  }

  function isFullMock(exam) {
    return (exam.mockType || "sectional") === "full";
  }

  /* =========================================
    FILTERED TOPICS & SUBTOPICS
  ========================================= */

  const filteredTopics = useMemo(() => {
    return topics.filter((t) =>
      !selectedSubject || t.subjectId === selectedSubject
    );
  }, [topics, selectedSubject]);

  const filteredSubTopics = useMemo(() => {
    return subTopics.filter((s) =>
      !selectedTopic || s.topicId === selectedTopic
    );
  }, [subTopics, selectedTopic]);

  /* =========================================
    FILTER EXAMS
  ========================================= */

  const filteredExams = exams.filter((exam) => {

    const mockTypeMatch = selectedMockType
      ? (exam.mockType || "sectional") === selectedMockType
      : true;

    const subjectMatch = !selectedSubject ||
      exam.subjectId === selectedSubject;

    const topicMatch = !selectedTopic ||
      exam.topicId === selectedTopic;

    const subTopicMatch =
      isFullMock(exam)
        ? true
        : (!selectedSubTopic || exam.subTopicId === selectedSubTopic);

    return mockTypeMatch && subjectMatch && topicMatch && subTopicMatch;

  });

  /* =========================================
    UI
  ========================================= */

  return (

    <div className="page">

      <TopNavbar />

      {/* ── Page Header ── */}
      <div className="page-header">
        <div>
          <h2>Student Dashboard</h2>
          <p>Available Exams</p>
        </div>
        <div className="header-actions">
          <button onClick={() => navigate("/leaderboard")}>
            Leaderboard
          </button>
          <button onClick={() => navigate("/profile")}>
            My Profile
          </button>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="filter-grid">

        {/* 1. Mock Type */}
        <select
          value={selectedMockType}
          onChange={(e) => {
            setSelectedMockType(e.target.value);
            setSelectedSubTopic("");
          }}
          className="filter-select"
        >
          <option value="">All Mock Types</option>
          <option value="full">Full Mock</option>
          <option value="sectional">Sectional Mock</option>
        </select>

        {/* 2. Subject */}
        <select
          value={selectedSubject}
          onChange={(e) => {
            setSelectedSubject(e.target.value);
            setSelectedTopic("");
            setSelectedSubTopic("");
          }}
          className="filter-select"
        >
          <option value="">All Subjects</option>
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </select>

        {/* 3. Topic */}
        <select
          value={selectedTopic}
          onChange={(e) => {
            setSelectedTopic(e.target.value);
            setSelectedSubTopic("");
          }}
          className="filter-select"
        >
          <option value="">All Topics</option>
          {filteredTopics.map((topic) => (
            <option key={topic.id} value={topic.id}>
              {topic.name}
            </option>
          ))}
        </select>

        {/* 4. Sub Topic */}
        {selectedMockType !== "full" && (
          <select
            value={selectedSubTopic}
            onChange={(e) => setSelectedSubTopic(e.target.value)}
            className="filter-select"
          >
            <option value="">All SubTopics</option>
            {filteredSubTopics.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>
        )}

      </div>

      {/* ── Exam Cards ── */}
      <div className="subject-grid">

        {filteredExams.length === 0 ? (

          <div className="no-exams-msg">
            No Exams Found
          </div>

        ) : (

          filteredExams.map((exam) => (

            <div key={exam.id} className="subject-card glass-card">

              <div className="exam-card-badge-row">
                <div
                  className={`exam-badge ${
                    isFullMock(exam) ? "full-badge" : "sectional-badge"
                  }`}
                >
                  {isFullMock(exam) ? "FULL MOCK" : "SECTIONAL MOCK"}
                </div>
              </div>

              <h3>{exam.name}</h3>

              <p>
                <strong>Subject:</strong>{" "}
                {getSubjectName(exam.subjectId)}
              </p>

              <p>
                <strong>Topic:</strong>{" "}
                {exam.topicId ? getTopicName(exam.topicId) : "-"}
              </p>

              {!isFullMock(exam) && (
                <p>
                  <strong>Sub Topic:</strong>{" "}
                  {exam.subTopicId ? getSubTopicName(exam.subTopicId) : "-"}
                </p>
              )}

              <p>
                <strong>Questions:</strong>{" "}
                {getQuestionCount(exam)}
              </p>

              <p>
                <strong>Duration:</strong>{" "}
                {exam.duration || 0} mins
              </p>

              <button onClick={() => navigate(`/exam/${exam.id}`)}>
                Start Exam
              </button>

            </div>

          ))

        )}

      </div>

    </div>

  );
}
