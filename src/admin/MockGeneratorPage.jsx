import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  collection,
  getDocs,
  onSnapshot,
} from "firebase/firestore";

import { db } from "../firebase/config";

import AdminLayout from "./AdminLayout";

import {
  listenSubjects,
} from "../services/subjectService";

import {
  generateMocks,
} from "../services/mockGeneratorService";

export default function MockGeneratorPage() {

  const navigate = useNavigate();

  /* =========================================
     STATES
  ========================================= */

  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [subTopics, setSubTopics] = useState([]);
  const [questions, setQuestions] = useState([]);

  const [mockName, setMockName] = useState("");
  const [mockType, setMockType] = useState("sectional");

  const [subjectId, setSubjectId] = useState("");
  const [topic, setTopic] = useState("");
  const [subTopic, setSubTopic] = useState("");

  const [quantity, setQuantity] = useState(25);
  const [duration, setDuration] = useState(60);

  const [secondsPerQuestion, setSecondsPerQuestion] = useState(30);

  const [desiredMocks, setDesiredMocks] = useState(1);

  const [includeAllQuestions, setIncludeAllQuestions] =
    useState(true);

  const [distributionMode, setDistributionMode] =
    useState("balanced");

  const [manualDistribution, setManualDistribution] =
    useState("");

  const [distributionPreview, setDistributionPreview] =
    useState([]);

  const [loading, setLoading] = useState(false);

  const [progress, setProgress] = useState(0);

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const [generatedMocks, setGeneratedMocks] =
    useState([]);

  /* =========================================
     TOAST
  ========================================= */

  function showToast(message, type = "success") {

    setToast({
      show: true,
      message,
      type,
    });

    setTimeout(() => {

      setToast({
        show: false,
        message: "",
        type: "success",
      });

    }, 3000);

  }

  /* =========================================
     LOAD SUBJECTS
  ========================================= */

  useEffect(() => {

    const unsubscribe =
      listenSubjects(setSubjects);

    return () => unsubscribe();

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
      collection(db, "subtopics"),
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
     LOAD QUESTIONS
  ========================================= */

  useEffect(() => {

    async function loadQuestions() {

      const snapshot = await getDocs(
        collection(db, "questions")
      );

      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setQuestions(data);

    }

    loadQuestions();

  }, []);

  /* =========================================
     FILTERED TOPICS
  ========================================= */

  const filteredTopics = topics.filter(
    (item) =>
      String(item.subjectId) ===
      String(subjectId)
  );

  /* =========================================
     FILTERED SUBTOPICS
  ========================================= */

  const filteredSubTopics = subTopics.filter(
    (item) =>
      String(item.subjectId) ===
        String(subjectId) &&
      String(item.topicId) ===
        String(topic)
  );

  /* =========================================
     FILTERED QUESTIONS
  ========================================= */

  const filteredQuestions = useMemo(() => {

    return questions.filter((q) => {

      const subjectMatch =
        subjectId
          ? String(q.subjectId) ===
            String(subjectId)
          : true;

      const topicMatch =
        topic
          ? String(q.topicId) ===
            String(topic)
          : true;

      const subTopicMatch =
        subTopic
          ? String(q.subTopicId) ===
            String(subTopic)
          : true;

      return (
        subjectMatch &&
        topicMatch &&
        subTopicMatch
      );

    });

  }, [
    questions,
    subjectId,
    topic,
    subTopic,
  ]);

  /* =========================================
     TOTALS
  ========================================= */

  const totalQuestions =
    filteredQuestions.length;

  const maximumMocks =
    Math.floor(totalQuestions / quantity);

  const remainder =
    totalQuestions % quantity;

  const suggestedMinutes =
    Math.ceil(
      (
        totalQuestions *
        secondsPerQuestion
      ) / 60
    );

  /* =========================================
     AUTO DURATION
  ========================================= */

  useEffect(() => {

    if (suggestedMinutes > 0) {

      setDuration(suggestedMinutes);

    }

  }, [suggestedMinutes]);

  /* =========================================
     DISTRIBUTION
  ========================================= */

  useEffect(() => {

    if (!includeAllQuestions) {

      setDistributionPreview([]);

      return;

    }

    if (distributionMode === "balanced") {

      const totalCount =
        Math.ceil(
          totalQuestions / quantity
        );

      const base =
        Math.floor(
          totalQuestions / totalCount
        );

      const extra =
        totalQuestions % totalCount;

      const arr = [];

      for (
        let i = 0;
        i < totalCount;
        i++
      ) {

        arr.push(
          base + (i < extra ? 1 : 0)
        );

      }

      setDistributionPreview(arr);

    }

    if (distributionMode === "extra") {

      const arr = [];

      const full =
        Math.floor(
          totalQuestions / quantity
        );

      for (
        let i = 0;
        i < full;
        i++
      ) {

        arr.push(quantity);

      }

      if (remainder > 0) {

        arr.push(remainder);

      }

      setDistributionPreview(arr);

    }

    if (distributionMode === "manual") {

      const arr =
        manualDistribution
          .split(",")
          .map((n) =>
            Number(n.trim())
          )
          .filter(Boolean);

      setDistributionPreview(arr);

    }

  }, [
    includeAllQuestions,
    distributionMode,
    manualDistribution,
    quantity,
    totalQuestions,
    remainder,
  ]);

  /* =========================================
     GENERATE MOCKS
  ========================================= */

  async function handleGenerate() {

    try {

      if (!mockName) {

        showToast(
          "Enter mock name",
          "error"
        );

        return;

      }

      if (!subjectId) {

        showToast(
          "Select subject",
          "error"
        );

        return;

      }

      if (quantity > totalQuestions) {

        showToast(
          `Only ${totalQuestions} questions available`,
          "error"
        );

        return;

      }

      setLoading(true);

      setProgress(0);

      const finalDistribution =
        includeAllQuestions
          ? distributionPreview
          : Array(desiredMocks)
              .fill(quantity);

      const createdMocks = [];

      for (
        let i = 0;
        i < finalDistribution.length;
        i++
      ) {

        setProgress(
          Math.floor(
            ((i + 1) /
              finalDistribution.length) *
              100
          )
        );

        const currentName =
          `${mockName} ${i + 1}`;

        const response =
          await generateMocks({

            mockName: currentName,

            mockType,

            subject:
              subjects.find(
                (s) =>
                  s.id === subjectId
              )?.name ||

              subjects.find(
                (s) =>
                  s.id === subjectId
              )?.title ||

              "",

            topic:
              filteredTopics.find(
                (item) =>
                  item.id === topic
              )?.name ||

              filteredTopics.find(
                (item) =>
                  item.id === topic
              )?.title ||

              "",

            subTopic:
              filteredSubTopics.find(
                (item) =>
                  item.id === subTopic
              )?.name ||

              filteredSubTopics.find(
                (item) =>
                  item.id === subTopic
              )?.title ||

              "",

            duration:
              Number(duration),

            distribution: [
              finalDistribution[i],
            ],

            questions:
              filteredQuestions,

          });

        createdMocks.push(
          ...response.generatedMocks
        );

      }

      setGeneratedMocks(
        createdMocks
      );

      showToast(
        `${createdMocks.length} mocks generated successfully`
      );

    } catch (error) {

      console.error(error);

      showToast(
        error.message ||
          "Failed to generate mocks",
        "error"
      );

    } finally {

      setLoading(false);

    }

  }

  return (

    <AdminLayout>

      <div className="page mock-generator-page">

        {/* TOAST */}

        {toast.show && (

          <div
            className={`toast-box ${toast.type}`}
          >

            {toast.message}

          </div>

        )}

        {/* HEADER */}

        <div className="page-header">

          <div>

            <h2>
              Mock Generator
            </h2>

            <p>
              Generate intelligent mock tests automatically
            </p>

          </div>

        </div>

        {/* STATS */}

        <div className="mock-top-stats">

          <div className="mock-stat-card">

            <div className="mock-stat-icon">
              📄
            </div>

            <div>

              <span>
                Total Questions
              </span>

              <h2>
                {totalQuestions}
              </h2>

            </div>

          </div>

          <div className="mock-stat-card">

            <div className="mock-stat-icon green">
              📋
            </div>

            <div>

              <span>
                Maximum Mocks
              </span>

              <h2>
                {maximumMocks}
              </h2>

            </div>

          </div>

        </div>

        {/* CONFIG */}

        <div className="mock-section">

          <div className="mock-section-title">
            ⚙️ Mock Configuration
          </div>

          <div className="mock-generator-grid">

            <div className="form-group">

              <label>
                Mock Name
              </label>

              <input
                type="text"
                placeholder="Enter Mock Name"
                value={mockName}
                onChange={(e) =>
                  setMockName(
                    e.target.value
                  )
                }
              />

            </div>

            <div className="form-group">

              <label>
                Mock Type
              </label>

              <select
                value={mockType}
                onChange={(e) =>
                  setMockType(
                    e.target.value
                  )
                }
              >

                <option value="full">
                  Full Mock
                </option>

                <option value="sectional">
                  Sectional Mock
                </option>

              </select>

            </div>

            <div className="form-group">

              <label>
                Subject
              </label>

              <select
                value={subjectId}
                onChange={(e) => {

                  setSubjectId(
                    e.target.value
                  );

                  setTopic("");
                  setSubTopic("");

                }}
              >

                <option value="">
                  Select Subject
                </option>

                {subjects.map((item) => (

                  <option
                    key={item.id}
                    value={item.id}
                  >

                    {item.name ||
                      item.title}

                  </option>

                ))}

              </select>

            </div>

          </div>

        </div>

        {/* DISTRIBUTION */}

        <div className="mock-section">

          <div className="mock-section-title">
            🎯 Distribution & Strategy
          </div>

          <label className="checkbox-label">

            <input
              type="checkbox"
              checked={
                includeAllQuestions
              }
              onChange={(e) =>
                setIncludeAllQuestions(
                  e.target.checked
                )
              }
            />

            Include All Available Questions

          </label>

          <div className="distribution-options">

            <button
              className={
                distributionMode ===
                "balanced"
                  ? "distribution-btn active"
                  : "distribution-btn"
              }
              onClick={() =>
                setDistributionMode(
                  "balanced"
                )
              }
            >

              Balanced Distribution

            </button>

            <button
              className={
                distributionMode ===
                "extra"
                  ? "distribution-btn active"
                  : "distribution-btn"
              }
              onClick={() =>
                setDistributionMode(
                  "extra"
                )
              }
            >

              Create Extra Mock

            </button>

            <button
              className={
                distributionMode ===
                "manual"
                  ? "distribution-btn active"
                  : "distribution-btn"
              }
              onClick={() =>
                setDistributionMode(
                  "manual"
                )
              }
            >

              Manual Distribution

            </button>

          </div>

        </div>

        {/* PROGRESS */}

        {loading && (

          <div className="progress-wrapper">

            <div className="progress-bar">

              <div
                className="progress-fill"
                style={{
                  width: `${progress}%`,
                }}
              />

            </div>

            <p>
              {progress}% Completed
            </p>

          </div>

        )}

        {/* BUTTON */}

        <button
          className="generate-btn"
          disabled={loading}
          onClick={handleGenerate}
        >

          {loading
            ? "Generating..."
            : "🚀 Generate Mocks"}

        </button>

        {/* VIEW BUTTON */}

        {generatedMocks.length > 0 && (

          <button
            className="view-mock-btn"
            onClick={() =>
              navigate("/admin/exams")
            }
          >

            View Generated Mocks

          </button>

        )}

      </div>

    </AdminLayout>

  );

}
