import { useEffect, useRef, useState } from "react";

import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  deleteDoc,
} from "firebase/firestore";

import toast from "react-hot-toast";

import { db } from "../firebase/config";

import AdminLayout from "./AdminLayout";

/* =========================================================
   QUESTION EDITOR
========================================================= */

function QuestionEditor({
  value,
  onChange,
  readOnly = false,
}) {
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  return (
    <div className="se-editor-shell">
      <div className="se-question-scroll">
        <div
          ref={editorRef}
          className={`se-editable ${readOnly ? "readonly" : ""}`}
          contentEditable={!readOnly}
          suppressContentEditableWarning
          data-placeholder="Type your question here..."
          style={{
            minHeight: "100px",
            height: "auto",
          }}
          onInput={() => {
            if (!editorRef.current) return;

            const html = editorRef.current.innerHTML;

            onChange(html);
          }}
        />
      </div>
    </div>
  );
}

/* =========================================================
   OPTION INPUT
========================================================= */

function OptionInput({
  value,
  onChange,
  disabled,
  letter,
}) {
  return (
    <div className="se-opt-render-box" style={{ width: "100%" }}>
      {disabled ? (
        <div
          className="se-opt-display se-scrollable-box"
          dangerouslySetInnerHTML={{
            __html:
              value ||
              `<span style="color:#64748b">Empty Option</span>`,
          }}
        />
      ) : (
        <input
          className="se-opt-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Option ${letter}`}
        />
      )}
    </div>
  );
}

/* =========================================================
   EXPLANATION FIELD
========================================================= */

