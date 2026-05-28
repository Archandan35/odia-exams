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

    if (cmd === "table") {
      const rows = prompt("Rows?");
      const cols = prompt("Columns?");

      if (!rows || !cols) return;

      let table = "<table>";

      for (let r = 0; r < Number(rows); r++) {
        table += "<tr>";

        for (let c = 0; c < Number(cols); c++) {
          table += "<td> </td>";
        }

        table += "</tr>";
      }

      table += "</table>";

      document.execCommand(
        "insertHTML",
        false,
        table
      );

      onChange(editorRef.current.innerHTML);

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
      exec("table");
    }}
  >
    Table
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

        
        {/* TABS */}

        <div className="se-editor-tabs">

          <button
            type="button"
            className={`se-editor-mode-btn ${
              mode === "visual" ? "active" : ""
            }`}
            onClick={() => {
              setMode("visual");

              setTimeout(() => {
                if (editorRef.current) {
                  editorRef.current.innerHTML =
                    htmlValue;
                }
              }, 0);
            }}
          >
            Visual
          </button>

          <button
            type="button"
            className={`se-editor-mode-btn ${
              mode === "html" ? "active" : ""
            }`}
            onClick={() => {
              if (editorRef.current) {
                const currentHtml =
                  editorRef.current.innerHTML;

                setHtmlValue(currentHtml);

                onChange(currentHtml);
              }

              setMode("html");
            }}
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
              exec("table");
            }}
          >
            Table
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

      {/* FILE */}

      <input
        type="file"
        accept="image/*"
        hidden
        ref={fileRef}
        onChange={handleFile}
      />

      {/* EDITOR */}

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
            data-placeholder="Type your question here..."
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
MAIN
========================================================= */

