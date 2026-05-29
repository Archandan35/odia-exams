import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import useExamEngine from "../hooks/useExamEngine";

export default function ExamPagePhone() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showCheatDialog, setShowCheatDialog] = useState(false);
  const [cheatDialogCount, setCheatDialogCount] = useState(0);
  const navigate = useNavigate();

  const {
    loading,
    questions,
    examData,
    currentQuestion,
    setCurrentQuestion,
    answers,
    visited,
    review,
    bookmarks,
    currentQ,
    selectedOpt,
    selectOption,
    handleNext,
    handlePrev,
    clearResponse,
    toggleReview,
    toggleBookmark,
    submitExam,
    timeLeft,
    cheatCount,
    formatTime,
    setVisited,
    saveProgress,
  } = useExamEngine();

  /* ---- Back-navigation: show leave dialog instead of black screen ---- */
  useEffect(() => {
    const handlePopState = (e) => {
      e.preventDefault();
      window.history.pushState(null, "", window.location.pathname);
      setShowLeaveDialog(true);
    };
    window.history.pushState(null, "", window.location.pathname);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  /* ---- Cheating warning: show dialog on cheatCount change ---- */
  useEffect(() => {
    if (cheatCount > 0) {
      setCheatDialogCount(cheatCount);
      setShowCheatDialog(true);
    }
  }, [cheatCount]);

  const handleLeaveExam = useCallback(() => {
    setShowLeaveDialog(false);
    navigate("/exams"); // redirect to exam listing page
  }, [navigate]);

  const handleSaveAndLeave = useCallback(() => {
    if (saveProgress) saveProgress();
    setShowLeaveDialog(false);
    navigate("/exams");
  }, [navigate, saveProgress]);

  const handleContinueExam = useCallback(() => {
    setShowLeaveDialog(false);
  }, []);

  const handleCheatOk = useCallback(() => {
    setShowCheatDialog(false);
  }, []);

  if (loading) {
    return (
      <div className="ph-loading-screen">
        <div className="ph-loading-card">
          <div className="ph-loading-logo">
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="24" cy="24" r="22" stroke="#2563eb" strokeWidth="3" fill="none" strokeDasharray="5 3" className="ph-loading-ring"/>
              <path d="M14 24h20M24 14v20" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round"/>
              <circle cx="24" cy="24" r="5" fill="#2563eb" opacity="0.2"/>
            </svg>
          </div>
          <div className="ph-loading-spinner">
            <div className="ph-spinner-dot"></div>
            <div className="ph-spinner-dot"></div>
            <div className="ph-spinner-dot"></div>
          </div>
          <p className="ph-loading-text">Loading Exam...</p>
          <p className="ph-loading-sub">Please wait while we prepare your questions</p>
        </div>
      </div>
    );
  }

  if (!currentQ) {
    return (
      <div className="ph-loading-screen">
        <div className="ph-loading-card">
          <div className="ph-loading-icon-warn">⚠️</div>
          <p className="ph-loading-text">No Questions Found</p>
          <p className="ph-loading-sub">Please contact your administrator</p>
        </div>
      </div>
    );
  }

  /* ---- Palette counts ---- */
  const answeredCount    = Object.keys(answers).length;
  const markedCount      = Object.keys(review).filter(id => review[id]).length;
  const notAnsweredCount = questions.filter(
    q => visited[q.id] && answers[q.id] === undefined
  ).length;
  const notVisitedCount  = questions.filter(q => !visited[q.id]).length;

  /* ---- Timer colour ---- */
  const timerWarning = timeLeft < 300;

  const isReviewed   = review[currentQ?.id];
  const isBookmarked = bookmarks?.[currentQ?.id];

  return (
    <div className="ph-layout">

      {/* ── LEAVE EXAM CONFIRMATION DIALOG ── */}
      {showLeaveDialog && (
        <div className="ph-dialog-overlay">
          <div className="ph-dialog">
            <div className="ph-dialog-icon">🚪</div>
            <h3 className="ph-dialog-title">Are you sure you want to leave the exam?</h3>
            <p className="ph-dialog-sub">Any unsaved responses may be lost.</p>
            <div className="ph-dialog-actions">
              <button className="ph-dialog-btn ph-dialog-btn-continue" onClick={handleContinueExam}>
                ✅ Continue Exam
              </button>
              <button className="ph-dialog-btn ph-dialog-btn-save" onClick={handleSaveAndLeave}>
                💾 Save Progress
              </button>
              <button className="ph-dialog-btn ph-dialog-btn-leave" onClick={handleLeaveExam}>
                🚪 Leave Exam
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CHEATING WARNING DIALOG ── */}
      {showCheatDialog && (
        <div className="ph-dialog-overlay ph-cheat-overlay">
          <div className="ph-dialog ph-cheat-dialog">
            <div className="ph-cheat-icon">⚠️</div>
            <h3 className="ph-dialog-title ph-cheat-title">Tab Switch Detected!</h3>
            <p className="ph-dialog-sub">
              You have switched tabs or left the exam window.
            </p>
            <div className="ph-cheat-counter">
              <span className="ph-cheat-count-label">Warning</span>
              <span className="ph-cheat-count-value">{cheatDialogCount} / 3</span>
            </div>
            <p className="ph-cheat-warning-msg">
              {cheatDialogCount >= 3
                ? "⛔ Maximum warnings reached. Your exam may be auto-submitted."
                : `${3 - cheatDialogCount} warning(s) remaining before auto-submit.`}
            </p>
            <button className="ph-dialog-btn ph-dialog-btn-continue ph-cheat-ok-btn" onClick={handleCheatOk}>
              OK, I Understand
            </button>
          </div>
        </div>
      )}

      {/* ── HEADER ── */}
      <div className="ph-header">

        {/* Row 1: Exam title */}
        <div className="ph-header-row1">
          <div className="ph-title-wrap">
            <div className="ph-title">{examData?.name || "Exam"}</div>
          </div>
        </div>

        {/* Row 2: Pause btn | Warning Counter | Timer */}
        <div className="ph-header-row2">
          <button className="ph-pause-btn" onClick={() => setShowLeaveDialog(true)}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1"/>
              <rect x="14" y="4" width="4" height="16" rx="1"/>
            </svg>
            Pause
          </button>

          {/* Warning Counter */}
          <div className="ph-warning-counter">
            <span className="ph-warning-icon">⚠️</span>
            <span className="ph-warning-count">{cheatCount ?? 0} / 3</span>
          </div>

          <div className="ph-header-spacer" />

          <div
            className="ph-timer"
            style={timerWarning ? { color: "#f87171", borderColor: "#ef4444", background: "rgba(239,68,68,0.15)" } : {}}
          >
            {formatTime(timeLeft)}
          </div>
        </div>

      </div>

      {/* ── CONTENT ── */}
      <div className="ph-content">
        <div className="ph-question-card">

          {/* question meta row */}
          <div className="ph-question-top">
            <div className="ph-question-no">{currentQuestion + 1}</div>
            <div
              className="ph-question-text"
              dangerouslySetInnerHTML={{
                __html: currentQ.question || currentQ.text || "",
              }}
            />
          </div>

          {/* ── OPTIONS ── */}
          <div className="ph-options">
            {(currentQ.options || []).map((option, idx) => (
              <label
                key={idx}
                className={
                  selectedOpt === idx
                    ? "ph-option ph-option-selected"
                    : "ph-option"
                }
              >
                <input
                  type="radio"
                  checked={selectedOpt === idx}
                  onChange={() => selectOption(idx)}
                />
                <span className="ph-option-letter">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="ph-option-text">{option}</span>
              </label>
            ))}
          </div>

        </div>
      </div>

      {/* ── FLOATING SIDEBAR TOGGLE (FAB) — positioned higher to avoid overlap ── */}
      <button
        className="ph-fab-menu"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open question palette"
      >
        ☰
      </button>

      {/* ── NAV FOOTER (two rows) ── */}
      <div className="ph-nav-footer">

        {/* Row 1: Review + Bookmark */}
        <div className="ph-nav-row1">
          <button
            className={`ph-nav-btn ph-btn-review${isReviewed ? " active" : ""}`}
            onClick={() => toggleReview && toggleReview()}
          >
            🚩 {isReviewed ? "Marked" : "Mark Review"}
          </button>
          <button
            className={`ph-nav-btn ph-btn-bookmark${isBookmarked ? " active" : ""}`}
            onClick={() => toggleBookmark && toggleBookmark()}
          >
            🔖 {isBookmarked ? "Bookmarked" : "Bookmark"}
          </button>
        </div>

        {/* Row 2: Prev + Save&Next + Submit */}
        <div className="ph-nav-row2">
          <button className="ph-nav-btn ph-btn-prev" onClick={handlePrev}>
            ← Prev
          </button>
          <button className="ph-nav-btn ph-btn-next" onClick={handleNext}>
            Save &amp; Next →
          </button>
          <button
            className="ph-nav-btn ph-btn-submit-footer"
            onClick={() => submitExam(false)}
          >
            Submit
          </button>
        </div>

      </div>

      {/* ── SIDEBAR OVERLAY ── */}
      <div
        className={sidebarOpen ? "ph-sidebar-overlay open" : "ph-sidebar-overlay"}
        onClick={() => setSidebarOpen(false)}
      />

      {/* ── SIDEBAR ── */}
      <div className={sidebarOpen ? "ph-sidebar open" : "ph-sidebar"}>

        {/* fixed header */}
        <div className="ph-sidebar-header">

          <div className="ph-sidebar-top-row">
            <span className="ph-sidebar-title">
              {examData?.name || "Question Palette"}
            </span>
            <button
              className="ph-close-btn"
              onClick={() => setSidebarOpen(false)}
            >
              ✕
            </button>
          </div>

          {/* stats */}
          <div className="ph-stats-grid">
            <div className="ph-stat-box blue ph-stat-box-current">
              <span className="ph-stat-label">Current Question</span>
              <span className="ph-stat-value">{currentQuestion + 1}</span>
            </div>
            <div className="ph-stat-box green">
              <span className="ph-stat-label">Answered</span>
              <span className="ph-stat-value">{answeredCount}</span>
            </div>
            <div className="ph-stat-box yellow">
              <span className="ph-stat-label">Marked for Review</span>
              <span className="ph-stat-value">{markedCount}</span>
            </div>
            <div className="ph-stat-box red">
              <span className="ph-stat-label">Not Answered</span>
              <span className="ph-stat-value">{notAnsweredCount}</span>
            </div>
            <div className="ph-stat-box gray">
              <span className="ph-stat-label">Not Visited</span>
              <span className="ph-stat-value">{notVisitedCount}</span>
            </div>
            <div className="ph-stat-box blue">
              <span className="ph-stat-label">Total Questions</span>
              <span className="ph-stat-value">{questions.length}</span>
            </div>
          </div>

        </div>

        {/* scrollable body */}
        <div className="ph-sidebar-body">

          {/* legend */}
          <div className="ph-legend">
            {[
              { dot: "#16a34a", label: "Answered"    },
              { dot: "#dc2626", label: "Not Answered" },
              { dot: "#9333ea", label: "Marked"       },
              { dot: "#7c3aed", label: "Marked+Ans"   },
              { dot: "#94a3b8", label: "Not Visited"  },
            ].map(({ dot, label }) => (
              <div key={label} className="ph-legend-item">
                <div className="ph-legend-dot" style={{ background: dot }} />
                <span>{label}</span>
              </div>
            ))}
          </div>

          <div className="ph-section-title">📋 Question Palette</div>

          {/* palette */}
          <div className="ph-palette-grid">
            {questions.map((q, index) => {
              const answered  = answers[q.id]  !== undefined;
              const marked    = review[q.id];
              const isVisited = visited[q.id];

              let cls = "ph-palette-btn";

              if      (marked && answered) cls += " ph-marked-answer";
              else if (marked)             cls += " ph-marked";
              else if (answered)           cls += " ph-answered";
              else if (isVisited)          cls += " ph-notanswered";
              else                         cls += " ph-notvisited";

              if (currentQuestion === index) cls += " ph-current";

              return (
                <button
                  key={q.id}
                  className={cls}
                  onClick={() => {
                    setCurrentQuestion(index);
                    setVisited(prev => ({ ...prev, [q.id]: true }));
                    setSidebarOpen(false);
                  }}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>

        </div>

        {/* footer actions */}
        <div className="ph-sidebar-footer">

          {/* Row: Question Paper + Instructions side by side */}
          <div className="ph-sidebar-footer-row">
            <button
              className="ph-footer-btn paper"
              onClick={() => setSidebarOpen(false)}
            >
              📄 Question Paper
            </button>
            <button
              className="ph-footer-btn instructions"
              onClick={() => setSidebarOpen(false)}
            >
              ℹ️ Instructions
            </button>
          </div>

          {/* Full-width Submit */}
          <button
            className="ph-footer-btn submit"
            onClick={() => {
              setSidebarOpen(false);
              submitExam(false);
            }}
          >
            ✅ Submit Test
          </button>

        </div>

      </div>

    </div>
  );
}
