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
   RICH-TEXT TOOLBAR
───────────────────────────────────────── */

function RichToolbar({ onCommand }) {

  const tools = [
    { label: "B",    cmd: "bold",          title: "Bold" },
    { label: "I",    cmd: "italic",        title: "Italic" },
    { label: "U",    cmd: "underline",     title: "Underline" },
    { label: "H₁",  cmd: "h1",            title: "Heading 1" },
    { label: "H₂",  cmd: "h2",            title: "Heading 2" },
    { label: "x²",  cmd: "superscript",   title: "Superscript" },
    { label: "x₂",  cmd: "subscript",     title: "Subscript" },
    { label: "≡",   cmd: "insertUnorderedList", title: "Bullet List" },
    { label: "1.",  cmd: "insertOrderedList",   title: "Numbered List" },
  ];

  return (
    <div className="se-rich-toolbar">
      {tools.map((t) => (
        <button
          key={t.cmd}
          title={t.title}
          className="se-toolbar-btn"
          onMouseDown={(e) => {
            e.preventDefault();
            onCommand(t.cmd);
          }}
        >
          {t.label}
        </button>
      ))}

      <div className="se-toolbar-divider" />

      <button
        className="se-toolbar-btn se-toolbar-btn--icon"
        title="Insert Image URL"
        onMouseDown={(e) => {
          e.preventDefault();
          onCommand("insertImage");
        }}
      >
        🖼
      </button>

      <button
        className="se-toolbar-btn se-toolbar-btn--icon"
        title="Insert Table"
        onMouseDown={(e) => {
          e.preventDefault();
          onCommand("insertTable");
        }}
      >
        ⊞
      </button>

      <button
        className="se-toolbar-btn se-toolbar-btn--icon"
        title="Toggle HTML source"
        onMouseDown={(e) => {
          e.preventDefault();
          onCommand("toggleHTML");
        }}
      >
        &lt;/&gt;
      </button>
    </div>
  );

}

/* ─────────────────────────────────────────
   CONTENT-EDITABLE QUESTION FIELD
───────────────────────────────────────── */

function QuestionEditor({ value, onChange }) {

  const editorRef = useRef(null);
  const [htmlMode, setHtmlMode] = useState(false);
  const [rawHtml, setRawHtml] = useState(value || "");

  /* sync incoming value only on mount / question switch */
  useEffect(() => {

    if (!htmlMode && editorRef.current) {
      editorRef.current.innerHTML = value || "";
    }

    setRawHtml(value || "");

  }, [value]);

  function execCmd(cmd) {

    if (cmd === "toggleHTML") {

      if (!htmlMode) {
        const html = editorRef.current?.innerHTML || "";
        setRawHtml(html);
      } else {
        if (editorRef.current) {
          editorRef.current.innerHTML = rawHtml;
          onChange(rawHtml);
        }
      }

      setHtmlMode((p) => !p);
      return;

    }

    if (cmd === "insertImage") {

      const url = window.prompt("Image URL:");

      if (url) {
        document.execCommand(
          "insertHTML",
          false,
          `<img src="${url}" style="max-width:100%;border-radius:6px;margin:6px 0;" alt="question image" />`
        );
      }

      return;

    }

    if (cmd === "insertTable") {

      const tbl = `
        <table border="1" style="border-collapse:collapse;width:100%;margin:8px 0;">
          <tr><th style="padding:6px 10px;background:#1e2535;">Col 1</th><th style="padding:6px 10px;background:#1e2535;">Col 2</th><th style="padding:6px 10px;background:#1e2535;">Col 3</th></tr>
          <tr><td style="padding:6px 10px;">A1</td><td style="padding:6px 10px;">B1</td><td style="padding:6px 10px;">C1</td></tr>
          <tr><td style="padding:6px 10px;">A2</td><td style="padding:6px 10px;">B2</td><td style="padding:6px 10px;">C2</td></tr>
        </table>`;

      document.execCommand("insertHTML", false, tbl);
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
            const html = editorRef.current?.innerHTML || "";
            onChange(html);
          }}
        />
      )}
    </div>
  );

}

/* ─────────────────────────────────────────
   MAIN: SMART EDIT PAGE
───────────────────────────────────────── */

