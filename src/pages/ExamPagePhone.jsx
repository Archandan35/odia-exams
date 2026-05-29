import { useState } from "react";
import useExamEngine from "../hooks/useExamEngine";

export default function ExamPagePhone() {

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

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

    setVisited

  } = useExamEngine();

  if (loading) {

    return (
      <div className="ph-loading">
        Loading Exam...
      </div>
    );

  }

  if (!currentQ) {

    return (
      <div className="ph-loading">
        No Questions Found
      </div>
    );

  }

  return (

    <div className="ph-layout">

      {/* HEADER */}

      <div className="ph-header">

        <div className="ph-title-wrap">

          <div className="ph-title">
            {examData?.name}
          </div>

          <div className="ph-subtitle">
            {examData?.mockType || "Mock Test"}
          </div>

        </div>

        <div className="ph-timer">

          {formatTime(timeLeft)}

        </div>

      </div>

      {/* QUESTION AREA */}

      <div className="ph-content">

        <div className="ph-question-card">

          <div className="ph-question-top">

            <div className="ph-question-no">
              {currentQuestion + 1}
            </div>

            <div
              className="ph-question-text"
              dangerouslySetInnerHTML={{
                __html:
                  currentQ.question ||
                  currentQ.text ||
                  ""
              }}
            />

          </div>

          <div className="ph-options">

            {(currentQ.options || []).map(
              (option, idx) => (

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
                    checked={
                      selectedOpt === idx
                    }
                    onChange={() =>
                      selectOption(idx)
                    }
                  />

                  <span className="ph-option-letter">

                    {String.fromCharCode(
                      65 + idx
                    )}

                  </span>

                  <span className="ph-option-text">

                    {option}

                  </span>

                </label>

              )
            )}

          </div>

        </div>

      </div>

      {/* FLOATING MENU BUTTON */}

      <button
        className="ph-menu-btn"
        onClick={() =>
          setSidebarOpen(
            !sidebarOpen
          )
        }
      >
        ☰
      </button>

      {/* SIDEBAR */}

      <div
        className={
           sidebarOpen
           ? "ph-sidebar open"
           : "ph-sidebar"
          }
      >

        <div className="ph-sidebar-header">

          <h3>
            Questions
          </h3>

          <button
            className="ph-close-btn"
            onClick={() =>
              setSidebarOpen(false)
            }
          >
            ✕
          </button>

        </div>

        <div className="ph-legend">

          <div>

            Answered:
            {" "}
            {
              Object.keys(
                answers
              ).length
            }

          </div>

          <div>

            Marked:
            {" "}
            {
              Object.keys(review)
                .filter(
                  id => review[id]
                )
                .length
            }

          </div>

        </div>

        <div className="ph-palette-grid">

          {questions.map(
            (q, index) => {

              let cls =
                "ph-palette-btn";

              const answered =
                answers[q.id] !==
                undefined;

              const marked =
                review[q.id];

              const isVisited =
                visited[q.id];

              if (
                marked &&
                answered
              ) {

                cls +=
                  " ph-marked-answer";

              }
              else if (
                marked
              ) {

                cls +=
                  " ph-marked";

              }
              else if (
                answered
              ) {

                cls +=
                  " ph-answered";

              }
              else if (
                isVisited
              ) {

                cls +=
                  " ph-notanswered";

              }
              else {

                cls +=
                  " ph-notvisited";

              }

              if (
                currentQuestion ===
                index
              ) {

                cls +=
                  " ph-current";

              }

              return (

                <button
                  key={q.id}
                  className={cls}
                  onClick={() => {

                    setCurrentQuestion(
                      index
                    );

                    setVisited(
                      prev => ({
                        ...prev,
                        [q.id]: true
                      })
                    );

                    setSidebarOpen(
                      false
                    );

                  }}
                >
                  {index + 1}
                </button>

              );

            }
          )}

        </div>

      </div>

      {/* MOBILE ACTIONS */}

<div className="ph-actions">

  <button onClick={toggleReview}>
    Review
  </button>

  <button onClick={clearResponse}>
    Clear Response
  </button>

  <button onClick={toggleBookmark}>
    Bookmark
  </button>

  <button onClick={handlePrev}>
    Prev
  </button>

  <button onClick={handleNext}>
    Save & Next
  </button>

  <button
    className="submit-btn"
    onClick={() => submitExam(false)}
  >
    Submit
  </button>

</div>
