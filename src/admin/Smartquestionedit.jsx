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

/* =========================================================
   QUESTION EDITOR
========================================================= */

function QuestionEditor({ value, onChange }) {
  const editorRef = useRef(null);

  const fileRef = useRef(null);

  const [mode, setMode] = useState("visual");

  const [htmlValue, setHtmlValue] = useState(value || "");

  useEffect(() => {
    if (mode === "visual" && editorRef.current) {
      editorRef.current.innerHTML = value || "";
    }

    setHtmlValue(value || "");
  }, [value, mode]);

  function exec(cmd) {
    if (cmd === "image-upload") {
      fileRef.current.click();
      return;
    }

    if (cmd === "image-url") {
      const url = window.prompt("Enter Image URL");

      if (url) {
        document.execCommand(
          "insertHTML",
          false,
          `<img src="${url}" style="max-width:100%;border-radius:12px;margin:10px 0;" />`
        );

        onChange(editorRef.current.innerHTML);
      }

      return;
    }

    document.execCommand(cmd, false, null);

    onChange(editorRef.current.innerHTML);
  }

  function handleFile(e) {
    const file = e.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      document.execCommand(
        "insertHTML",
        false,
        `<img src="${reader.result}" style="max-width:100%;border-radius:12px;margin:10px 0;" />`
      );

      onChange(editorRef.current.innerHTML);
    };

    reader.readAsDataURL(file);
  }

  return (
    <div className="se-editor-shell">

      {/* TOP */}

      <div className="se-editor-top">

        {/* MODE */}

        <div className="se-editor-tabs">

          <button
            type="button"
            className={`se-editor-mode-btn ${
              mode === "visual" ? "active" : ""
            }`}
            onClick={() => setMode("visual")}
          >
            Visual
          </button>

          <button
            type="button"
            className={`se-editor-mode-btn ${
              mode === "html" ? "active" : ""
            }`}
            onClick={() => setMode("html")}
          >
            HTML
          </button>

        </div>

        {/* TOOLBAR */}

        <div className="se-editor-toolbar">

          <button
            type="button"
            className="se-toolbar-btn"
            onMouseDown={(e) => {
              e.preventDefault();
              exec("bold");
            }}
          >
            B
          </button>

          <button
            type="button"
            className="se-toolbar-btn"
            onMouseDown={(e) => {
              e.preventDefault();
              exec("italic");
            }}
          >
            I
          </button>

          <button
            type="button"
            className="se-toolbar-btn"
            onMouseDown={(e) => {
              e.preventDefault();
              exec("underline");
            }}
          >
            U
          </button>

          <button
            type="button"
            className="se-toolbar-btn"
            onMouseDown={(e) => {
              e.preventDefault();
              exec("insertUnorderedList");
            }}
          >
            ≡
          </button>

          <button
            type="button"
            className="se-toolbar-btn"
            onMouseDown={(e) => {
              e.preventDefault();
              exec("insertOrderedList");
            }}
          >
            1.
          </button>

          <button
            type="button"
            className="se-toolbar-btn"
            onMouseDown={(e) => {
              e.preventDefault();
              exec("image-url");
            }}
          >
            URL
          </button>

          <button
            type="button"
            className="se-toolbar-btn"
            onMouseDown={(e) => {
              e.preventDefault();
              exec("image-upload");
            }}
          >
            Upload
          </button>

        </div>

      </div>

      {/* IMAGE */}

      <input
        type="file"
        accept="image/*"
        hidden
        ref={fileRef}
        onChange={handleFile}
      />

      {/* VISUAL / HTML */}

      {mode === "html" ? (
        <textarea
          className="se-html-editor"
          value={htmlValue}
          onChange={(e) => {
            setHtmlValue(e.target.value);
            onChange(e.target.value);
          }}
          placeholder="Write HTML here..."
        />
      ) : (
        <div className="se-question-scroll">

          <div
            ref={editorRef}
            className="se-editable"
            contentEditable
            suppressContentEditableWarning
            data-placeholder="Type question here..."
            onInput={() => {
              onChange(editorRef.current.innerHTML);
            }}
          />

        </div>
      )}
    </div>
  );
}