export default function SmartEditPage() {
  const [questions, setQuestions] = useState([]);

  const [subjects, setSubjects] = useState([]);

  const [topics, setTopics] = useState([]);

  const [subTopics, setSubTopics] = useState([]);

  const [filteredQuestions, setFilteredQuestions] =
    useState([]);

  const [currentIndex, setCurrentIndex] =
    useState(0);

  const [questionHtml, setQuestionHtml] =
    useState("");

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

  const [updatedIds, setUpdatedIds] =
    useState(new Set());

  const [errors, setErrors] = useState({});

  const [isNew, setIsNew] = useState(false);
  
  const [isEditingQuestion, setIsEditingQuestion] =
  useState(false);

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
LOAD
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
VALIDATE
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
      err.explanation =
        "⚠ Explanation required";
    }

    setErrors(err);

    return Object.keys(err).length === 0;
  }

  /* =========================================================
CLEAR
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

    setErrors({});
  }

  /* =========================================================
NEW
========================================================= */
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

    toast.success(
      "Hoila 🎉 Question updated successfully"
    );

    setUpdatedIds((prev) => {
      const next = new Set(prev);

      next.add(q.id);

      return next;
    });
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
      toast.error(
        "Select subject/topic/subtopic"
      );
      return;
    }

    await addDoc(collection(db, "questions"), {
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
    });

    toast.success(
      "Hoila 🎉 Question added successfully"
    );

    clearEditor();
  }

  /* =========================================================
STATUS
========================================================= */

  function getQuestionStatus(q) {
    if (updatedIds.has(q.id)) {
      return "correct";
    }

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

        {/* HEADER */}

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

            {isNew && (
              <button
                className="cancel-btn"
                onClick={cancelEditing}
              >
                Cancel
              </button>
            )}

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

            <h3>{difficulty}</h3>
          </div>

          <div className="analytics-mini-card">
            <span>Status</span>

            <h3>
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

             {/* =========================================
QUESTION VIEW / EDIT MODE
========================================= */}

<div className="se-edit-toggle-row">
<div className="se-edit-toggle-row">

  <button
    type="button"
    className={`se-edit-toggle-btn ${
      !isEditingQuestion ? "active" : ""
    }`}
    onClick={() => {
      setIsEditingQuestion(false);
    }}
  >
    View Mode
  </button>

  <button
    type="button"
    className={`se-edit-toggle-btn ${
      isEditingQuestion ? "active" : ""
    }`}
    onClick={() => {
      if (isEditingQuestion) {
        cancelEditing();
      } else {
        setIsEditingQuestion(true);
      }
    }}
  >
    {isEditingQuestion ? "Cancel Edit" : "Edit"}
  </button>

</div>

{/* QUESTION */}

{isEditingQuestion || isNew ? (

  <>
    <QuestionEditor
      value={questionHtml}
      onChange={setQuestionHtml}
    />

    {errors.question && (
      <div className="se-validation-error">
        {errors.question}
      </div>
    )}
  </>

) : (

  <div className="se-view-question-box">

    <div
      className="se-view-question-content"
      dangerouslySetInnerHTML={{
        __html:
          questionHtml ||
          "<p style='color:#64748b'>No Question</p>",
      }}
    />

  </div>

)}

{errors.question && (
  <div className="se-validation-error">
    {errors.question}
  </div>
)}

              {errors.question && (
                <div className="se-validation-error">
                  {errors.question}
                </div>
              )}

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
                      if (!isEditingQuestion && !isNew)
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

                {/* A */}

                <div
                  className={`se-option-card ${
                    correctAnswer === "A"
                      ? "se-option-correct"
                      : ""
                  }`}
                >

                  <input
                    type="radio"
                    checked={
                      correctAnswer === "A"
                    }
                    onChange={() =>
                      setCorrectAnswer("A")
                    }
                  />

                  <div className="se-option-letter">
                    A.
                  </div>

                  <input
                    className="se-opt-input"
                    disabled={!isEditingQuestion && !isNew}
                    placeholder="Option A"
                    value={optionA}
                    onChange={(e) =>
                      setOptionA(
                        e.target.value
                      )
                    }
                  />

                </div>

                {/* B */}

                <div
                  className={`se-option-card ${
                    correctAnswer === "B"
                      ? "se-option-correct"
                      : ""
                  }`}
                >

                  <input
                    type="radio"
                    checked={
                      correctAnswer === "B"
                    }
                    onChange={() =>
                      setCorrectAnswer("B")
                    }
                  />

                  <div className="se-option-letter">
                    B.
                  </div>

                  <input
                    className="se-opt-input"
                    disabled={!isEditingQuestion && !isNew}
                    placeholder="Option B"
                    value={optionB}
                    onChange={(e) =>
                      setOptionB(
                        e.target.value
                      )
                    }
                  />

                </div>

                {/* C */}

                <div
                  className={`se-option-card ${
                    correctAnswer === "C"
                      ? "se-option-correct"
                      : ""
                  }`}
                >

                  <input
                    type="radio"
                    checked={
                      correctAnswer === "C"
                    }
                    onChange={() =>
                      setCorrectAnswer("C")
                    }
                  />

                  <div className="se-option-letter">
                    C.
                  </div>

                  <input
                    className="se-opt-input"
                    disabled={!isEditingQuestion && !isNew}
                    placeholder="Option C"
                    value={optionC}
                    onChange={(e) =>
                      setOptionC(
                        e.target.value
                      )
                    }
                  />

                </div>

                {/* D */}

                <div
                  className={`se-option-card ${
                    correctAnswer === "D"
                      ? "se-option-correct"
                      : ""
                  }`}
                >

                  <input
                    type="radio"
                    checked={
                      correctAnswer === "D"
                    }
                    onChange={() =>
                      setCorrectAnswer("D")
                    }
                  />

                  <div className="se-option-letter">
                    D.
                  </div>

                  <input
                    className="se-opt-input"
                    disabled={!isEditingQuestion && !isNew}
                    placeholder="Option D"
                    value={optionD}
                    onChange={(e) =>
                      setOptionD(
                        e.target.value
                      )
                    }
                  />

                </div>

              </div>

              {/* ERRORS */}

              {errors.a && (
                <div className="se-validation-error">
                  {errors.a}
                </div>
              )}

              {errors.b && (
                <div className="se-validation-error">
                  {errors.b}
                </div>
              )}

              {errors.c && (
                <div className="se-validation-error">
                  {errors.c}
                </div>
              )}

              {errors.d && (
                <div className="se-validation-error">
                  {errors.d}
                </div>
              )}

              {/* EXPLANATION */}

              <div className="se-explanation-box">

                <h3 className="se-explanation-title">
                  Explanation
                </h3>

                <textarea
                  className="se-explanation"
                  disabled={!isEditingQuestion && !isNew}
                  placeholder="Write explanation here..."
                  value={explanation}
                  onChange={(e) =>
                    setExplanation(
                      e.target.value
                    )
                  }
                />

                {errors.explanation && (
                  <div className="se-validation-error">
                    {errors.explanation}
                  </div>
                )}

              </div>

            </div>

          </div>

          {/* RIGHT */}

          <div className="review-sidebar">

            <h3>Questions</h3>

            <div className="review-legend">

              <div className="review-legend-item">

                <div
                  className="review-dot"
                  style={{
                    background:
                      "#16a34a",
                  }}
                />

                Updated

              </div>

              <div className="review-legend-item">

                <div
                  className="review-dot"
                  style={{
                    background:
                      "#475569",
                  }}
                />

                Pending

              </div>

            </div>

            <div className="review-palette">

              {filteredQuestions.map(
                (q, i) => (

                  <button
                    key={q.id}
                    className={`review-palette-btn ${
                      currentIndex === i
                        ? "review-current"
                        : ""
                    } ${
                      getQuestionStatus(
                        q
                      ) === "correct"
                        ? "review-palette-correct"
                        : "review-palette-unanswered"
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

      </div>

    </AdminLayout>
  );
}
