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
  RICH TEXT EDITOR (used for Question only)
========================================================= */

function QuestionEditor({ value, onChange, globalHtmlMode }) {
  const editorRef = useRef(null);
  const fileRef  = useRef(null);

  // local html buffer so visual↔html round-trips don't lose content
  const [htmlBuffer, setHtmlBuffer] = useState(value || "");

  /* Sync incoming value changes */
  useEffect(() => {
    setHtmlBuffer(value || "");
    if (!globalHtmlMode && editorRef.current) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]); // eslint-disable-line

  /* When mode flips to visual, hydrate the contenteditable */
  useEffect(() => {
    if (!globalHtmlMode && editorRef.current) {
      editorRef.current.innerHTML = htmlBuffer;
    }
  }, [globalHtmlMode]); // eslint-disable-line

  function exec(cmd) {
    if (cmd === "image-upload") { fileRef.current.click(); return; }

    if (cmd === "image-url") {
      const url = window.prompt("Enter Image URL");
      if (url) {
        document.execCommand(
          "insertHTML", false,
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
        for (let c = 0; c < Number(cols); c++) table += "<td> </td>";
        table += "</tr>";
      }
      table += "</table>";
      document.execCommand("insertHTML", false, table);
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
        "insertHTML", false,
        `<img src="${reader.result}" style="max-width:100%;border-radius:12px;margin:10px 0;" />`
      );
      onChange(editorRef.current.innerHTML);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="se-editor-shell">
      {/* Toolbar — always shown in edit mode */}
      <div className="se-editor-toolbar">
        {[
          ["bold","B"], ["italic","I"], ["underline","U"],
          ["insertUnorderedList","≡"], ["insertOrderedList","1."],
          ["table","Table"], ["image-url","URL"], ["image-upload","Upload"],
        ].map(([cmd, label]) => (
          <button
            key={cmd}
            type="button"
            className="se-toolbar-btn"
            onMouseDown={(e) => { e.preventDefault(); exec(cmd); }}
          >
            {label}
          </button>
        ))}
      </div>

      <input type="file" accept="image/*" hidden ref={fileRef} onChange={handleFile} />

      {/* HTML mode: raw textarea */}
      {globalHtmlMode ? (
        <textarea
          className="se-html-editor"
          value={htmlBuffer}
          onChange={(e) => {
            const val = e.target.value;
            setHtmlBuffer(val);
            onChange(val);
          }}
          placeholder="Write HTML here..."
        />
      ) : (
        /* Visual mode: contenteditable */
        <div className="se-question-scroll">
          <div
            ref={editorRef}
            className="se-editable"
            contentEditable
            suppressContentEditableWarning
            data-placeholder="Type your question here..."
            onInput={() => {
              const html = editorRef.current.innerHTML;
              setHtmlBuffer(html);
              onChange(html);
            }}
          />
        </div>
      )}
    </div>
  );
}

/* =========================================================
  HTML-AWARE OPTION INPUT
  – Visual mode: plain <input>
  – HTML mode: <textarea> showing raw HTML value
========================================================= */

function OptionInput({ value, onChange, disabled, letter, globalHtmlMode }) {
  return globalHtmlMode ? (
    <textarea
      className="se-html-editor se-html-editor--option"
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      placeholder={`Option ${letter} HTML...`}
    />
  ) : (
    /* Visual mode: render HTML preview when disabled, input when editing */
    disabled ? (
      <div
        className="se-opt-display"
        dangerouslySetInnerHTML={{ __html: value || `<span style="color:#64748b">Option ${letter}</span>` }}
      />
    ) : (
      <input
        className="se-opt-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Option ${letter}`}
      />
    )
  );
}

/* =========================================================
  HTML-AWARE EXPLANATION TEXTAREA
========================================================= */

function ExplanationField({ value, onChange, disabled, globalHtmlMode }) {
  return globalHtmlMode ? (
    <textarea
      className="se-html-editor se-html-editor--explanation"
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Explanation HTML..."
    />
  ) : disabled ? (
    <div
      className="se-explanation-view"
      dangerouslySetInnerHTML={{ __html: value || "<span style='color:#64748b'>No explanation</span>" }}
    />
  ) : (
    <textarea
      className="se-explanation"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Write explanation here..."
    />
  );
}

/* =========================================================
  MAIN COMPONENT
========================================================= */

export default function SmartEditPage() {
  const [questions,        setQuestions]        = useState([]);
  const [subjects,         setSubjects]         = useState([]);
  const [topics,           setTopics]           = useState([]);
  const [subTopics,        setSubTopics]        = useState([]);
  const [filteredQuestions,setFilteredQuestions]= useState([]);
  const [currentIndex,     setCurrentIndex]     = useState(0);
  const [questionHtml,     setQuestionHtml]     = useState("");
  const [optionA,          setOptionA]          = useState("");
  const [optionB,          setOptionB]          = useState("");
  const [optionC,          setOptionC]          = useState("");
  const [optionD,          setOptionD]          = useState("");
  const [correctAnswer,    setCorrectAnswer]    = useState("A");
  const [difficulty,       setDifficulty]       = useState("easy");
  const [explanation,      setExplanation]      = useState("");
  const [selectedSubject,  setSelectedSubject]  = useState("");
  const [selectedTopic,    setSelectedTopic]    = useState("");
  const [selectedSubTopic, setSelectedSubTopic] = useState("");
  const [updatedIds,       setUpdatedIds]       = useState(new Set());
  const [errors,           setErrors]           = useState({});
  const [isNew,            setIsNew]            = useState(false);
  const [isEditingQuestion,setIsEditingQuestion]= useState(false);

  /* Global HTML / Visual toggle — drives ALL field renderings */
  const [globalHtmlMode, setGlobalHtmlMode] = useState(false);

  /* =========================================================
    FIREBASE LISTENERS
  ========================================================= */

  useEffect(() => onSnapshot(collection(db,"subjects"), s => setSubjects(s.docs.map(d => ({id:d.id,...d.data()})))), []);
  useEffect(() => onSnapshot(collection(db,"topics"),   s => setTopics(s.docs.map(d => ({id:d.id,...d.data()})))), []);
  useEffect(() => onSnapshot(collection(db,"subtopics"),s => setSubTopics(s.docs.map(d => ({id:d.id,...d.data()})))), []);
  useEffect(() => onSnapshot(collection(db,"questions"),s => setQuestions(s.docs.map(d => ({id:d.id,...d.data()})))), []);

  /* =========================================================
    FILTER QUESTIONS
  ========================================================= */

  useEffect(() => {
    const filtered = questions.filter(q =>
      (!selectedSubject  || q.subjectId  === selectedSubject)  &&
      (!selectedTopic    || q.topicId    === selectedTopic)    &&
      (!selectedSubTopic || q.subTopicId === selectedSubTopic)
    );
    setFilteredQuestions(filtered);
    setCurrentIndex(0);
  }, [questions, selectedSubject, selectedTopic, selectedSubTopic]);

  /* =========================================================
    LOAD QUESTION INTO FORM
  ========================================================= */

  useEffect(() => {
    if (filteredQuestions.length === 0 || isNew) return;
    const q = filteredQuestions[currentIndex];
    if (!q) return;
    setQuestionHtml(q.question     || "");
    setOptionA(    q.options?.[0]  || "");
    setOptionB(    q.options?.[1]  || "");
    setOptionC(    q.options?.[2]  || "");
    setOptionD(    q.options?.[3]  || "");
    setCorrectAnswer(q.correctAnswer || "A");
    setDifficulty(   q.difficulty    || "easy");
    setExplanation(  q.explanation   || "");
  }, [filteredQuestions, currentIndex, isNew]);

  /* =========================================================
    VALIDATE
  ========================================================= */

  function validate() {
    const err = {};
    if (!questionHtml.trim()) err.question = "⚠ Question required";
    if (!optionA.trim())      err.a        = "⚠ Option A required";
    if (!optionB.trim())      err.b        = "⚠ Option B required";
    if (!optionC.trim())      err.c        = "⚠ Option C required";
    if (!optionD.trim())      err.d        = "⚠ Option D required";
    if (!explanation.trim())  err.explanation = "⚠ Explanation required";
    setErrors(err);
    return Object.keys(err).length === 0;
  }

  /* =========================================================
    CLEAR EDITOR
  ========================================================= */

  function clearEditor() {
    setQuestionHtml(""); setOptionA(""); setOptionB(""); setOptionC(""); setOptionD("");
    setCorrectAnswer("A"); setDifficulty("easy"); setExplanation(""); setErrors({});
  }

  /* =========================================================
    OPEN NEW / CANCEL EDITING
  ========================================================= */

  function openNew() { setIsNew(true); setIsEditingQuestion(true); clearEditor(); }

  function cancelEditing() {
    setIsNew(false); setIsEditingQuestion(false);
    const q = filteredQuestions[currentIndex];
    if (!q) return;
    setQuestionHtml(q.question     || "");
    setOptionA(    q.options?.[0]  || "");
    setOptionB(    q.options?.[1]  || "");
    setOptionC(    q.options?.[2]  || "");
    setOptionD(    q.options?.[3]  || "");
    setCorrectAnswer(q.correctAnswer || "A");
    setDifficulty(   q.difficulty    || "easy");
    setExplanation(  q.explanation   || "");
  }

  /* =========================================================
    NAVIGATION
  ========================================================= */

  function goTo(index) {
    if (index < 0 || index >= filteredQuestions.length) return;
    setIsNew(false); setCurrentIndex(index);
  }

  /* =========================================================
    UPDATE QUESTION
  ========================================================= */

  async function handleUpdate() {
    if (!validate()) return;
    const q = filteredQuestions[currentIndex];
    if (!q) return;
    await updateDoc(doc(db,"questions",q.id), {
      question: questionHtml,
      options: [optionA, optionB, optionC, optionD],
      correctAnswer, difficulty, explanation,
    });
    toast.success("Hoila 🎉 Question updated successfully");
    setUpdatedIds(prev => { const n = new Set(prev); n.add(q.id); return n; });
    setIsEditingQuestion(false);
  }

  /* =========================================================
    ADD NEW QUESTION
  ========================================================= */

  async function handleAddNew() {
    if (!validate()) return;
    if (!selectedSubject || !selectedTopic || !selectedSubTopic) {
      toast.error("Select subject/topic/subtopic"); return;
    }
    await addDoc(collection(db,"questions"), {
      subjectId: selectedSubject, topicId: selectedTopic, subTopicId: selectedSubTopic,
      question: questionHtml, options: [optionA, optionB, optionC, optionD],
      correctAnswer, difficulty, explanation, createdAt: Date.now(),
    });
    toast.success("Hoila 🎉 Question added successfully");
    setIsNew(false); setIsEditingQuestion(false); clearEditor();
  }

  /* =========================================================
    DELETE QUESTION
  ========================================================= */

  async function handleDelete() {
    const q = filteredQuestions[currentIndex];
    if (!q) return;
    if (!window.confirm("Are you sure you want to delete this question?")) return;
    await deleteDoc(doc(db,"questions",q.id));
    toast.success("Question deleted");
    setCurrentIndex(prev => Math.max(0, prev - 1));
  }

  /* =========================================================
    QUESTION STATUS (for palette)
  ========================================================= */

  function getQuestionStatus(q) { return updatedIds.has(q.id) ? "correct" : "unanswered"; }

  /* =========================================================
    DERIVED FILTER LISTS
  ========================================================= */

  const filteredTopics    = topics.filter(t => !selectedSubject || t.subjectId === selectedSubject);
  const filteredSubTopics = subTopics.filter(s =>
    (!selectedSubject || s.subjectId === selectedSubject) &&
    (!selectedTopic   || s.topicId   === selectedTopic)
  );

  const isEditable = isEditingQuestion || isNew;

  /* =========================================================
    RENDER
  ========================================================= */

  return (
    <AdminLayout>
      <div className="page">

        {/* ── HEADER ─────────────────────────────────────── */}
        <div className="review-topbar">
          <div>
            <h2>Smart Edit Interface</h2>
            <p>Enterprise Question Editing System</p>
          </div>

          <div className="review-actions">
            <button
              className="review-nav-btn se-action-btn"
              disabled={currentIndex === 0 || isNew}
              onClick={() => goTo(currentIndex - 1)}
            >
              ← Previous
            </button>
            <button
              className="review-nav-btn se-action-btn"
              disabled={currentIndex >= filteredQuestions.length - 1 || isNew}
              onClick={() => goTo(currentIndex + 1)}
            >
              Next →
            </button>
            <button className="submit-btn se-action-btn" onClick={openNew}>
              + Add New
            </button>
            {isNew && (
              <button className="cancel-btn se-action-btn" onClick={cancelEditing}>
                Cancel
              </button>
            )}
            {!isNew && filteredQuestions.length > 0 && (
              <button className="delete-btn se-action-btn" onClick={handleDelete}>
                🗑 Delete
              </button>
            )}
            <button
              className="submit-btn se-action-btn"
              onClick={isNew ? handleAddNew : handleUpdate}
            >
              {isNew ? "✓ Save" : "✓ Update"}
            </button>
          </div>
        </div>

        {/* ── ANALYTICS STRIP ────────────────────────────── */}
        <div className="se-review-analytics-strip">
          <div className="analytics-mini-card">
            <span>Question</span>
            <h3>{isNew ? "New" : `${currentIndex + 1} / ${filteredQuestions.length}`}</h3>
          </div>
          <div className="analytics-mini-card">
            <span>Difficulty</span>
            <h3>{difficulty}</h3>
          </div>
          <div className="analytics-mini-card">
            <span>Status</span>
            <h3>{isNew ? "Creating" : isEditable ? "Editing" : "Viewing"}</h3>
          </div>
          <div className="analytics-mini-card">
            <span>Correct</span>
            <h3>{correctAnswer}</h3>
          </div>
          <div className="analytics-mini-card">
            <span>Total</span>
            <h3>{filteredQuestions.length}</h3>
          </div>
        </div>

        {/* ── FILTER BAR ─────────────────────────────────── */}
        <div className="se-filter-bar">
          <select className="se-select" value={selectedSubject}
            onChange={e => { setSelectedSubject(e.target.value); setSelectedTopic(""); setSelectedSubTopic(""); }}>
            <option value="">All Subjects</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select className="se-select" value={selectedTopic}
            onChange={e => { setSelectedTopic(e.target.value); setSelectedSubTopic(""); }}>
            <option value="">All Topics</option>
            {filteredTopics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select className="se-select" value={selectedSubTopic}
            onChange={e => setSelectedSubTopic(e.target.value)}>
            <option value="">All Sub Topics</option>
            {filteredSubTopics.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        {/* ── MAIN LAYOUT ─────────────────────────────────── */}
        <div className="review-layout">

          {/* ── LEFT: QUESTION CARD ──────────────────────── */}
          <div className="review-main">
            <div className="se-review-question-card">

              {/* View / Edit Mode Toggle + HTML/Visual Toggle */}
              <div className="se-edit-toggle-row">
                <button
                  type="button"
                  className={`se-edit-toggle-btn${!isEditable ? " active" : ""}`}
                  onClick={() => setIsEditingQuestion(false)}
                >
                  View Mode
                </button>
                <button
                  type="button"
                  className={`se-edit-toggle-btn${isEditable ? " active" : ""}`}
                  onClick={() => { if (isEditable) cancelEditing(); else setIsEditingQuestion(true); }}
                >
                  {isEditable ? "Cancel Edit" : "Edit"}
                </button>

                {/* ── Global HTML ↔ Visual toggle ── */}
                <div className="se-mode-toggle-group">
                  <button
                    type="button"
                    className={`se-editor-mode-btn${!globalHtmlMode ? " active" : ""}`}
                    onClick={() => setGlobalHtmlMode(false)}
                  >
                    Visual
                  </button>
                  <button
                    type="button"
                    className={`se-editor-mode-btn${globalHtmlMode ? " active" : ""}`}
                    onClick={() => setGlobalHtmlMode(true)}
                  >
                    HTML
                  </button>
                </div>
              </div>

              {/* ── QUESTION ─────────────────────────────── */}
              {isEditable ? (
                <>
                  <QuestionEditor
                    value={questionHtml}
                    onChange={setQuestionHtml}
                    globalHtmlMode={globalHtmlMode}
                  />
                  {errors.question && <div className="se-validation-error">{errors.question}</div>}
                </>
              ) : (
                <div className="se-view-question-box">
                  {globalHtmlMode ? (
                    <textarea
                      className="se-html-editor"
                      value={questionHtml}
                      readOnly
                    />
                  ) : (
                    <div
                      className="se-view-question-content"
                      dangerouslySetInnerHTML={{ __html: questionHtml || "<p style='color:#64748b'>No Question</p>" }}
                    />
                  )}
                </div>
              )}

              {/* ── DIFFICULTY ───────────────────────────── */}
              <div className="se-difficulty-row">
                {["easy","medium","hard"].map(level => (
                  <button
                    key={level}
                    type="button"
                    className={`se-difficulty-btn${difficulty === level ? ` active-${level}` : ""}`}
                    onClick={() => { if (!isEditable) return; setDifficulty(level); }}
                  >
                    {level}
                  </button>
                ))}
              </div>

              {/* ── OPTIONS A–D ──────────────────────────── */}
              <div className="se-option-list">
                {[
                  { letter:"A", value:optionA, setter:setOptionA },
                  { letter:"B", value:optionB, setter:setOptionB },
                  { letter:"C", value:optionC, setter:setOptionC },
                  { letter:"D", value:optionD, setter:setOptionD },
                ].map(({ letter, value, setter }) => (
                  <div
                    key={letter}
                    className={`se-option-card${correctAnswer === letter ? " se-option-correct" : ""}`}
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
                        globalHtmlMode={globalHtmlMode}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Option errors */}
              {errors.a && <div className="se-validation-error">{errors.a}</div>}
              {errors.b && <div className="se-validation-error">{errors.b}</div>}
              {errors.c && <div className="se-validation-error">{errors.c}</div>}
              {errors.d && <div className="se-validation-error">{errors.d}</div>}

              {/* ── EXPLANATION ──────────────────────────── */}
              <div className="se-explanation-box">
                <h3 className="se-explanation-title">Explanation</h3>
                <ExplanationField
                  value={explanation}
                  onChange={setExplanation}
                  disabled={!isEditable}
                  globalHtmlMode={globalHtmlMode}
                />
                {errors.explanation && <div className="se-validation-error">{errors.explanation}</div>}
              </div>

            </div>
          </div>

          {/* ── RIGHT: QUESTION PALETTE SIDEBAR ─────────── */}
          <div className="review-sidebar">
            <h3>Questions</h3>
            <div className="review-legend">
              <div className="review-legend-item">
                <div className="review-dot" style={{ background: "#16a34a" }} />
                Updated
              </div>
              <div className="review-legend-item">
                <div className="review-dot" style={{ background: "#475569" }} />
                Pending
              </div>
            </div>
            <div className="review-palette">
              {filteredQuestions.map((q, i) => (
                <button
                  key={q.id}
                  className={`review-palette-btn${currentIndex === i ? " review-current" : ""} ${getQuestionStatus(q) === "correct" ? "review-palette-correct" : "review-palette-unanswered"}`}
                  onClick={() => goTo(i)}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </AdminLayout>
  );
}
