import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  collection,
  onSnapshot,
} from "firebase/firestore";

import { db } from "../firebase/config";

import {
  listenSubjects,
} from "../services/subjectService";

export default function ExamPage() {

  const navigate = useNavigate();

  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [selectedMockType, setSelectedMockType] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [selectedSubTopic, setSelectedSubTopic] = useState("");

  /* =========================================
    LOAD EXAMS (real-time)
  ========================================= */

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

  /* =========================================
    LOAD SUBJECTS (real-time)
  ========================================= */

  useEffect(() => {

    const unsubscribe = listenSubjects(setSubjects);

    return () => unsubscribe();

  }, []);

  /* =========================================
    DERIVED FILTER OPTIONS
  ========================================= */

  const filteredTopics = useMemo(() => {

    return [
      ...new Set(
        exams
          .filter((e) =>
            selectedSubject
              ? e.subjectId === selectedSubject
              : true
          )
          .map((e) => e.topicName)
          .filter(Boolean)
      ),
    ];

  }, [exams, selectedSubject]);

  const filteredSubTopics = useMemo(() => {

    return [
      ...new Set(
        exams
          .filter((e) =>
            selectedTopic
              ? e.topicName === selectedTopic
              : true
          )
          .map((e) => e.subTopicName)
          .filter(Boolean)
      ),
    ];

  }, [exams, selectedTopic]);

  /* =========================================
    FILTERED EXAMS
  ========================================= */

  const filteredExams = exams.filter((exam) => {

    const mockTypeMatch = selectedMockType
      ? (exam.mockType || "sectional") === selectedMockType
      : true;

    const subjectMatch = selectedSubject
      ? exam.subjectId === selectedSubject
      : true;

    const topicMatch = selectedTopic
      ? exam.topicName === selectedTopic
      : true;

    const subTopicMatch =
      selectedMockType === "full"
        ? true
        : selectedSubTopic
          ? exam.subTopicName === selectedSubTopic
          : true;

    return (
      mockTypeMatch &&
      subjectMatch &&
      topicMatch &&
      subTopicMatch
    );

  });

  /* =========================================
    HELPERS
  ========================================= */

  function getSubjectName(id) {
    return subjects.find((s) => s.id === id)?.name || "-";
  }

  function getQuestionCount(exam) {
    return (
      exam.totalQuestions ||
      exam.questionCount ||
      exam.questionIds?.length ||
      exam.questions?.length ||
      0
    );
  }

  function isFullMock(exam) {
    return (exam.mockType || "sectional") === "full";
  }

  function handleStartExam(examId) {
    navigate(`/exam/${examId}`);
  }

  /* =========================================
    UI
  ========================================= */

  return (

    <div className="page">

      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h2>Exams</h2>
          <p>Choose a mock to begin</p>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="filter-bar">

        {/* Mock Type */}
        <select
          value={selectedMockType}
          onChange={(e) => {
            setSelectedMockType(e.target.value);
            setSelectedSubTopic("");
          }}
        >
          <option value="">All Mock Types</option>
          <option value="full">Full Mock</option>
          <option value="sectional">Sectional Mock</option>
        </select>

        {/* Subject */}
        <select
          value={selectedSubject}
          onChange={(e) => {
            setSelectedSubject(e.target.value);
            setSelectedTopic("");
            setSelectedSubTopic("");
          }}
        >
          <option value="">All Subjects</option>
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </select>

        {/* Topic */}
        <select
          value={selectedTopic}
          onChange={(e) => {
            setSelectedTopic(e.target.value);
            setSelectedSubTopic("");
          }}
        >
          <option value="">All Topics</option>
          {filteredTopics.map((topic) => (
            <option key={topic} value={topic}>
              {topic}
            </option>
          ))}
        </select>

        {/* Sub Topic — hidden when Full Mock is selected */}
        {selectedMockType !== "full" && (
          <select
            value={selectedSubTopic}
            onChange={(e) => setSelectedSubTopic(e.target.value)}
          >
            <option value="">All Sub Topics</option>
            {filteredSubTopics.map((subTopic) => (
              <option key={subTopic} value={subTopic}>
                {subTopic}
              </option>
            ))}
          </select>
        )}

      </div>

      {/* ── Exam Cards ── */}
      <div className="exam-grid">

        {filteredExams.length === 0 && (
          <p className="no-exams-msg">No exams found for the selected filters.</p>
        )}

        {filteredExams.map((exam) => (

          <div key={exam.id} className="exam-card">

            {/* Badge */}
            <div className="exam-card-badge-row">
              <div
                className={`exam-badge ${
                  isFullMock(exam) ? "full-badge" : "sectional-badge"
                }`}
              >
                {isFullMock(exam) ? "FULL MOCK" : "SECTIONAL MOCK"}
              </div>
            </div>

            {/* Exam Name */}
            <h2 className="exam-card-title">
              {exam.name}
            </h2>

            {/* Details */}
            <div className="exam-details">

              <p>
                <strong>Subject:</strong>{" "}
                {getSubjectName(exam.subjectId)}
              </p>

              <p>
                <strong>Topic:</strong>{" "}
                {exam.topicName || "-"}
              </p>

              {/* Sub Topic — hidden for Full Mock */}
              {!isFullMock(exam) && (
                <p>
                  <strong>Sub Topic:</strong>{" "}
                  {exam.subTopicName || "-"}
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

            </div>

            {/* Actions */}
            <div className="exam-actions">
              <button
                className="start-btn"
                onClick={() => handleStartExam(exam.id)}
              >
                Start Exam
              </button>
            </div>

          </div>

        ))}

      </div>

    </div>

  );

}
