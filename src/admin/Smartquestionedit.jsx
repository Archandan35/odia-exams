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
  const lastPushedRef = useRef(null);

  useEffect(() => {
    if (!editorRef.current) return;
    // Only reset DOM when value changed externally (question switch),
    // not when user is typing (would reset cursor to position 0).
    if (value !== lastPushedRef.current) {
      lastPushedRef.current = value;
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
            cursor: readOnly ? "default" : "text",
            userSelect: readOnly ? "none" : "text",
          }}
          onInput={() => {
            if (!editorRef.current) return;
            const html = editorRef.current.innerHTML;
            lastPushedRef.current = html;
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

  const [showLinkModal, setShowLinkModal] =
    useState(false);

  const [showTableModal, setShowTableModal] =
    useState(false);

  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);

  const imageUploadRef = useRef(null);

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
     HTML ↔ VISUAL SYNC
  ========================================================= */

  // Build the canonical HTML string from current visual state
  function buildHtmlFromState({
    qHtml = questionHtml,
    a = optionA, b = optionB, c = optionC, d = optionD,
    answer = correctAnswer,
    diff = difficulty,
    expl = explanation,
  } = {}) {
    return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body>

<div data-field="question">
${qHtml || ""}
</div>

<p data-field="optionA">${a}</p>
<p data-field="optionB">${b}</p>
<p data-field="optionC">${c}</p>
<p data-field="optionD">${d}</p>

<div data-field="explanation">
${expl}
</div>

<div data-correct="${answer}" data-difficulty="${diff}"></div>

</body>
</html>`;
  }

  // Parse HTML string back into visual state fields
  function applyHtmlToVisual(html) {
    setHtmlCode(html);

    const parser = new DOMParser();
    const parsed = parser.parseFromString(html, "text/html");

    const get = (sel) => parsed.querySelector(sel);

    // Question
    const qNode = get('[data-field="question"]');
    if (qNode) setQuestionHtml(qNode.innerHTML.trim());

    // Options — try data-field first, fall back to <p> order
    const oA = get('[data-field="optionA"]');
    const oB = get('[data-field="optionB"]');
    const oC = get('[data-field="optionC"]');
    const oD = get('[data-field="optionD"]');
    const paras = parsed.querySelectorAll("p");

    if (oA) setOptionA(oA.innerHTML);
    else if (paras[0]) setOptionA(paras[0].innerHTML);

    if (oB) setOptionB(oB.innerHTML);
    else if (paras[1]) setOptionB(paras[1].innerHTML);

    if (oC) setOptionC(oC.innerHTML);
    else if (paras[2]) setOptionC(paras[2].innerHTML);

    if (oD) setOptionD(oD.innerHTML);
    else if (paras[3]) setOptionD(paras[3].innerHTML);

    // Explanation
    const exNode = get('[data-field="explanation"]') || get('.explanation');
    if (exNode) setExplanation(exNode.innerHTML.trim());

    // Correct answer + difficulty
    const meta = get('[data-correct]') || get('[data-difficulty]');
    if (meta) {
      const ans = meta.getAttribute("data-correct");
      const diff = meta.getAttribute("data-difficulty");
      if (ans) setCorrectAnswer(ans);
      if (diff) setDifficulty(diff);
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

  /* =========================================================
     INSERT HELPERS
  ========================================================= */

  function insertLink() {
    if (!linkUrl) return;
    const text = linkText || linkUrl;
    document.execCommand(
      "insertHTML",
      false,
      `<a href="${linkUrl}" target="_blank" style="color:#60a5fa;text-decoration:underline">${text}</a>`
    );
    setLinkUrl("");
    setLinkText("");
    setShowLinkModal(false);
  }

  function insertTable() {
    let html = `<table style="border-collapse:collapse;width:100%;margin:8px 0">`;
    for (let r = 0; r < tableRows; r++) {
      html += "<tr>";
      for (let c = 0; c < tableCols; c++) {
        const tag = r === 0 ? "th" : "td";
        html += `<${tag} style="border:1px solid #334155;padding:8px 12px;background:${r===0?"#1e293b":"#111827"};text-align:left">&nbsp;</${tag}>`;
      }
      html += "</tr>";
    }
    html += "</table><br>";
    document.execCommand("insertHTML", false, html);
    setShowTableModal(false);
  }

  function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      document.execCommand(
        "insertHTML",
        false,
        `<img src="${ev.target.result}" style="max-width:100%;border-radius:10px;margin:6px 0" />`
      );
    };
    reader.readAsDataURL(file);
    e.target.value = "";
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

              {/* TOP BAR — single unified row */}

              <div className="se-edit-toolbar-wrapper">

                {/* VIEW / EDIT toggle */}
                <div className="se-segment-group">
                  <button
                    type="button"
                    className={`se-segment-btn ${!isEditable ? "active" : ""}`}
                    onClick={() => setIsEditingQuestion(false)}
                  >
                    View
                  </button>
                  <button
                    type="button"
                    className={`se-segment-btn ${isEditable ? "active" : ""}`}
                    onClick={() => {
                      if (isEditable) { cancelEditing(); }
                      else { setIsEditingQuestion(true); }
                    }}
                  >
                    {isEditable ? "Cancel" : "Edit"}
                  </button>
                </div>

                {/* VISUAL / HTML toggle */}
                <div className="se-segment-group">
                  <button
                    type="button"
                    className="se-segment-btn active"
                    onClick={() => setShowHtmlModal(false)}
                  >
                    Visual
                  </button>
                  <button
                    type="button"
                    className="se-segment-btn"
                    onClick={() => {
                      const fresh = buildHtmlFromState();
                      setHtmlCode(fresh);
                      setShowHtmlModal(true);
                    }}
                  >
                    HTML
                  </button>
                </div>

                {/* FORMATTING + INSERT TOOLBAR — always visible in edit mode */}
                {isEditable && (
                  <div className="se-editor-toolbar">

                    {/* Format buttons */}
                    {[
                      ["bold", "B"],
                      ["italic", "I"],
                      ["underline", "U"],
                      ["insertUnorderedList", "≡"],
                      ["insertOrderedList", "1."],
                    ].map(([cmd, label]) => (
                      <button
                        key={cmd}
                        type="button"
                        className="se-toolbar-btn"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          document.execCommand(cmd, false, null);
                        }}
                      >
                        {label}
                      </button>
                    ))}

                    {/* Divider */}
                    <span className="se-toolbar-divider" />

                    {/* Link insert */}
                    <button
                      type="button"
                      className="se-toolbar-btn"
                      title="Insert Link"
                      onClick={() => setShowLinkModal(true)}
                    >
                      🔗 Link
                    </button>

                    {/* Table insert */}
                    <button
                      type="button"
                      className="se-toolbar-btn"
                      title="Insert Table"
                      onClick={() => setShowTableModal(true)}
                    >
                      ⊞ Table
                    </button>

                    {/* Image upload */}
                    <button
                      type="button"
                      className="se-toolbar-btn"
                      title="Upload Image"
                      onClick={() => imageUploadRef.current?.click()}
                    >
                      🖼 Image
                    </button>
                    <input
                      ref={imageUploadRef}
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleImageUpload}
                    />

                  </div>
                )}

              </div>

              {/* SCROLLABLE CONTENT AREA */}
              <div className="se-content-scroll">

              {/* View-mode wrapper: badge appears on hover over ANY field */}
              <div className={!isEditable ? "se-view-content-group" : ""}>

                {/* Shared hover badge — only in view mode */}
                {!isEditable && (
                  <div className="se-view-only-badge" title="View Only — click Edit to make changes">
                    <svg viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="22" cy="22" r="20" fill="#dc2626" fillOpacity="0.92" stroke="white" strokeWidth="2.5"/>
                      <line x1="10" y1="10" x2="34" y2="34" stroke="white" strokeWidth="4" strokeLinecap="round"/>
                    </svg>
                  </div>
                )}

              {/* QUESTION */}
              <div className={!isEditable ? "se-view-question-box" : "se-edit-question-box"}>
                <QuestionEditor
                  value={questionHtml}
                  onChange={setQuestionHtml}
                  readOnly={!isEditable}
                />
              </div>

              {/* DIFFICULTY */}
              <div className="se-difficulty-row">
                {["easy", "medium", "hard"].map((level) => (
                  <button
                    key={level}
                    type="button"
                    className={`se-difficulty-btn ${
                      difficulty === level ? `active-${level}` : ""
                    } ${isEditable ? "se-editable-mode" : ""}`}
                    onClick={() => {
                      if (!isEditable) return;
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
                  { letter: "A", value: optionA, setter: setOptionA },
                  { letter: "B", value: optionB, setter: setOptionB },
                  { letter: "C", value: optionC, setter: setOptionC },
                  { letter: "D", value: optionD, setter: setOptionD },
                ].map(({ letter, value, setter }) => (
                  <div
                    key={letter}
                    className={`se-option-card ${
                      correctAnswer === letter ? "se-option-correct" : ""
                    } se-option-hover ${isEditable ? "se-option-editable" : ""}`}
                  >
                    <input
                      type="radio"
                      checked={correctAnswer === letter}
                      disabled={!isEditable}
                      onChange={() => setCorrectAnswer(letter)}
                    />
                    <div className="se-option-letter">{letter}.</div>
                    <div className="se-opt-content">
                      <OptionInput
                        letter={letter}
                        value={value}
                        onChange={setter}
                        disabled={!isEditable}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* EXPLANATION */}
              <div className="se-explanation-wrapper">
                <h3 className="se-section-title">Explanation</h3>
                <ExplanationField
                  value={explanation}
                  onChange={setExplanation}
                  disabled={!isEditable}
                />
              </div>

              </div>{/* end se-view-content-group */}

              </div>{/* end se-content-scroll */}

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

        {/* LINK MODAL */}
        {showLinkModal && (
          <div className="se-html-modal-overlay">
            <div className="se-mini-modal">
              <div className="se-html-modal-header">
                <h2>Insert Link</h2>
                <button type="button" className="se-toolbar-btn" onClick={() => setShowLinkModal(false)}>✕</button>
              </div>
              <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
                <input
                  style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "10px", padding: "10px 14px", color: "white", fontSize: "14px" }}
                  placeholder="Display text (optional)"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                />
                <input
                  style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "10px", padding: "10px 14px", color: "white", fontSize: "14px" }}
                  placeholder="https://url..."
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                />
                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                  <button type="button" className="se-toolbar-btn" onClick={() => setShowLinkModal(false)}>Cancel</button>
                  <button type="button" style={{ background: "#2563eb", color: "white", border: "none", borderRadius: "10px", padding: "10px 20px", fontWeight: 700, cursor: "pointer" }} onClick={insertLink}>Insert</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TABLE MODAL */}
        {showTableModal && (
          <div className="se-html-modal-overlay">
            <div className="se-mini-modal">
              <div className="se-html-modal-header">
                <h2>Insert Table</h2>
                <button type="button" className="se-toolbar-btn" onClick={() => setShowTableModal(false)}>✕</button>
              </div>
              <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <label style={{ color: "#94a3b8", fontSize: "14px", minWidth: "60px" }}>Rows</label>
                  <input
                    type="number" min="1" max="20"
                    style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "10px", padding: "8px 12px", color: "white", fontSize: "14px", width: "80px" }}
                    value={tableRows}
                    onChange={(e) => setTableRows(Number(e.target.value))}
                  />
                </div>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <label style={{ color: "#94a3b8", fontSize: "14px", minWidth: "60px" }}>Columns</label>
                  <input
                    type="number" min="1" max="10"
                    style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "10px", padding: "8px 12px", color: "white", fontSize: "14px", width: "80px" }}
                    value={tableCols}
                    onChange={(e) => setTableCols(Number(e.target.value))}
                  />
                </div>
                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                  <button type="button" className="se-toolbar-btn" onClick={() => setShowTableModal(false)}>Cancel</button>
                  <button type="button" style={{ background: "#2563eb", color: "white", border: "none", borderRadius: "10px", padding: "10px 20px", fontWeight: 700, cursor: "pointer" }} onClick={insertTable}>Insert</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* HTML MODAL */}

        {showHtmlModal && (
          <div className="se-html-modal-overlay">

            <div className="se-html-modal">

              <div className="se-html-modal-header">
                <div style={{ display:"flex", flexDirection:"column", gap:"2px" }}>
                  <h2 style={{ margin:0 }}>HTML Editor</h2>
                  <span style={{ fontSize:"12px", color:"#60a5fa" }}>
                    ⟳ Live sync — edits here update Visual mode instantly
                  </span>
                </div>
                <div style={{ display:"flex", gap:"8px" }}>
                  <button
                    type="button"
                    className="se-toolbar-btn"
                    style={{ background:"#16a34a", color:"white", borderColor:"#16a34a" }}
                    onClick={() => setShowHtmlModal(false)}
                  >
                    ✓ Apply & Close
                  </button>
                  <button
                    type="button"
                    className="se-toolbar-btn"
                    onClick={() => {
                      // Discard HTML changes — rebuild from current visual state
                      setHtmlCode(buildHtmlFromState());
                      setShowHtmlModal(false);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>

              <textarea
                className="se-html-popup-editor"
                value={htmlCode}
                onChange={(e) => {
                  const val = e.target.value;
                  setHtmlCode(val);
                  applyHtmlToVisual(val);
                }}
              />

            </div>

          </div>
        )}

      </div>
    </AdminLayout>
  );
}