function ExplanationField({
  value,
  onChange,
  disabled,
}) {
  return disabled ? (
    <div
      className="se-explanation-view se-scrollable-box"
      dangerouslySetInnerHTML={{
        __html:
          value ||
          "<span style='color:#64748b'>No explanation</span>",
      }}
    />
  ) : (
    <textarea
      className="se-explanation"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Write explanation..."
    />
  );
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function SmartEditPage() {
  const [questions, setQuestions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [subTopics, setSubTopics] = useState([]);

  const [filteredQuestions, setFilteredQuestions] =
    useState([]);

  const [currentIndex, setCurrentIndex] = useState(0);

  const [questionHtml, setQuestionHtml] = useState("");

  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [optionC, setOptionC] = useState("");
  const [optionD, setOptionD] = useState("");

  const [correctAnswer, setCorrectAnswer] =
    useState("A");

  const [difficulty, setDifficulty] =
    useState("easy");

  const [explanation, setExplanation] =
    useState("");

  const [selectedSubject, setSelectedSubject] =
    useState("");

  const [selectedTopic, setSelectedTopic] =
    useState("");

  const [selectedSubTopic, setSelectedSubTopic] =
    useState("");

  const [isNew, setIsNew] = useState(false);

  const [isEditingQuestion, setIsEditingQuestion] =
    useState(false);

  const [showHtmlModal, setShowHtmlModal] =
    useState(false);

  const [htmlCode, setHtmlCode] = useState("");

  const isEditable =
    isEditingQuestion || isNew;

  /* =========================================================
     FIREBASE
  ========================================================= */

  useEffect(() => {
    return onSnapshot(
      collection(db, "subjects"),
      (snap) => {
        setSubjects(
          snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }))
        );
      }
    );
  }, []);

  useEffect(() => {
    return onSnapshot(
      collection(db, "topics"),
      (snap) => {
        setTopics(
          snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }))
        );
      }
    );
  }, []);

  useEffect(() => {
    return onSnapshot(
      collection(db, "subtopics"),
      (snap) => {
        setSubTopics(
          snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }))
        );
      }
    );
  }, []);

  useEffect(() => {
    return onSnapshot(
      collection(db, "questions"),
      (snap) => {
        setQuestions(
          snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }))
        );
      }
    );
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
    if (
      filteredQuestions.length === 0 ||
      isNew
    )
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
     HTML TO VISUAL
  ========================================================= */

  function applyHtmlToVisual(html) {
    setHtmlCode(html);

    const parser = new DOMParser();

    const doc = parser.parseFromString(
      html,
      "text/html"
    );

    const h1 = doc.querySelector("h1");

    if (h1) {
      setQuestionHtml(h1.outerHTML);
    } else {
      setQuestionHtml(doc.body.innerHTML);
    }

    const paragraphs =
      doc.querySelectorAll("p");

    if (paragraphs[0]) {
      setOptionA(paragraphs[0].innerHTML);
    }

    if (paragraphs[1]) {
      setOptionB(paragraphs[1].innerHTML);
    }

    if (paragraphs[2]) {
      setOptionC(paragraphs[2].innerHTML);
    }

    if (paragraphs[3]) {
      setOptionD(paragraphs[3].innerHTML);
    }

    const explanationNode =
      doc.querySelector(".explanation");

    if (explanationNode) {
      setExplanation(
        explanationNode.innerHTML
      );
    }

    const difficultyNode =
      doc.querySelector("[data-difficulty]");

    if (difficultyNode) {
      setDifficulty(
        difficultyNode.getAttribute(
          "data-difficulty"
        )
      );
    }
  }

  /* =========================================================
     HELPERS
  ========================================================= */

  function clearEditor() {
    setQuestionHtml("");

    setOptionA("");
    setOptionB("");
    setOptionC("");
    setOptionD("");

    setCorrectAnswer("A");

    setDifficulty("easy");

    setExplanation("");
  }

  function openNew() {
    setIsNew(true);

    setIsEditingQuestion(true);

    clearEditor();
  }

  function cancelEditing() {
    setIsNew(false);

    setIsEditingQuestion(false);

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
  }

  function goTo(index) {
    if (
      index < 0 ||
      index >= filteredQuestions.length
    )
      return;

    setCurrentIndex(index);

    setIsNew(false);
  }

  /* =========================================================
     UPDATE
  ========================================================= */

  async function handleUpdate() {
    const q = filteredQuestions[currentIndex];

    if (!q) return;

    await updateDoc(
      doc(db, "questions", q.id),
      {
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
      }
    );

    toast.success("Question updated");

    setIsEditingQuestion(false);
  }

  /* =========================================================
     ADD
  ========================================================= */

  async function handleAddNew() {
    await addDoc(
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

    toast.success("Question added");

    setIsNew(false);

    setIsEditingQuestion(false);

    clearEditor();
  }

  /* =========================================================
     DELETE
  ========================================================= */

  async function handleDelete() {
    const q = filteredQuestions[currentIndex];

    if (!q) return;

    const confirmDelete =
      window.confirm(
        "Delete this question?"
      );

    if (!confirmDelete) return;

    await deleteDoc(
      doc(db, "questions", q.id)
    );

    toast.success("Question deleted");
  }

  const filteredTopics = topics.filter(
    (t) =>
      !selectedSubject ||
      t.subjectId === selectedSubject
  );

  const filteredSubTopics =
    subTopics.filter(
      (s) =>
        (!selectedSubject ||
          s.subjectId === selectedSubject) &&
        (!selectedTopic ||
          s.topicId === selectedTopic)
    );

  return (
    <AdminLayout>
      <div className="page">

        {/* HEADER */}

        <div className="review-topbar">

          <div>
            <h2>Smart Edit Interface</h2>

            <p>
              Enterprise Question Editing
              System
            </p>
          </div>

          <div className="review-actions">

            <button
              className="review-nav-btn se-action-btn"
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
              className="review-nav-btn se-action-btn"
              disabled={
                currentIndex >=
                  filteredQuestions.length -
                    1 || isNew
              }
              onClick={() =>
                goTo(currentIndex + 1)
              }
            >
              Next →
            </button>

            <button
              className="submit-btn se-action-btn"
              onClick={openNew}
            >
              + Add New
            </button>

            {!isNew && (
              <button
                className="delete-btn se-action-btn"
                onClick={handleDelete}
              >
                Delete
              </button>
            )}

            <button
              className="submit-btn se-action-btn"
              onClick={
                isNew
                  ? handleAddNew
                  : handleUpdate
              }
            >
              {isNew ? "Save" : "Update"}
            </button>

          </div>
        </div>

        {/* FILTERS */}

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

            {filteredSubTopics.map(
              (s) => (
                <option
                  key={s.id}
                  value={s.id}
                >
                  {s.name}
                </option>
              )
            )}
          </select>
        </div>

        {/* MAIN */}

        <div className="review-layout">

          <div className="review-main se-main-scroll-area">

            <div className="se-review-question-card">

              {/* TOP BAR */}

              <div className="se-edit-toolbar-wrapper">

                {/* VIEW EDIT */}

                <div className="se-segment-group">

                  <button
                    type="button"
                    className={`se-segment-btn ${
                      !isEditable
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      setIsEditingQuestion(
                        false
                      )
                    }
                  >
                    View
                  </button>

                  <button
                    type="button"
                    className={`se-segment-btn ${
                      isEditable
                        ? "active"
                        : ""
                    }`}
                    onClick={() => {
                      if (isEditable) {
                        cancelEditing();
                      } else {
                        setIsEditingQuestion(
                          true
                        );
                      }
                    }}
                  >
                    {isEditable
                      ? "Cancel"
                      : "Edit"}
                  </button>

                </div>

                {/* VISUAL HTML */}

                <div className="se-segment-group">

                  <button
                    type="button"
                    className="se-segment-btn active"
                    onClick={() =>
                      setShowHtmlModal(
                        false
                      )
                    }
                  >
                    Visual
                  </button>

                  <button
                    type="button"
                    className="se-segment-btn"
                    onClick={() => {

                      setHtmlCode(`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
</head>
<body>

${questionHtml || ""}

<p>${optionA}</p>
<p>${optionB}</p>
<p>${optionC}</p>
<p>${optionD}</p>

<div class="explanation">
${explanation}
</div>

<div data-difficulty="${difficulty}"></div>

</body>
</html>
`);

                      setShowHtmlModal(
                        true
                      );
                    }}
                  >
                    HTML
                  </button>

                </div>

                {/* TOOLBAR */}

                {isEditable && (
                  <div className="se-editor-toolbar se-toolbar-scroll">

                    {[
                      ["bold", "B"],
                      ["italic", "I"],
                      ["underline", "U"],
                      [
                        "insertUnorderedList",
                        "≡",
                      ],
                      [
                        "insertOrderedList",
                        "1.",
                      ],
                    ].map(
                      ([cmd, label]) => (
                        <button
                          key={cmd}
                          type="button"
                          className="se-toolbar-btn"
                          onMouseDown={(
                            e
                          ) => {
                            e.preventDefault();

                            document.execCommand(
                              cmd,
                              false,
                              null
                            );
                          }}
                        >
                          {label}
                        </button>
                      )
                    )}

                  </div>
                )}

              </div>

              {/* QUESTION */}

              <div
                className={
                  !isEditable
                    ? "se-view-question-box"
                    : "se-edit-question-box"
                }
              >

                {!isEditable && (
                  <div
                    className="se-readonly-badge"
                    title="Read Only Mode"
                  >
                    🔒
                  </div>
                )}

                <QuestionEditor
                  value={questionHtml}
                  onChange={
                    setQuestionHtml
                  }
                  readOnly={!isEditable}
                />

              </div>

              {/* DIFFICULTY */}

              <div className="se-difficulty-row">

                {[
                  "easy",
                  "medium",
                  "hard",
                ].map((level) => (
                  <button
                    key={level}
                    type="button"
                    className={`se-difficulty-btn ${
                      difficulty === level
                        ? `active-${level}`
                        : ""
                    }`}
                    onClick={() => {
                      if (!isEditable)
                        return;

                      setDifficulty(level);
                    }}
                  >
                    {level}
                  </button>
                ))}

              </div>

              {/* OPTIONS */}

              <div className="se-option-list">

                {[
                  {
                    letter: "A",
                    value: optionA,
                    setter: setOptionA,
                  },

                  {
                    letter: "B",
                    value: optionB,
                    setter: setOptionB,
                  },

                  {
                    letter: "C",
                    value: optionC,
                    setter: setOptionC,
                  },

                  {
                    letter: "D",
                    value: optionD,
                    setter: setOptionD,
                  },
                ].map(
                  ({
                    letter,
                    value,
                    setter,
                  }) => (
                    <div
                      key={letter}
                      className={`se-option-card ${
                        correctAnswer ===
                        letter
                          ? "se-option-correct"
                          : ""
                      } se-option-hover`}
                    >

                      <input
                        type="radio"
                        checked={
                          correctAnswer ===
                          letter
                        }
                        disabled={
                          !isEditable
                        }
                        onChange={() =>
                          setCorrectAnswer(
                            letter
                          )
                        }
                      />

                      <div className="se-option-letter">
                        {letter}.
                      </div>

                      <div className="se-opt-content">

                        <OptionInput
                          letter={letter}
                          value={value}
                          onChange={setter}
                          disabled={
                            !isEditable
                          }
                        />

                      </div>
                    </div>
                  )
                )}

              </div>

              {/* EXPLANATION */}

              <div className="se-explanation-wrapper">

                <h3 className="se-section-title">
                  Explanation
                </h3>

                <ExplanationField
                  value={explanation}
                  onChange={
                    setExplanation
                  }
                  disabled={!isEditable}
                />

              </div>

            </div>
          </div>

          {/* SIDEBAR */}

          <div className="review-sidebar">

            <h3>Questions</h3>

            <div className="review-palette">

              {filteredQuestions.map(
                (q, i) => (
                  <button
                    key={q.id}
                    className={`review-palette-btn ${
                      i === currentIndex
                        ? "review-current"
                        : ""
                    }`}
                    onClick={() =>
                      goTo(i)
                    }
                  >
                    {i + 1}
                  </button>
                )
              )}

            </div>

          </div>
        </div>

        {/* HTML MODAL */}

        {showHtmlModal && (
          <div className="se-html-modal-overlay">

            <div className="se-html-modal">

              <div className="se-html-modal-header">

                <h2>HTML Editor</h2>

                <button
                  type="button"
                  className="se-toolbar-btn"
                  onClick={() =>
                    setShowHtmlModal(
                      false
                    )
                  }
                >
                  Close
                </button>

              </div>

              <textarea
                className="se-html-popup-editor"
                value={htmlCode}
                onChange={(e) => {
                  const val =
                    e.target.value;

                  setHtmlCode(val);

                  applyHtmlToVisual(
                    val
                  );
                }}
              />

            </div>

          </div>
        )}

      </div>
    </AdminLayout>
  );
}