/* =========================================================
   MAIN PAGE
========================================================= */

export default function SmartEditPage() {
  const [questions, setQuestions] = useState([]);

  const [subjects, setSubjects] = useState([]);

  const [topics, setTopics] = useState([]);

  const [subTopics, setSubTopics] = useState([]);

  const [filteredQuestions, setFilteredQuestions] = useState([]);

  const [currentIndex, setCurrentIndex] = useState(0);

  const [questionHtml, setQuestionHtml] = useState("");

  const [optionA, setOptionA] = useState("");

  const [optionB, setOptionB] = useState("");

  const [optionC, setOptionC] = useState("");

  const [optionD, setOptionD] = useState("");

  const [correctAnswer, setCorrectAnswer] = useState("A");

  const [difficulty, setDifficulty] = useState("easy");

  const [explanation, setExplanation] = useState("");

  const [selectedSubject, setSelectedSubject] = useState("");

  const [selectedTopic, setSelectedTopic] = useState("");

  const [selectedSubTopic, setSelectedSubTopic] = useState("");

  const [updatedIds, setUpdatedIds] = useState(new Set());

  const [errors, setErrors] = useState({});

  const [isNew, setIsNew] = useState(false);

  /* =========================================================
     FIREBASE
  ========================================================= */

  useEffect(() => {
    return onSnapshot(collection(db, "subjects"), (snap) => {
      setSubjects(
        snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }))
      );
    });
  }, []);

  useEffect(() => {
    return onSnapshot(collection(db, "topics"), (snap) => {
      setTopics(
        snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }))
      );
    });
  }, []);

  useEffect(() => {
    return onSnapshot(collection(db, "subtopics"), (snap) => {
      setSubTopics(
        snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }))
      );
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

  /* =========================================================
     FILTER
  ========================================================= */

  useEffect(() => {
    const filtered = questions.filter(
      (q) =>
        (!selectedSubject ||
          q.subjectId === selectedSubject) &&
        (!selectedTopic ||
          q.topicId === selectedTopic) &&
        (!selectedSubTopic ||
          q.subTopicId === selectedSubTopic)
    );

    setFilteredQuestions(filtered);

    setCurrentIndex(0);
  }, [
    questions,
    selectedSubject,
    selectedTopic,
    selectedSubTopic,
  ]);

  /* =========================================================
     LOAD QUESTION
  ========================================================= */

  useEffect(() => {
    if (filteredQuestions.length === 0 || isNew)
      return;

    const q = filteredQuestions[currentIndex];

    if (!q) return;

    setQuestionHtml(q.question || "");

    setOptionA(q.options?.[0] || "");

    setOptionB(q.options?.[1] || "");

    setOptionC(q.options?.[2] || "");

    setOptionD(q.options?.[3] || "");

    setCorrectAnswer(q.correctAnswer || "A");

    setDifficulty(q.difficulty || "easy");

    setExplanation(q.explanation || "");
  }, [filteredQuestions, currentIndex, isNew]);

  /* =========================================================
     VALIDATION
  ========================================================= */

  function validate() {
    const err = {};

    if (!questionHtml.trim()) {
      err.question = "⚠ Question required";
    }

    if (!optionA.trim()) {
      err.a = "⚠ Option A required";
    }

    if (!optionB.trim()) {
      err.b = "⚠ Option B required";
    }

    if (!optionC.trim()) {
      err.c = "⚠ Option C required";
    }

    if (!optionD.trim()) {
      err.d = "⚠ Option D required";
    }

    if (!explanation.trim()) {
      err.explanation = "⚠ Explanation required";
    }

    setErrors(err);

    return Object.keys(err).length === 0;
  }

  /* =========================================================
     NAVIGATION
  ========================================================= */

  function goTo(index) {
    if (
      index < 0 ||
      index >= filteredQuestions.length
    )
      return;

    setIsNew(false);

    setCurrentIndex(index);
  }

  function clearEditor() {
    setQuestionHtml("");

    setOptionA("");
    setOptionB("");
    setOptionC("");
    setOptionD("");

    setCorrectAnswer("A");

    setDifficulty("easy");

    setExplanation("");

    setErrors({});
  }

  function openNew() {
    setIsNew(true);

    clearEditor();
  }

  /* =========================================================
     UPDATE
  ========================================================= */

  async function handleUpdate() {
    if (!validate()) return;

    const q = filteredQuestions[currentIndex];

    if (!q) return;

    await updateDoc(doc(db, "questions", q.id), {
      question: questionHtml,

      options: [
        optionA,
        optionB,
        optionC,
        optionD,
      ],

      correctAnswer,

      difficulty,

      explanation,
    });

    setUpdatedIds((prev) => {
      const next = new Set(prev);
      next.add(q.id);
      return next;
    });

    toast.success("Hoila 🎉 Question updated");
  }

  /* =========================================================
     ADD
  ========================================================= */

  async function handleAddNew() {
    if (!validate()) return;

    if (
      !selectedSubject ||
      !selectedTopic ||
      !selectedSubTopic
    ) {
      toast.error("Select subject hierarchy");
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

    const ref = await addDoc(
      collection(db, "questions"),
      {
        subjectId: selectedSubject,

        topicId: selectedTopic,

        subTopicId: selectedSubTopic,

        question: questionHtml,

        options: [
          optionA,
          optionB,
          optionC,
          optionD,
        ],

        correctAnswer,

        difficulty,

        explanation,

        createdAt: Date.now(),
      }
    );

    setUpdatedIds((prev) => {
      const next = new Set(prev);
      next.add(ref.id);
      return next;
    });

    toast.success(
      "Hoila 🎉 Your question added successfully"
    );

    clearEditor();
  }

  /* =========================================================
     STATUS
  ========================================================= */

  function getQuestionStatus(q) {
    if (updatedIds.has(q.id)) return "correct";

    return "unanswered";
  }

  /* =========================================================
     FILTERS
  ========================================================= */

  const filteredTopics = topics.filter(
    (t) =>
      !selectedSubject ||
      t.subjectId === selectedSubject
  );

  const filteredSubTopics = subTopics.filter(
    (s) =>
      (!selectedSubject ||
        s.subjectId === selectedSubject) &&
      (!selectedTopic ||
        s.topicId === selectedTopic)
  );

  /* =========================================================
     UI
  ========================================================= */

  return (
    <AdminLayout>

      <div className="page">

        {/* TOPBAR */}

        <div className="review-topbar">

          <div>
            <h2>Smart Edit Interface</h2>

            <p>
              Enterprise Question Editing System
            </p>
          </div>

          <div className="review-actions">

            <button
              className="review-nav-btn"
              disabled={
                currentIndex === 0 || isNew
              }
              onClick={() =>
                goTo(currentIndex - 1)
              }
            >
              ← Previous
            </button>

            <button
              className="review-nav-btn"
              disabled={
                currentIndex >=
                  filteredQuestions.length - 1 ||
                isNew
              }
              onClick={() =>
                goTo(currentIndex + 1)
              }
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
              onClick={
                isNew
                  ? handleAddNew
                  : handleUpdate
              }
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
                : `${currentIndex + 1} / ${
                    filteredQuestions.length
                  }`}
            </h3>
          </div>

          <div className="analytics-mini-card">
            <span>Difficulty</span>

            <h3
              className={`level-${difficulty}`}
            >
              {difficulty}
            </h3>
          </div>

          <div className="analytics-mini-card">
            <span>Status</span>

            <h3 className="status-correct">
              {isNew
                ? "Creating"
                : "Editing"}
            </h3>
          </div>

          <div className="analytics-mini-card">
            <span>Correct</span>

            <h3>{correctAnswer}</h3>
          </div>

          <div className="analytics-mini-card">
            <span>Total</span>

            <h3>
              {filteredQuestions.length}
            </h3>
          </div>

        </div>

        {/* FILTER */}

        <div className="se-filter-bar">

          <select
            className="se-select"
            value={selectedSubject}
            onChange={(e) => {
              setSelectedSubject(
                e.target.value
              );

              setSelectedTopic("");

              setSelectedSubTopic("");
            }}
          >
            <option value="">
              All Subjects
            </option>

            {subjects.map((s) => (
              <option
                key={s.id}
                value={s.id}
              >
                {s.name}
              </option>
            ))}
          </select>

          <select
            className="se-select"
            value={selectedTopic}
            onChange={(e) => {
              setSelectedTopic(
                e.target.value
              );

              setSelectedSubTopic("");
            }}
          >
            <option value="">
              All Topics
            </option>

            {filteredTopics.map((t) => (
              <option
                key={t.id}
                value={t.id}
              >
                {t.name}
              </option>
            ))}
          </select>

          <select
            className="se-select"
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

            {filteredSubTopics.map((s) => (
              <option
                key={s.id}
                value={s.id}
              >
                {s.name}
              </option>
            ))}
          </select>

        </div>

        {/* MAIN */}

        <div className="review-layout">

          {/* LEFT */}

          <div className="review-main">

            <div className="se-review-question-card">

              {/* QUESTION */}

              <div className="se-question-editor-wrap">

                <QuestionEditor
                  key={
                    isNew
                      ? "new"
                      : currentIndex
                  }
                  value={questionHtml}
                  onChange={setQuestionHtml}
                />

                {errors.question && (
                  <div className="se-validation-error">
                    {errors.question}
                  </div>
                )}

              </div>

              {/* DIFFICULTY */}

              <div className="se-difficulty-row">

                {[
                  "easy",
                  "medium",
                  "hard",
                ].map((d) => (
                  <button
                    key={d}
                    className={`se-diff-chip ${
                      difficulty === d
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      setDifficulty(d)
                    }
                  >
                    {d}
                  </button>
                ))}

              </div>

              {/* OPTIONS */}

              <div className="se-option-list">

                {[
                  {
                    label: "A",
                    value: optionA,
                    set: setOptionA,
                    error: errors.a,
                  },

                  {
                    label: "B",
                    value: optionB,
                    set: setOptionB,
                    error: errors.b,
                  },

                  {
                    label: "C",
                    value: optionC,
                    set: setOptionC,
                    error: errors.c,
                  },

                  {
                    label: "D",
                    value: optionD,
                    set: setOptionD,
                    error: errors.d,
                  },
                ].map(
                  ({
                    label,
                    value,
                    set,
                    error,
                  }) => {
                    const isCorrect =
                      correctAnswer ===
                      label;

                    return (
                      <div key={label}>

                        <div
                          className={`se-option-card ${
                            isCorrect
                              ? "se-option-correct"
                              : ""
                          }`}
                        >

                          <input
                            type="radio"
                            checked={
                              isCorrect
                            }
                            onChange={() =>
                              setCorrectAnswer(
                                label
                              )
                            }
                          />

                          <div className="review-option-label">
                            {label}.
                          </div>

                          <input
                            value={value}
                            onChange={(e) =>
                              set(
                                e.target.value
                              )
                            }
                            placeholder={`Option ${label}`}
                            className="se-opt-input"
                          />

                        </div>

                        {error && (
                          <div className="se-validation-error">
                            {error}
                          </div>
                        )}

                      </div>
                    );
                  }
                )}

              </div>

              {/* EXPLANATION */}

              <div className="se-explanation-box">

                <h4>Explanation</h4>

                <textarea
                  className="se-explanation"
                  value={explanation}
                  onChange={(e) =>
                    setExplanation(
                      e.target.value
                    )
                  }
                  placeholder="Write explanation..."
                />

                {errors.explanation && (
                  <div className="se-validation-error">
                    {errors.explanation}
                  </div>
                )}

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

              {filteredQuestions.map(
                (q, index) => {
                  const status =
                    getQuestionStatus(q);

                  return (
                    <button
                      key={q.id}
                      onClick={() =>
                        goTo(index)
                      }
                      className={`review-palette-btn ${
                        status ===
                        "correct"
                          ? "review-palette-correct"
                          : "review-palette-unanswered"
                      } ${
                        currentIndex ===
                          index &&
                        !isNew
                          ? "review-current"
                          : ""
                      }`}
                    >
                      {index + 1}
                    </button>
                  );
                }
              )}

            </div>

          </div>

        </div>

      </div>

    </AdminLayout>
  );
}
