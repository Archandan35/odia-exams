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
          {readOnly && (
            <div className="se-readonly-indicator" title="Read Only Mode">
              <span>🔒 Read Only</span>
            </div>
          )}
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

      {/* HTML / VISUAL MODE */}
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
        <div className="se-question-scroll">
          <div
            ref={editorRef}
            className={`se-editable ${readOnly ? "readonly" : ""}`}
            contentEditable={!readOnly}
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
    const filtered = questions.filter(
      (q) =>
        (!selectedSubject || q.subjectId === selectedSubject) &&
        (!selectedTopic || q.topicId === selectedTopic) &&
        (!selectedSubTopic || q.subTopicId === selectedSubTopic)
    );
    setFilteredQuestions(filtered);
  }, [questions, selectedSubject, selectedTopic, selectedSubTopic]);

  /* =========================================================
     LOAD CURRENT QUESTION
  ========================================================= */
  useEffect(() => {
    if (filteredQuestions.length > 0 && currentIndex < filteredQuestions.length) {
      const q = filteredQuestions[currentIndex];
      setQuestionHtml(q.questionHtml || "");
      setOptionA(q.optionA || "");
      setOptionB(q.optionB || "");
      setOptionC(q.optionC || "");
      setOptionD(q.optionD || "");
      setCorrectAnswer(q.correctAnswer || "A");
      setDifficulty(q.difficulty || "easy");
      setExplanation(q.explanation || "");
      setIsNew(false);
      setIsEditingQuestion(false);
    } else {
      clearForm();
      setIsNew(true);
      setIsEditingQuestion(true);
    }
  }, [filteredQuestions, currentIndex]);

  function clearForm() {
    setQuestionHtml("");
    setOptionA("");
    setOptionB("");
    setOptionC("");
    setOptionD("");
    setCorrectAnswer("A");
    setDifficulty("easy");
    setExplanation("");
  }

  function handleCreateNew() {
    clearForm();
    setIsNew(true);
    setIsEditingQuestion(true);
  }

  function startEdit() {
    if (filteredQuestions.length === 0) return;
    setIsEditingQuestion(true);
  }

  function cancelEdit() {
    if (isNew) {
      if (filteredQuestions.length > 0) {
        setCurrentIndex(0);
      } else {
        clearForm();
      }
    } else {
      const q = filteredQuestions[currentIndex];
      if (q) {
        setQuestionHtml(q.questionHtml || "");
        setOptionA(q.optionA || "");
        setOptionB(q.optionB || "");
        setOptionC(q.optionC || "");
        setOptionD(q.optionD || "");
        setCorrectAnswer(q.correctAnswer || "A");
        setDifficulty(q.difficulty || "easy");
        setExplanation(q.explanation || "");
      }
      setIsEditingQuestion(false);
    }
  }

  async function saveQuestion() {
    const data = {
      questionHtml,
      optionA,
      optionB,
      optionC,
      optionD,
      correctAnswer,
      difficulty,
      explanation,
      subjectId: selectedSubject,
      topicId: selectedTopic,
      subTopicId: selectedSubTopic,
    };

    try {
      if (isNew) {
        const docRef = await addDoc(collection(db, "questions"), data);
        setUpdatedIds((prev) => new Set([...prev, docRef.id]));
        toast.success("Question created successfully!");
      } else {
        const q = filteredQuestions[currentIndex];
        await updateDoc(doc(db, "questions", q.id), data);
        setUpdatedIds((prev) => new Set([...prev, q.id]));
        toast.success("Question updated successfully!");
      }
      setIsEditingQuestion(false);
    } catch (err) {
      console.error(err);
      toast.error("Error saving question.");
    }
  }

  async function handleDelete() {
    if (isNew || filteredQuestions.length === 0) return;
    if (!window.confirm("Are you sure you want to delete this question?")) return;

    const q = filteredQuestions[currentIndex];
    try {
      await deleteDoc(doc(db, "questions", q.id));
      toast.success("Question deleted.");
      if (currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      }
    } catch (err) {
      console.error(err);
      toast.error("Error deleting question.");
    }
  }

  function goTo(idx) {
    setCurrentIndex(idx);
  }

  const isEditable = isEditingQuestion;

  return (
    <AdminLayout>
      <div className="page">
        {/* DROPDOWN SELECTORS */}
        <div className="filter-grid">
          <select
            className="filter-select"
            value={selectedSubject}
            onChange={(e) => {
              setSelectedSubject(e.target.value);
              setSelectedTopic("");
              setSelectedSubTopic("");
              setCurrentIndex(0);
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
            className="filter-select"
            value={selectedTopic}
            onChange={(e) => {
              setSelectedTopic(e.target.value);
              setSelectedSubTopic("");
              setCurrentIndex(0);
            }}
            disabled={!selectedSubject}
          >
            <option value="">Select Topic</option>
            {topics
              .filter((t) => t.subjectId === selectedSubject)
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
          </select>

          <select
            className="filter-select"
            value={selectedSubTopic}
            onChange={(e) => {
              setSelectedSubTopic(e.target.value);
              setCurrentIndex(0);
            }}
            disabled={!selectedTopic}
          >
            <option value="">Select SubTopic</option>
            {subTopics
              .filter((st) => st.topicId === selectedTopic)
              .map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))}
          </select>
        </div>

        {/* SINGLE HORIZONTAL BAR FOR ALL CORE CONFIG CONTROLS */}
        <div className="se-controls-row">
          <div className="se-btn-group">
            {isEditingQuestion ? (
              <>
                <button className="se-action-btn edit-btn" onClick={saveQuestion}>
                  Save
                </button>
                <button className="se-action-btn cancel-btn" onClick={cancelEdit}>
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button className="se-action-btn edit-btn" onClick={startEdit}>
                  Edit Mode
                </button>
                <button className="se-action-btn delete-btn" onClick={handleDelete}>
                  Delete
                </button>
              </>
            )}
            <button className="se-action-btn submit-btn" onClick={handleCreateNew}>
              + Add New
            </button>
          </div>

          <div className="se-btn-group">
            <button
              className={`se-action-btn ${!globalHtmlMode ? "active" : ""}`}
              onClick={() => setGlobalHtmlMode(false)}
            >
              Visual View
            </button>
            <button
              className={`se-action-btn ${globalHtmlMode ? "active" : ""}`}
              onClick={() => setGlobalHtmlMode(true)}
            >
              HTML View
            </button>
          </div>

          <div className="se-btn-group">
            <select
              className="se-select-compact"
              value={correctAnswer}
              disabled={!isEditable}
              onChange={(e) => setCorrectAnswer(e.target.value)}
            >
              <option value="A">Correct: A</option>
              <option value="B">Correct: B</option>
              <option value="C">Correct: C</option>
              <option value="D">Correct: D</option>
            </select>

            <select
              className="se-select-compact"
              value={difficulty}
              disabled={!isEditable}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        {/* WORKSPACE LAYOUT CONTAINER */}
        <div className="review-layout">
          <div className="review-main">
            <div className="se-editor-shell-container">
              {/* QUESTION EDITOR FIELD */}
              <QuestionEditor
                value={questionHtml}
                onChange={setQuestionHtml}
                globalHtmlMode={globalHtmlMode}
                readOnly={!isEditable}
              />

              {/* OPTIONS HANDLING SECTION */}
              <div className="se-options-grid">
                {[
                  ["A", optionA, setOptionA],
                  ["B", optionB, setOptionB],
                  ["C", optionC, setOptionC],
                  ["D", optionD, setOptionD],
                ].map(([letter, value, setter]) => (
                  <div key={letter} className="se-option-row">
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

              {/* EXPLANATION FIELD */}
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

          {/* RIGHT NAVIGATION PALETTE SIDEBAR */}
          <div className="review-sidebar">
            <h3>Questions ({filteredQuestions.length})</h3>
            <div className="review-palette">
              {filteredQuestions.map((q, index) => (
                <button
                  key={q.id}
                  className={`review-palette-btn ${
                    currentIndex === index ? "review-current" : ""
                  }`}
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
