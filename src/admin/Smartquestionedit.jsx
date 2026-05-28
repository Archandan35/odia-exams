import { useEffect, useRef, useState } from "react";

import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import toast from "react-hot-toast";

import { db } from "../firebase/config";

import AdminLayout from "./AdminLayout";

/* ─────────────────────────────────────────
   RICH TOOLBAR
───────────────────────────────────────── */

function RichToolbar({ onCommand }) {
  const tools = [
    { label: "B", cmd: "bold" },
    { label: "I", cmd: "italic" },
    { label: "U", cmd: "underline" },
    { label: "H₁", cmd: "h1" },
    { label: "H₂", cmd: "h2" },
    { label: "x²", cmd: "superscript" },
    { label: "x₂", cmd: "subscript" },
    { label: "≡", cmd: "insertUnorderedList" },
    { label: "1.", cmd: "insertOrderedList" },
  ];

  return (
    <div className="se-rich-toolbar">
      {tools.map((t) => (
        <button
          key={t.cmd}
          className="se-toolbar-btn"
          onMouseDown={(e) => {
            e.preventDefault();
            onCommand(t.cmd);
          }}
        >
          {t.label}
        </button>
      ))}

      <button
        className="se-toolbar-btn"
        onMouseDown={(e) => {
          e.preventDefault();
          onCommand("insertImage");
        }}
      >
        🖼
      </button>

      <button
        className="se-toolbar-btn"
        onMouseDown={(e) => {
          e.preventDefault();
          onCommand("toggleHTML");
        }}
      >
        {"</>"}
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────
   QUESTION EDITOR
───────────────────────────────────────── */

function QuestionEditor({ value, onChange }) {
  const editorRef = useRef(null);

  const [htmlMode, setHtmlMode] = useState(false);

  const [rawHtml, setRawHtml] = useState(value || "");

  useEffect(() => {
    if (!htmlMode && editorRef.current) {
      editorRef.current.innerHTML = value || "";
    }

    setRawHtml(value || "");
  }, [value]);

  function execCmd(cmd) {
    if (cmd === "toggleHTML") {
      if (!htmlMode) {
        setRawHtml(editorRef.current?.innerHTML || "");
      } else {
        editorRef.current.innerHTML = rawHtml;
        onChange(rawHtml);
      }

      setHtmlMode((p) => !p);
      return;
    }

    if (cmd === "insertImage") {
      const url = window.prompt("Image URL");

      if (url) {
        document.execCommand(
          "insertHTML",
          false,
          `<img src="${url}" style="max-width:100%;border-radius:12px;margin:10px 0;" />`
        );
      }

      return;
    }

    if (cmd === "h1" || cmd === "h2") {
      document.execCommand("formatBlock", false, cmd);
      return;
    }

    document.execCommand(cmd, false, null);
  }

  return (
    <div className="se-question-editor">
      <RichToolbar onCommand={execCmd} />

      {htmlMode ? (
        <textarea
          className="se-html-source"
          value={rawHtml}
          onChange={(e) => {
            setRawHtml(e.target.value);
            onChange(e.target.value);
          }}
        />
      ) : (
        <div
          ref={editorRef}
          className="se-editable"
          contentEditable
          suppressContentEditableWarning
          onInput={() => {
            onChange(editorRef.current?.innerHTML || "");
          }}
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────── */

export default function SmartEditPage() {
  const [questions, setQuestions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [subTopics, setSubTopics] = useState([]);

  const [currentIndex, setCurrentIndex] = useState(0);

  const [questionHtml, setQuestionHtml] = useState("");

  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [optionC, setOptionC] = useState("");
  const [optionD, setOptionD] = useState("");

  const [correctAnswer, setCorrectAnswer] = useState("A");

  const [difficulty, setDifficulty] = useState("easy");

  const [explanation, setExplanation] = useState("");

  const [isNew, setIsNew] = useState(false);

  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [selectedSubTopic, setSelectedSubTopic] = useState("");

  const [updatedIds, setUpdatedIds] = useState(new Set());

  const optionLabels = ["A", "B", "C", "D"];

  /* FIRESTORE */

  useEffect(() => {
    return onSnapshot(collection(db, "subjects"), (snap) => {
      setSubjects(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);

  useEffect(() => {
    return onSnapshot(collection(db, "topics"), (snap) => {
      setTopics(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);

  useEffect(() => {
    return onSnapshot(collection(db, "subtopics"), (snap) => {
      setSubTopics(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);

  useEffect(() => {
    return onSnapshot(collection(db, "questions"), (snap) => {
      setQuestions(
        snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }))
      );
    });
  }, []);

  /* LOAD QUESTION */

  useEffect(() => {
    if (questions.length === 0 || isNew) return;

    const q = questions[currentIndex];

    if (!q) return;

    setQuestionHtml(q.question || "");

    setOptionA(q.options?.[0] || "");
    setOptionB(q.options?.[1] || "");
    setOptionC(q.options?.[2] || "");
    setOptionD(q.options?.[3] || "");

    setCorrectAnswer(q.correctAnswer || "A");

    setDifficulty(q.difficulty || "easy");

    setExplanation(q.explanation || "");
  }, [questions, currentIndex, isNew]);

  /* NAVIGATION */

  function goTo(index) {
    if (index < 0 || index >= questions.length) return;

    setIsNew(false);

    setCurrentIndex(index);
  }

  function openNew() {
    setIsNew(true);

    setQuestionHtml("");

    setOptionA("");
    setOptionB("");
    setOptionC("");
    setOptionD("");

    setCorrectAnswer("A");

    setDifficulty("easy");

    setExplanation("");

    setSelectedSubject("");
    setSelectedTopic("");
    setSelectedSubTopic("");
  }

  /* UPDATE */

  async function handleUpdate() {
    const q = questions[currentIndex];

    if (!q) return;

    if (!questionHtml.trim()) {
      toast.error("Question required");
      return;
    }

    await updateDoc(doc(db, "questions", q.id), {
      question: questionHtml,
      options: [optionA, optionB, optionC, optionD],
      correctAnswer,
      difficulty,
      explanation,
    });

    setUpdatedIds((prev) => new Set(prev).add(q.id));

    toast.success("Question updated");
  }

  /* ADD NEW */

  async function handleAddNew() {
    if (!questionHtml.trim()) {
      toast.error("Question required");
      return;
    }

    if (!selectedSubject || !selectedTopic || !selectedSubTopic) {
      toast.error("Select hierarchy");
      return;
    }

    const dupQ = query(
      collection(db, "questions"),
      where("question", "==", questionHtml.trim()),
      where("subTopicId", "==", selectedSubTopic)
    );

    const dup = await getDocs(dupQ);

    if (!dup.empty) {
      toast.error("Question already exists");
      return;
    }

    const ref = await addDoc(collection(db, "questions"), {
      subjectId: selectedSubject,
      topicId: selectedTopic,
      subTopicId: selectedSubTopic,

      question: questionHtml,

      options: [optionA, optionB, optionC, optionD],

      correctAnswer,

      difficulty,

      explanation,

      createdAt: Date.now(),
    });

    setUpdatedIds((prev) => new Set(prev).add(ref.id));

    toast.success("Question Added");

    setIsNew(false);
  }

  const currentQ = questions[currentIndex];

  const filteredTopics = topics.filter(
    (t) => t.subjectId === selectedSubject
  );

  const filteredSubTopics = subTopics.filter(
    (s) =>
      s.subjectId === selectedSubject &&
      s.topicId === selectedTopic
  );

  function getQuestionStatus(q) {
    if (updatedIds.has(q.id)) return "correct";
    return "unanswered";
  }

  return (
    <AdminLayout>
      <div className="page">

        {/* TOPBAR */}

        <div className="review-topbar">

          <div>
            <h2>Smart Edit Interface</h2>
            <p>Enterprise Question Editing System</p>
          </div>

          <div className="review-actions">

            <button
              className="review-nav-btn"
              disabled={currentIndex === 0 || isNew}
              onClick={() => goTo(currentIndex - 1)}
            >
              ← Previous
            </button>

            <button
              className="review-nav-btn"
              disabled={
                currentIndex >= questions.length - 1 || isNew
              }
              onClick={() => goTo(currentIndex + 1)}
            >
              Next →
            </button>

            <button
              className="submit-btn"
              onClick={openNew}
            >
              + Add New
            </button>

            <button
              className="submit-btn"
              onClick={isNew ? handleAddNew : handleUpdate}
            >
              {isNew ? "✓ Save" : "✓ Update"}
            </button>

          </div>

        </div>

        {/* ANALYTICS */}

        <div className="se-review-analytics-strip">

          <div className="analytics-mini-card">
            <span>Question</span>
            <h3>
              {isNew
                ? "New"
                : `${currentIndex + 1} / ${questions.length}`}
            </h3>
          </div>

          <div className="analytics-mini-card">
            <span>Difficulty</span>
            <h3 className={`level-${difficulty}`}>
              {difficulty}
            </h3>
          </div>

          <div className="analytics-mini-card">
            <span>Status</span>
            <h3 className="status-correct">
              {isNew ? "Creating" : "Editing"}
            </h3>
          </div>

          <div className="analytics-mini-card">
            <span>Correct Answer</span>
            <h3>{correctAnswer}</h3>
          </div>

        </div>

        {/* MAIN LAYOUT */}

        <div className="review-layout">

          {/* LEFT */}

          <div className="review-main">

            <div className="review-question-card">

              {/* NEW HIERARCHY */}

              {isNew && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit,minmax(220px,1fr))",
                    gap: "14px",
                    marginBottom: "24px",
                  }}
                >

                  <select
                    className="se-select"
                    value={selectedSubject}
                    onChange={(e) => {
                      setSelectedSubject(e.target.value);
                      setSelectedTopic("");
                      setSelectedSubTopic("");
                    }}
                  >
                    <option value="">Select Subject</option>

                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>

                  <select
                    className="se-select"
                    value={selectedTopic}
                    onChange={(e) => {
                      setSelectedTopic(e.target.value);
                      setSelectedSubTopic("");
                    }}
                  >
                    <option value="">Select Topic</option>

                    {filteredTopics.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>

                  <select
                    className="se-select"
                    value={selectedSubTopic}
                    onChange={(e) =>
                      setSelectedSubTopic(e.target.value)
                    }
                  >
                    <option value="">
                      Select Sub Topic
                    </option>

                    {filteredSubTopics.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>

                </div>
              )}

              {/* QUESTION */}

              <div className="review-question-header">

                <div className="review-question-badge">
                  Q.{isNew ? "New" : currentIndex + 1}
                </div>

                <div className="review-question-text">

                  <QuestionEditor
                    key={isNew ? "new" : currentIndex}
                    value={questionHtml}
                    onChange={setQuestionHtml}
                  />

                </div>

              </div>

              {/* DIFFICULTY */}

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  marginBottom: "24px",
                  flexWrap: "wrap",
                }}
              >

                {["easy", "medium", "hard"].map((d) => (
                  <button
                    key={d}
                    className={`se-diff-chip se-diff-chip--${d} ${
                      difficulty === d ? "active" : ""
                    }`}
                    onClick={() => setDifficulty(d)}
                  >
                    {d}
                  </button>
                ))}

              </div>

              {/* OPTIONS */}

              <div className="review-options">

                {[
                  { label: "A", value: optionA, set: setOptionA },
                  { label: "B", value: optionB, set: setOptionB },
                  { label: "C", value: optionC, set: setOptionC },
                  { label: "D", value: optionD, set: setOptionD },
                ].map(({ label, value, set }) => {

                  const isCorrect =
                    correctAnswer === label;

                  return (
                    <div
                      key={label}
                      className={`review-option-card ${
                        isCorrect
                          ? "review-correct review-selected"
                          : ""
                      }`}
                    >

                      <input
                        type="radio"
                        checked={isCorrect}
                        onChange={() =>
                          setCorrectAnswer(label)
                        }
                        style={{
                          width: "22px",
                          height: "22px",
                          marginTop: "6px",
                        }}
                      />

                      <div className="review-option-label">
                        {label}.
                      </div>

                      <input
                        value={value}
                        onChange={(e) =>
                          set(e.target.value)
                        }
                        placeholder={`Option ${label}`}
                        className="se-opt-input"
                      />

                    </div>
                  );

                })}

              </div>

              {/* EXPLANATION */}

              <div className="review-explanation">

                <h4>Explanation</h4>

                <textarea
                  className="se-explanation"
                  value={explanation}
                  onChange={(e) =>
                    setExplanation(e.target.value)
                  }
                  placeholder="Write explanation..."
                />

              </div>

            </div>

          </div>

          {/* SIDEBAR */}

          <div className="review-sidebar">

            <h3>Questions</h3>

            <div className="review-legend">

              <div className="review-legend-item">
                <div className="review-dot review-palette-correct"></div>
                Updated
              </div>

              <div className="review-legend-item">
                <div className="review-dot review-palette-unanswered"></div>
                Pending
              </div>

            </div>

            <div className="review-palette">

              {questions.map((q, index) => {

                const status = getQuestionStatus(q);

                return (
                  <button
                    key={q.id}
                    onClick={() => goTo(index)}
                    className={`review-palette-btn ${
                      status === "correct"
                        ? "review-palette-correct"
                        : "review-palette-unanswered"
                    } ${
                      currentIndex === index
                        ? "review-current"
                        : ""
                    }`}
                  >
                    {index + 1}
                  </button>
                );
              })}

            </div>

          </div>

        </div>

      </div>
    </AdminLayout>
  );
}
