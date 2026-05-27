import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  useState,
} from "react";

import TopNavbar from "../components/TopNavbar";

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
  const current = questions[currentQuestion];
  const userAnswer = result.answers?.[current?.id];

  const map = { A: 0, B: 1, C: 2, D: 3 };

  let correctIndex = 0;
  if (typeof current?.correctAnswer === "number") {
    correctIndex = current.correctAnswer;
  } else if (typeof current?.correctAnswer === "string") {
    correctIndex = map[current.correctAnswer?.trim()?.toUpperCase()] ?? 0;
  } else {
    correctIndex = map[current?.answer] || 0;
  }

  const isCorrect = userAnswer === correctIndex;

  function getQuestionStatus(q) {
    const ans = result.answers?.[q.id];
    if (ans === undefined) return "unanswered";
    
    let cIndex = 0;
    if (typeof q.correctAnswer === "number") cIndex = q.correctAnswer;
    else if (typeof q.correctAnswer === "string") cIndex = map[q.correctAnswer?.trim()?.toUpperCase()] ?? 0;
    else cIndex = map[q.answer] || 0;

    return ans === cIndex ? "correct" : "wrong";
  }

  return (
    <div className="page">
      <TopNavbar />

      <div className="result-container">
        <h2 className="result-title">Exam Analytics Dashboard</h2>

        <div className="stats-grid">
          {/* 1. Added Total Marks Obtained Tile */}
          <div className="stat-card score-card">
            <div className="stat-icon">🎯</div>
            <div className="stat-info">
              <h3>Total Marks</h3>
              <p className="stat-value">
                {result.score ?? 0} / {result.totalMarks || (questions.length * 4)}
              </p>
            </div>
          </div>

          <div className="stat-card time-card">
            <div className="stat-icon">⏱️</div>
            <div className="stat-info">
              <h3>Time Taken</h3>
              <p className="stat-value">{formatTime(result.timeTaken)}</p>
            </div>
          </div>

          <div className="stat-card accuracy-card">
            <div className="stat-icon">📈</div>
            <div className="stat-info">
              <h3>Accuracy Rate</h3>
              <p className="stat-value">{result.accuracy ?? 0}%</p>
            </div>
          </div>

          <div className="stat-card status-card">
            <div className="stat-icon">🏆</div>
            <div className="stat-info">
              <h3>Performance</h3>
              {/* 2. Fixed spacing layout issue between 'than' and '83%' */}
              <p className="stat-value status-pass">Better than 83%</p>
            </div>
          </div>
        </div>

        <div className="review-layout">
          <div className="review-main">
            <div className="review-question-card">
              <span className={`question-status-badge ${getQuestionStatus(current)}`}>
                {getQuestionStatus(current).toUpperCase()}
              </span>

              <h3 className="review-question-text">
                Q{currentQuestion + 1}. {current?.text || current?.question}
              </h3>

              <div className="review-options-list">
                {(current?.options || []).map((option, idx) => {
                  let optClass = "review-option-item";
                  if (idx === correctIndex) optClass += " option-correct-answer";
                  if (userAnswer === idx && !isCorrect) optClass += " option-wrong-answer";

                  return (
                    <div key={idx} className={optClass}>
                      <span className="option-letter">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="option-text">{option}</span>
                    </div>
                  );
                })}
              </div>

              {current?.explanation && (
                <div className="explanation-box">
                  <h4>Explanation:</h4>
                  <p>{current.explanation}</p>
                </div>
              )}
            </div>

            <div className="review-navigation">
              <button
                className="review-nav-btn"
                disabled={currentQuestion === 0}
                onClick={() => setCurrentQuestion(prev => prev - 1)}
              >
                ← Previous
              </button>

              <div className="review-question-count">
                {currentQuestion + 1} / {questions.length}
              </div>

              <button
                className="review-nav-btn"
                disabled={currentQuestion === questions.length - 1}
                onClick={() => setCurrentQuestion(prev => prev + 1)}
              >
                Next →
              </button>
            </div>
          </div>

          <div className="review-sidebar">
            <h3>Questions</h3>

            <div className="review-legend">
              <div className="review-legend-item">
                <div className="review-dot review-palette-correct"></div>
                Correct
              </div>
              <div className="review-legend-item">
                <div className="review-dot review-palette-wrong"></div>
                Incorrect
              </div>
              <div className="review-legend-item">
                <div className="review-dot review-palette-unanswered"></div>
                Unanswered
              </div>
            </div>

            <div className="review-palette">
              {questions.map((q, index) => {
                const status = getQuestionStatus(q);
                let btnClass = "review-palette-btn " + status;
                if (currentQuestion === index) btnClass += " active";

                return (
                  <button
                    key={q.id}
                    className={btnClass}
                    onClick={() => setCurrentQuestion(index)}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
