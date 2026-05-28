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
  globalHtmlMode,
  readOnly = false,
}) {
  const editorRef = useRef(null);
  const fileRef = useRef(null);

  const [htmlBuffer, setHtmlBuffer] = useState(value || "");

  useEffect(() => {
    setHtmlBuffer(value || "");

    if (!globalHtmlMode && editorRef.current) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value, globalHtmlMode]);

  function exec(cmd) {
    if (readOnly) return;

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

      let table = `
        <table border="1" style="width:100%;border-collapse:collapse;margin:10px 0;">
      `;

      for (let r = 0; r < Number(rows); r++) {
        table += "<tr>";

        for (let c = 0; c < Number(cols); c++) {
          table += `<td style="padding:8px;"> </td>`;
        }

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

      {/* SINGLE ROW HEADER TOOLBOX */}
      <div className="se-editor-top-bar">
        <div className="se-left-controls">
           </div>

        {!readOnly && (
          <div className="se-editor-toolbar se-toolbar-scroll">
            {[
              ["bold", "B"],
              ["italic", "I"],
              ["underline", "U"],
              ["insertUnorderedList", "≡"],
              ["insertOrderedList", "1."],
              ["table", "Table"],
              ["image-url", "URL"],
              ["image-upload", "Upload"],
            ].map(([cmd, label]) => (
              <button
                key={cmd}
                type="button"
                className="se-toolbar-btn"
                onMouseDown={(e) => {
                  e.preventDefault();
                  exec(cmd);
                }}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      <input
        type="file"
        hidden
        ref={fileRef}
        accept="image/*"
        onChange={handleFile}
      />

      {/* HTML MODE */}
      {globalHtmlMode ? (
        <div className="se-question-scroll">
          <textarea
            className="se-html-editor se-question-html"
            value={htmlBuffer}
            readOnly={readOnly}
            onChange={(e) => {
              const val = e.target.value;
              setHtmlBuffer(val);
              onChange(val);
            }}
            placeholder="Write HTML..."
          />
        </div>
      ) : (
        /* VISUAL MODE */
        <div className="se-question-scroll">
          <div
            ref={editorRef}
            className={`se-editable ${readOnly ? "readonly" : ""}`}
            contentEditable={!readOnly}
            style={{
              minHeight: "100px",
              height: "auto",
            }}
            suppressContentEditableWarning
            data-placeholder="Type your question here..."
            onInput={() => {
              if (!editorRef.current) return;
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
   OPTION INPUT
========================================================= */

function OptionInput({
  value,
  onChange,
  disabled,
  letter,
  globalHtmlMode,
}) {
  if (globalHtmlMode) {
    return (
      <textarea
        className="se-html-editor se-html-editor--option"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Option ${letter} HTML`}
      />
    );
  }

  return (
    <div className="se-opt-render-box" style={{ width: "100%" }}>
      {disabled ? (
        <div
          className="se-opt-display se-scrollable-box"
          style={{ width: "100%", color: "#f1f5f9" }}
          dangerouslySetInnerHTML={{
            __html: value || `<span style="color:#64748b">Empty Option</span>`
          }}
        />
      ) : (
        <input
          className="se-opt-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Option ${letter}`}
          style={{ width: "100%", background: "transparent", border: "none", outline: "none", color: "#fff" }}
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
  globalHtmlMode,
}) {
  if (globalHtmlMode) {
    return (
      <textarea
        className="se-html-editor se-html-editor--explanation"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Explanation HTML..."
      />
    );
  }

  return disabled ? (
    <div
      className="se-explanation-view se-scrollable-box"
      dangerouslySetInnerHTML={{
        __html: value || "<span style='color:#64748b'>No explanation</span>"
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
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [globalHtmlMode, setGlobalHtmlMode] = useState(false);

  /* =========================================================
     FIREBASE
  ========================================================= */

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
      setQuestions(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);

  /* =========================================================
     FILTER QUESTIONS
  ========================================================= */

  useEffect(() => {
    const filtered = questions.filter((q) =>
      (!selectedSubject || q.subjectId === selectedSubject) &&
      (!selectedTopic || q.topicId === selectedTopic) &&
      (!selectedSubTopic || q.subTopicId === selectedSubTopic)
    );
    setFilteredQuestions(filtered);
    setCurrentIndex(0);
  }, [questions, selectedSubject, selectedTopic, selectedSubTopic]);

  /* =========================================================
     LOAD QUESTION
  ========================================================= */

  useEffect(() => {
    if (filteredQuestions.length === 0 || isNew) return;
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
    if (!questionHtml.trim()) err.question = "Question required";
    if (!optionA.trim()) err.a = "Option A required";
    if (!optionB.trim()) err.b = "Option B required";
    if (!optionC.trim()) err.c = "Option C required";
    if (!optionD.trim()) err.d = "Option D required";

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

  /* =========================================================
     CANCEL
  ========================================================= */

  function cancelEditing() {
    setIsNew(false);
    setIsEditingQuestion(false);
    const q = filteredQuestions[currentIndex];
    if (!q) return;

    setQuestionHtml(q.question || "");
    setOptionA(q.options?.[0] || "");
    setOptionB(q.options?.[1] || "");
    setOptionC(q.options?.[2] || "");
    setCorrectAnswer(q.correctAnswer || "A");
    setDifficulty(q.difficulty || "easy");
    setExplanation(q.explanation || "");
  }

  /* =========================================================
     NAVIGATION
  ========================================================= */

  function goTo(index) {
    if (index < 0 || index >= filteredQuestions.length) return;
    setCurrentIndex(index);
    setIsNew(false);
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
      options: [optionA, optionB, optionC, optionD],
      correctAnswer,
      difficulty,
      explanation,
    });

    toast.success("Question updated");
    setUpdatedIds((prev) => {
      const next = new Set(prev);
      next.add(q.id);
      return next;
    });
    setIsEditingQuestion(false);
  }

  /* =========================================================
     ADD
  ========================================================= */

  async function handleAddNew() {
    if (!validate()) return;
    if (!selectedSubject || !selectedTopic || !selectedSubTopic) {
      toast.error("Select subject/topic/subtopic");
      return;
    }

    await addDoc(collection(db, "questions"), {
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

    const confirmDelete = window.confirm("Delete this question?");
    if (!confirmDelete) return;

    await deleteDoc(doc(db, "questions", q.id));
    toast.success("Question deleted");
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  }

  const filteredTopics = topics.filter((t) => !selectedSubject || t.subjectId === selectedSubject);
  const filteredSubTopics = subTopics.filter((s) => 
    (!selectedSubject || s.subjectId === selectedSubject) &&
    (!selectedTopic || s.topicId === selectedTopic)
  );

  const isEditable = isEditingQuestion || isNew;

  return (
    <AdminLayout>
      <div className="page">
        {/* HEADER */}
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

            {!isNew && (
              <button className="delete-btn se-action-btn" onClick={handleDelete}>
                Delete
              </button>
            )}

            <button className="submit-btn se-action-btn" onClick={isNew ? handleAddNew : handleUpdate}>
              {isNew ? "Save" : "Update"}
            </button>
          </div>
        </div>

        {/* FILTER BAR */}
        <div className="se-filter-bar">
          <select
            className="se-select"
            value={selectedSubject}
            onChange={(e) => {
              setSelectedSubject(e.target.value);
              setSelectedTopic("");
              setSelectedSubTopic("");
            }}
          >
            <option value="">All Subjects</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          <select
            className="se-select"
            value={selectedTopic}
            onChange={(e) => {
              setSelectedTopic(e.target.value);
              setSelectedSubTopic("");
            }}
          >
            <option value="">All Topics</option>
            {filteredTopics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>

          <select
            className="se-select"
            value={selectedSubTopic}
            onChange={(e) => setSelectedSubTopic(e.target.value)}
          >
            <option value="">All Sub Topics</option>
            {filteredSubTopics.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        {/* MAIN LAYOUT */}
        <div className="review-layout">
          <div className="review-main se-main-scroll-area">
            <div className="se-review-question-card">
              
              {/* TOP MODE BAR (Contains View/Edit and Visual/HTML with single row toggle) */}
             <div className="se-edit-toolbar-wrapper">

  {/* VIEW / EDIT */}
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
        if (isEditable) cancelEditing();
        else setIsEditingQuestion(true);
      }}
    >
      {isEditable ? "Cancel" : "Edit"}
    </button>
  </div>

  {/* VISUAL / HTML */}
  <div className="se-segment-group">
    <button
      type="button"
      className={`se-segment-btn ${!globalHtmlMode ? "active" : ""}`}
      onClick={() => setGlobalHtmlMode(false)}
    >
      Visual
    </button>

    <button
      type="button"
      className={`se-segment-btn ${globalHtmlMode ? "active" : ""}`}
      onClick={() => setGlobalHtmlMode(true)}
    >
      HTML
    </button>
  </div>

  {/* TOOLBAR */}
  {!(!isEditable) && (
    <div className="se-editor-toolbar se-toolbar-scroll">
      {[
        ["bold", "B"],
        ["italic", "I"],
        ["underline", "U"],
        ["insertUnorderedList", "≡"],
        ["insertOrderedList", "1."],
        ["table", "Table"],
        ["image-url", "URL"],
        ["image-upload", "Upload"],
      ].map(([cmd, label]) => (
        <button
          key={cmd}
          type="button"
          className="se-toolbar-btn"
          onMouseDown={(e) => {
            e.preventDefault();
            exec(cmd);
          }}
        >
          {label}
        </button>
      ))}
    </div>
  )}
</div>

              {/* QUESTION FIELD CONTAINER */}
              <div className={!isEditable ? "se-view-question-box" : "se-edit-question-box"}>
               <div
                  className="se-readonly-badge"
                  title="Read Only Mode"
                >
                  🔒
                </div>
                <QuestionEditor
                  value={questionHtml}
                  onChange={setQuestionHtml}
                  globalHtmlMode={globalHtmlMode}
                  readOnly={!isEditable}
                />
              </div>

              {/* DIFFICULTY */}
              <div className="se-difficulty-row">
                {["easy", "medium", "hard"].map((level) => (
                  <button
                    key={level}
                    type="button"
                    className={`se-difficulty-btn ${difficulty === level ? `active-${level}` : ""}`}
                    onClick={() => {
                      if (!isEditable) return;
                      setDifficulty(level);
                    }}
                  >
                    {level}
                  </button>
                ))}
              </div>

              {/* OPTIONS CONTAINER */}
              <div className="se-option-list se-scrollable-options">
                {[
                  { letter: "A", value: optionA, setter: setOptionA },
                  { letter: "B", value: optionB, setter: setOptionB },
                  { letter: "C", value: optionC, setter: setOptionC },
                  { letter: "D", value: optionD, setter: setOptionD },
                ].map(({ letter, value, setter }) => (
                  <div
                    key={letter}
                    className={`se-option-card ${correctAnswer === letter ? "se-option-correct" : ""} ${!isEditable ? "readonly-view" : "edit-view"} se-option-hover`}                  >
                    <input
                      type="radio"
                      name="correct-answer-group"
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

              {/* EXPLANATION */}
              <div className="se-explanation-wrapper">
                <h3 className="se-section-title">Explanation</h3>
                <ExplanationField
                  value={explanation}
                  onChange={setExplanation}
                  disabled={!isEditable}
                  globalHtmlMode={globalHtmlMode}
                />
              </div>

            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="review-sidebar">
            <h3>Questions</h3>
            <div className="review-palette">
              {filteredQuestions.map((q, index) => (
                <button
                  key={q.id}
                  className={`review-palette-btn ${currentIndex === index ? "review-current" : ""}`}
                  onClick={() => goTo(index)}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
