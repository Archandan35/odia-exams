import { useState } from "react";
import useExamEngine from "../hooks/useExamEngine";

export default function ExamPagePhone() {

  const [sidebarOpen, setSidebarOpen] = useState(false);

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
  } = useExamEngine();

  if (loading) {
    return <div className="ph-loading">Loading Exam...</div>;
  }

  if (!currentQ) {
    return <div className="ph-loading">No Questions Found</div>;
  }

  /* ---- Palette counts ---- */
  const answeredCount   = Object.keys(answers).length;
  const markedCount     = Object.keys(review).filter(id => review[id]).length;
  const notAnsweredCount = questions.filter(
    q => visited[q.id] && answers[q.id] === undefined
  ).length;
  const notVisitedCount  = questions.filter(q => !visited[q.id]).length;

  /* ---- Timer colour ---- */
  const timerWarning = timeLeft < 300; // last 5 min

  return (
    <div className="ph-layout">

      {/* ── HEADER ── */}
      <div className="ph-header">
        <div className="ph-title-wrap">
          <div className="ph-title">{examData?.name || "Exam"}</div>
          <div className="ph-subtitle">{examData?.mockType || "Mock Test"}</div>
        </div>
        <div
          className="ph-timer"
          style={timerWarning ? { color: "#f87171", borderColor: "#ef4444" } : {}}
        >
          {formatTime(timeLeft)}
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

      {/* ── NAV FOOTER ── */}
      <div className="ph-nav-footer">

        <button className="ph-nav-btn ph-btn-prev" onClick={handlePrev}>
          ← Prev
        </button>

        <button
          className="ph-nav-btn ph-btn-menu"
          onClick={() => setSidebarOpen(true)}
        >
          ☰
        </button>

        <button className="ph-nav-btn ph-btn-next" onClick={handleNext}>
          Save &amp; Next →
        </button>

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
            <div className="ph-stat-box blue">
              <span className="ph-stat-label">Current Q</span>
              <span className="ph-stat-value">{currentQuestion + 1}</span>
            </div>
            <div className="ph-stat-box green">
              <span className="ph-stat-label">Answered</span>
              <span className="ph-stat-value">{answeredCount}</span>
            </div>
            <div className="ph-stat-box yellow">
              <span className="ph-stat-label">Marked</span>
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
              <span className="ph-stat-label">Total Qs</span>
              <span className="ph-stat-value">{questions.length}</span>
            </div>
          </div>

        </div>

        {/* scrollable body */}
        <div className="ph-sidebar-body">

          {/* legend */}
          <div className="ph-legend">
            {[
              { cls: "ph-answered",     dot: "#16a34a", label: "Answered"      },
              { cls: "ph-notanswered",  dot: "#dc2626", label: "Not Answered"  },
              { cls: "ph-marked",       dot: "#9333ea", label: "Marked"        },
              { cls: "ph-marked-answer",dot: "#7c3aed", label: "Marked+Ans"   },
              { cls: "ph-notvisited",   dot: "#94a3b8", label: "Not Visited"   },
            ].map(({ dot, label }) => (
              <div key={label} className="ph-legend-item">
                <div
                  className="ph-legend-dot"
                  style={{ background: dot }}
                />
                <span>{label}</span>
              </div>
            ))}
          </div>

          <div className="ph-section-title">Question Palette</div>

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
