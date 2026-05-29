import useExamEngine
from "../hooks/useExamEngine";

export default function ExamPageDesktop() {

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
      <div className="page">
        <h2>Loading Exam...</h2>
      </div>
    );

  }

  if (!currentQ) {

    return (
      <div className="page">
        <h2>No Questions Found!</h2>
      </div>
    );

  }

  return (

    <div className="exam-layout">

      {/* LEFT */}

      <div className="exam-main">

        <div className="topbar">

          <div>

            <h2>
              {examData?.name}
            </h2>

            <p>
              {examData?.mockType || "Full"}
            </p>

          </div>

       <div className="topbar-right">

            <h2>
              ⏳ {formatTime(timeLeft)}
            </h2>

            <p>
              Warnings:
              {" "}
              {cheatCount}/3
            </p>

          </div>

        </div>

        <div className="question-card">

         <div className="question-header-row">

  <div className="question-number-box">
    Q.{currentQuestion + 1}
  </div>

  <div
    className="question-text-main"
    dangerouslySetInnerHTML={{
      __html: currentQ.question || currentQ.text || "",
    }}
  />

</div>

       
          <div className="options-list">

            {(currentQ.options || []).map(
              (option, idx) => (

                <label
                  key={idx}
                  className={
                    selectedOpt === idx
                    ? "selected-option"
                    : "option-card"
                  }
                >

                  <input
                    type="radio"
                    className="option-radio"
                    checked={
                      selectedOpt === idx
                    }
                    onChange={() =>
                      selectOption(idx)
                    }
                  />

                 <div className="option-text">

  <div className="option-label-box">
    {String.fromCharCode(65 + idx)}.
  </div>

  <div className="option-value">
    {option}
  </div>

</div>

                </label>

              )
            )}

          </div>

          <div className="exam-buttons">

            <button onClick={handlePrev}>
              Previous
            </button>

            <button onClick={toggleReview}>
              Mark Review
            </button>

            <button onClick={toggleBookmark}>
              Bookmark
            </button>

            <button onClick={clearResponse}>
              Clear Response
            </button>

            <button onClick={handleNext}>
              Save & Next
            </button>

            <button
              className="submit-btn"
              onClick={() =>
                submitExam(false)
              }
            >
              Submit
            </button>

          </div>

        </div>

      </div>

      {/* RIGHT */}

      <div className="navigator">

        <h2 className="palette-title">
          Questions
        </h2>

        <div className="exam-legend">

          <div className="exam-legend-item">
            <div className="exam-legend-badge legend-answered">
              {Object.keys(answers).length}
            </div>
            <span>Answered</span>
          </div>

          <div className="exam-legend-item">
            <div className="exam-legend-badge legend-marked">
              {
                Object.keys(review)
                  .filter(id => review[id])
                  .length
              }
            </div>
            <span>Marked</span>
          </div>

          <div className="exam-legend-item">
            <div className="exam-legend-badge legend-notanswered">
              {
                questions.filter(
                  q =>
                    visited[q.id] &&
                    answers[q.id] === undefined
                ).length
              }
            </div>
            <span>Not Answered</span>
          </div>

          <div className="exam-legend-item">
            <div className="exam-legend-badge legend-notvisited">
              {
                questions.filter(
                  q => !visited[q.id]
                ).length
              }
            </div>
            <span>Not Visited</span>
          </div>

        </div>

        <div className="palette-grid">

          {questions.map((q, index) => {

            let btnClass =
              "palette-btn";

            const answered =
              answers[q.id] !== undefined;

            const marked =
              review[q.id];

            const isVisited =
              visited[q.id];

            if (marked && answered) {

              btnClass +=
                " marked-answered";

            }
            else if (marked) {

              btnClass +=
                " marked";

            }
            else if (answered) {

              btnClass +=
                " answered";

            }
            else if (isVisited) {

              btnClass +=
                " not-answered";

            }
            else {

              btnClass +=
                " not-visited";

            }

            if (
              currentQuestion === index
            ) {

              btnClass +=
                " current";

            }

            return (

              <button
                key={q.id}
                className={btnClass}
                onClick={() => {

                  setCurrentQuestion(index);

                  setVisited(prev => ({
                    ...prev,
                    [q.id]: true,
                  }));

                }}
              >
                {index + 1}
              </button>

            );

          })}

        </div>

      </div>

    </div>

  );

}