export default function SmartEditPage() {

  const [questions,   setQuestions]   = useState([]);
  const [subjects,    setSubjects]    = useState([]);
  const [topics,      setTopics]      = useState([]);
  const [subTopics,   setSubTopics]   = useState([]);

  const [currentIndex, setCurrentIndex] = useState(0);

  /* form fields */
  const [questionHtml,  setQuestionHtml]  = useState("");
  const [optionA,       setOptionA]       = useState("");
  const [optionB,       setOptionB]       = useState("");
  const [optionC,       setOptionC]       = useState("");
  const [optionD,       setOptionD]       = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("A");
  const [difficulty,    setDifficulty]    = useState("easy");
  const [explanation,   setExplanation]   = useState("");

  /* add-new mode */
  const [isNew,            setIsNew]            = useState(false);
  const [selectedSubject,  setSelectedSubject]  = useState("");
  const [selectedTopic,    setSelectedTopic]    = useState("");
  const [selectedSubTopic, setSelectedSubTopic] = useState("");

  /* updated set for palette color */
  const [updatedIds, setUpdatedIds] = useState(new Set());

  const optionLabels = ["A", "B", "C", "D"];

  /* ── FIRESTORE LISTENERS ── */

  useEffect(() => {
    return onSnapshot(collection(db, "subjects"), (snap) =>
      setSubjects(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
  }, []);

  useEffect(() => {
    return onSnapshot(collection(db, "topics"), (snap) =>
      setTopics(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
  }, []);

  useEffect(() => {
    return onSnapshot(collection(db, "subtopics"), (snap) =>
      setSubTopics(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
  }, []);

  useEffect(() => {
    return onSnapshot(collection(db, "questions"), (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setQuestions(data);
    });
  }, []);

  /* ── LOAD QUESTION INTO FORM ── */

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

  }, [currentIndex, questions, isNew]);

  /* ── NAVIGATION ── */

  function goTo(index) {
    if (index < 0 || index >= questions.length) return;
    setIsNew(false);
    setCurrentIndex(index);
  }

  function openNew() {
    setIsNew(true);
    setQuestionHtml("");
    setOptionA(""); setOptionB(""); setOptionC(""); setOptionD("");
    setCorrectAnswer("A");
    setDifficulty("easy");
    setExplanation("");
    setSelectedSubject("");
    setSelectedTopic("");
    setSelectedSubTopic("");
  }

  /* ── UPDATE ── */

  async function handleUpdate() {

    const q = questions[currentIndex];
    if (!q) return;

    if (!questionHtml.trim()) {
      toast.error("Question cannot be empty");
      return;
    }

    await updateDoc(doc(db, "questions", q.id), {
      question:      questionHtml.trim(),
      options:       [optionA, optionB, optionC, optionD],
      correctAnswer: typeof correctAnswer === "number"
                       ? optionLabels[correctAnswer]
                       : correctAnswer,
      difficulty,
      explanation:   explanation.trim(),
    });

    setUpdatedIds((prev) => new Set(prev).add(q.id));
    toast.success("Question updated");

  }

  /* ── ADD NEW ── */

  async function handleAddNew() {

    if (!questionHtml.trim()) {
      toast.error("Question required");
      return;
    }

    if (!optionA || !optionB || !optionC || !optionD) {
      toast.error("All options required");
      return;
    }

    if (!selectedSubject || !selectedTopic || !selectedSubTopic) {
      toast.error("Select subject / topic / sub-topic");
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
      subjectId:     selectedSubject,
      topicId:       selectedTopic,
      subTopicId:    selectedSubTopic,
      question:      questionHtml.trim(),
      options:       [optionA, optionB, optionC, optionD],
      correctAnswer: typeof correctAnswer === "number"
                       ? optionLabels[correctAnswer]
                       : correctAnswer,
      difficulty,
      explanation:   explanation.trim(),
      createdAt:     Date.now(),
    });

    setUpdatedIds((prev) => new Set(prev).add(ref.id));
    toast.success("Question added");
    setIsNew(false);

  }

  /* ── HELPERS ── */

  function getName(arr, id) {
    return arr.find((x) => x.id === id)?.name || "Unknown";
  }

  const filteredTopicsForNew    = topics.filter((t) => t.subjectId === selectedSubject);
  const filteredSubTopicsForNew = subTopics.filter(
    (s) => s.subjectId === selectedSubject && s.topicId === selectedTopic
  );

  const currentQ = questions[currentIndex];

  /* ─────────────────── RENDER ─────────────────── */

  return (
    <AdminLayout>

      <div className="se-shell">

        {/* ══ LEFT: EDITOR PANEL ══ */}
        <div className="se-editor-panel">

          {/* TOP NAV BAR */}
          <div className="se-topbar">

            <div className="se-topbar-left">
              <button
                className="se-nav-btn"
                disabled={currentIndex === 0 || isNew}
                onClick={() => goTo(currentIndex - 1)}
              >
                <span>◀</span> Prev
              </button>

              <div className="se-position-badge">
                {isNew ? (
                  <span className="se-new-badge">New Question</span>
                ) : (
                  <>
                    <span className="se-pos-num">Q.{currentIndex + 1}</span>
                    <span className="se-pos-sep">/</span>
                    <span className="se-pos-total">{questions.length}</span>
                  </>
                )}
              </div>

              <button
                className="se-nav-btn"
                disabled={currentIndex >= questions.length - 1 || isNew}
                onClick={() => goTo(currentIndex + 1)}
              >
                Next <span>▶</span>
              </button>
            </div>

            <div className="se-topbar-right">
              <div className="se-diff-chips">
                {["easy", "medium", "hard"].map((d) => (
                  <button
                    key={d}
                    className={`se-diff-chip se-diff-chip--${d}${difficulty === d ? " active" : ""}`}
                    onClick={() => setDifficulty(d)}
                  >
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </button>
                ))}
              </div>

              <button className="se-btn se-btn--new" onClick={openNew}>
                + Add New
              </button>

              <button
                className="se-btn se-btn--update"
                onClick={isNew ? handleAddNew : handleUpdate}
              >
                {isNew ? "✓ Save" : "✓ Update"}
              </button>
            </div>

          </div>

          {/* SCROLLABLE CONTENT */}
          <div className="se-content">

            {/* NEW QUESTION: hierarchy selectors */}
            {isNew && (
              <div className="se-hierarchy-row">
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
                    <option key={s.id} value={s.id}>{s.name}</option>
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
                  {filteredTopicsForNew.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>

                <select
                  className="se-select"
                  value={selectedSubTopic}
                  onChange={(e) => setSelectedSubTopic(e.target.value)}
                >
                  <option value="">Select Sub-Topic</option>
                  {filteredSubTopicsForNew.map((st) => (
                    <option key={st.id} value={st.id}>{st.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* QUESTION FIELD */}
            <div className="se-q-row">
              <div className="se-q-num-badge">
                Q.{isNew ? "New" : currentIndex + 1}
              </div>
              <div className="se-q-field">
                <QuestionEditor
                  key={isNew ? "new" : currentIndex}
                  value={questionHtml}
                  onChange={setQuestionHtml}
                />
              </div>
            </div>

            {/* OPTIONS */}
            <div className="se-section-label">Options</div>
            <div className="se-options-list">
              {[
                { label: "A", val: optionA, set: setOptionA },
                { label: "B", val: optionB, set: setOptionB },
                { label: "C", val: optionC, set: setOptionC },
                { label: "D", val: optionD, set: setOptionD },
              ].map(({ label, val, set }) => {

                const isCorrect = correctAnswer === label;

                return (
                  <div
                    key={label}
                    className={`se-opt-row${isCorrect ? " correct" : ""}`}
                  >
                    <label className="se-opt-radio-wrap" title="Mark as correct answer">
                      <input
                        type="radio"
                        name="correctAnswer"
                        checked={isCorrect}
                        onChange={() => setCorrectAnswer(label)}
                        className="se-opt-radio"
                      />
                    </label>

                    <div className={`se-opt-letter${isCorrect ? " correct" : ""}`}>
                      {label}
                    </div>

                    <input
                      className={`se-opt-input${isCorrect ? " correct" : ""}`}
                      value={val}
                      onChange={(e) => set(e.target.value)}
                      placeholder={`Option ${label}`}
                    />

                    {isCorrect && (
                      <span className="se-correct-tag">✓ Correct</span>
                    )}
                  </div>
                );

              })}
            </div>

            {/* EXPLANATION */}
            <div className="se-section-label">Explanation</div>
            <textarea
              className="se-explanation"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Add an explanation for the correct answer..."
              rows={4}
            />

          </div>
        </div>

        {/* ══ RIGHT: QUESTION PALETTE ══ */}
        <div className="se-palette-panel">

          <div className="se-palette-header">
            <span>Questions</span>
            <span className="se-palette-count">{questions.length}</span>
          </div>

          <div className="se-palette-legend">
            <div className="se-leg-item">
              <span className="se-leg-dot updated" />
              Updated
            </div>
            <div className="se-leg-item">
              <span className="se-leg-dot pending" />
              Pending
            </div>
            <div className="se-leg-item">
              <span className="se-leg-dot current-dot" />
              Current
            </div>
          </div>

          <div className="se-palette-grid-wrap">
            <div className="se-palette-grid">
              {questions.map((q, i) => {

                const isUpdated = updatedIds.has(q.id);
                const isCurrent = !isNew && i === currentIndex;

                let cls = "se-pal-btn";
                if (isCurrent)      cls += " current";
                else if (isUpdated) cls += " updated";
                else                cls += " pending";

                return (
                  <button
                    key={q.id}
                    className={cls}
                    onClick={() => goTo(i)}
                  >
                    {i + 1}
                  </button>
                );

              })}

              {isNew && (
                <button className="se-pal-btn current new-q-indicator">
                  +
                </button>
              )}
            </div>
          </div>

        </div>

      </div>

    </AdminLayout>
  );

}
