import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import TopNavbar from "../components/TopNavbar";

// Move answer mapping config outside or at top to prevent hosting/reference bugs
const ANSWER_MAP = {
  A: 0,
  B: 1,
  C: 2,
  D: 3,
};

export default function ResultPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const result = location.state;

  const [currentQuestion, setCurrentQuestion] = useState(0);

  if (!result) {
    return (
      <div className="page">
        <h2>No Result Found</h2>
      </div>
    );
  }

  function formatTime(sec) {
    if (!sec) return "00m 00s";
    const mins = Math.floor(sec / 60);
    const seconds = sec % 60;
    return `${String(mins).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
  }

  const questions = result.questions || [];
  const totalQuestions = questions.length;
  const marksPerQuestion = 1;
  const negativeMark = 0.25;

  let correctCount = 0;
  let wrongCount = 0;

  // Calculate scores
  questions.forEach((q) => {
    const userAns = result.answers?.[q.id];
    if (userAns === undefined) return;

    let cIndex = 0;
    if (typeof q.correctAnswer === "number") {
      cIndex = q.correctAnswer;
    } else if (typeof q.correctAnswer === "string") {
      cIndex = ANSWER_MAP[q.correctAnswer?.trim()?.toUpperCase()] ?? 0;
    }

    if (userAns === cIndex) {
      correctCount++;
    } else {
      wrongCount++;
    }
  });

  const obtainedMarks = (correctCount * marksPerQuestion - wrongCount * negativeMark).toFixed(2);
  const totalMarks = totalQuestions * marksPerQuestion;

  // Current Question Logic
  const current = questions[currentQuestion];
  const userAnswer = result.answers?.[current?.id];

  let correctIndex = 0;
  if (typeof current?.correctAnswer === "number") {
    correctIndex = current.correctAnswer;
  } else if (typeof current?.correctAnswer === "string") {
    correctIndex = ANSWER_MAP[current.correctAnswer?.trim()?.toUpperCase()] ?? 0;
  } else {
    correctIndex = ANSWER_MAP[current?.answer] || 0;
  }

  const isCorrect = userAnswer === correctIndex;
  const answerLetter = userAnswer !== undefined ? String.fromCharCode(65 + userAnswer) : "Not-Ans";
  const correctLetter = String.fromCharCode(65 + correctIndex);

  // Mocking analytics data per question (Will randomize on every component render)
  const questionAccuracy = Math.floor(Math.random() * 25) + 70;
  const topperTime = Math.floor(Math.random() * 10) + 5;
  const userTime = Math.floor(Math.random() * 25) + 8;
  const performance = Math.floor(Math.random() * 30) + 70;

  const speedStatus =
    userTime <= topperTime + 3
      ? "Fast"
      : userTime <= topperTime + 10
      ? "Average"
      : "Slow";

  function getQuestionStatus(q) {
    const answer = result.answers?.[q.id];
    const isMarked = result.marked?.[q.id] || result.markedForReview?.[q.id] || false;
    const isVisited = result.visited?.[q.id] || answer !== undefined || isMarked;

    let cIndex = 0;
    if (typeof q.correctAnswer === "number") {
      cIndex = q.correctAnswer;
    } else if (typeof q.correctAnswer === "string") {
      cIndex = ANSWER_MAP[q.correctAnswer?.trim()?.toUpperCase()] ?? 0;
    }

    if (!isVisited) return "not-visited";
    if (isMarked) return "review";
    if (answer === undefined) return "not-visited";
    if (answer === cIndex) return "correct";
    return "wrong";
  }

  return (
    <div className="page">
      <TopNavbar />

      <div className="review-topbar">
        <div>
          <h2>Exam Review</h2>
          <p>Detailed Performance Analysis</p>
        </div>
        <div className="review-actions">
          <button onClick={() => navigate("/analysis", { state: result })}>
            Analysis
          </button>
          <button
            className="submit-btn"
            onClick={() => navigate(`/exam/${result.examId}`)}
          >
            Re-attempt
          </button>
          <button onClick={() => navigate("/dashboard")}>
            Dashboard
          </button>
        </div>
      </div>

      <div className="review-analytics-strip">
        <div className="analytics-mini-card">
          <span>Marks</span>
          <h3>{obtainedMarks} / {totalMarks}</h3>
        </div>

        <div className="analytics-mini-card">
          <span>Time Taken</span>
          <h3>{formatTime(userTime)}</h3>
        </div>

        <div className="analytics-mini-card">
          <span>Topper Avg</span>
          <h3>{formatTime(topperTime)}</h3>
        </div>

        <div className="analytics-mini-card">
          <span>Your Speed</span>
          <h3 className={
            speedStatus === "Fast"
              ? "speed-fast"
              : speedStatus === "Average"
              ? "speed-average"
              : "speed-slow"
          }>
            {speedStatus}
          </h3>
        </div>

        <div className="analytics-mini-card">
          <span>Status</span>
          <h3 className={
            isCorrect
              ? "status-correct"
              : userAnswer === undefined
              ? "status-unanswered"
              : "status-wrong"
          }>
            {userAnswer === undefined
              ? "Un-ans"
              : isCorrect
              ? "Correct"
              : "Incorrect"}
          </h3>
        </div>

        <div className="analytics-mini-card">
          <span>Correct Ans</span>
          <h3>{correctLetter}</h3>
        </div>

        <div className="analytics-mini-card">
          <span>Your Ans</span>
          <h3>{answerLetter}</h3>
        </div>

        <div className="analytics-mini-card">
          <span>Accuracy</span>
          <h3>{questionAccuracy}%</h3>
        </div>

        <div className="analytics-mini-card">
          <span>Level</span>
          <h3 className={
            current?.difficulty === "Easy"
              ? "level-easy"
              : current?.difficulty === "Medium"
              ? "level-medium"
              : "level-hard"
          }>
            {current?.difficulty || "Medium"}
          </h3>
        </div>

        <div className="analytics-mini-card">
          <span>Performance</span>
          <h3>Top {100 - performance}%</h3>
        </div>
      </div>

      <div className="review-layout">
        <div className="review-main">
          <div className="review-question-card">
            <div className="review-question-header">
              <div className="review-question-badge">
                Q.{currentQuestion + 1}
              </div>
              <div
                className="review-question-text"
                dangerouslySetInnerHTML={{ __html: current?.question || "" }}
              />
            </div>

            <div className="review-options">
              {current?.options?.map((op, i) => {
                const isUser = i === userAnswer;
                const isCorrectOption = i === correctIndex;

                return (
                  <div
                    key={i}
                    className={`review-option-card ${
                      isCorrectOption ? "review-correct" : ""
                    } ${isUser && !isCorrectOption ? "review-wrong" : ""} ${
                      isUser ? "review-selected" : ""
                    }`}
                  >
                    <div className="review-option-label">
                      {String.fromCharCode(65 + i)}.
                    </div>
                    <div className="review-option-text">
                      {op}
                    </div>
                  </div>
                );
              })}
            </div>

            {current?.explanation && (
              <div className="review-explanation">
                <h4>Explanation</h4>
                <p>{current.explanation}</p>
              </div>
            )}

            <div className="review-navigation">
              <button
                className="review-nav-btn"
                disabled={currentQuestion === 0}
                onClick={() => setCurrentQuestion((prev) => prev - 1)}
              >
                ← Previous
              </button>
              <div className="review-question-count">
                {currentQuestion + 1} / {questions.length}
              </div>
              <button
                className="review-nav-btn"
                disabled={currentQuestion === questions.length - 1}
                onClick={() => setCurrentQuestion((prev) => prev + 1)}
              >
                Next →
              </button>
            </div>
          </div>
        </div>

        <div className="review-sidebar">
          <h3>Questions</h3>
          <div className="review-legend">
            <div className="review-legend-item">
              <span className="review-legend-counter correct">
                {questions.filter(q => getQuestionStatus(q) === "correct").length}
              </span>
              Correct
            </div>
            <div className="review-legend-item">
              <span className="review-legend-counter wrong">
                {questions.filter(q => getQuestionStatus(q) === "wrong").length}
              </span>
              Wrong
            </div>
            <div className="review-legend-item">
              <span className="review-legend-counter answered">
                {questions.filter(q => { const s = getQuestionStatus(q); return s === "correct" || s === "wrong"; }).length}
              </span>
              Answered
            </div>
            <div className="review-legend-item">
              <span className="review-legend-counter review">
                {questions.filter(q => getQuestionStatus(q) === "review").length}
              </span>
              Review
            </div>
            <div className="review-legend-item">
              <span className="review-legend-counter not-visited">
                {questions.filter(q => getQuestionStatus(q) === "not-visited").length}
              </span>
              Not Visited
            </div>
          </div>

          <div className="review-palette">
            {questions.map((q, index) => {
              const status = getQuestionStatus(q);

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestion(index)}
                  className={`review-palette-btn ${
                    status === "correct" ? "review-palette-correct" : ""
                  } ${status === "wrong" ? "review-palette-wrong" : ""} ${
                    status === "review" ? "review-palette-review" : ""
                  } ${status === "not-visited" ? "review-palette-not-visited" : ""
                  } ${currentQuestion === index ? "review-current" : ""}`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
