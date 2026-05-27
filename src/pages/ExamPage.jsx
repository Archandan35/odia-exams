import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { db, auth } from "../firebase/config";

export default function ExamPage() {
  const { examId } = useParams();
  const navigate = useNavigate();

  const STORAGE_KEY = `exam_${examId}`;

  const [questions, setQuestions] = useState([]);
  const [examData, setExamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [visited, setVisited] = useState({});
  const [review, setReview] = useState({});
  const [bookmarks, setBookmarks] = useState({});
  const [timeLeft, setTimeLeft] = useState(1800);
  const [cheatCount, setCheatCount] = useState(0);

  /* =========================================
     FULLSCREEN
  ========================================= */
  useEffect(() => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(() => {});
    }
  }, []);

  /* =========================================
     CHEATING DETECTION
  ========================================= */
  useEffect(() => {
    function handleVisibility() {
      if (document.hidden) {
        setCheatCount((prev) => {
          const next = prev + 1;
          if (next >= 3) {
            alert("Exam auto-submitted due to cheating.");
            submitExam(true);
          } else {
            alert(`Warning ${next}/3 : Tab switching detected`);
          }
          return next;
        });
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  /* =========================================
     LOAD EXAM
  ========================================= */
  useEffect(() => {
    async function loadExam() {
      try {
        const examRef = doc(db, "exams", examId);
        const examSnap = await getDoc(examRef);

        if (!examSnap.exists()) {
          setQuestions([]);
          return;
        }

        const exam = examSnap.data();
        setExamData(exam);

        const questionIds = exam.questionIds || exam.questions || [];
        const qSnap = await getDocs(collection(db, "questions"));

        const allQuestions = qSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        const filteredQuestions = allQuestions.filter((q) =>
          questionIds.includes(q.id)
        );

        setQuestions(filteredQuestions);

        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setAnswers(parsed.answers || {});
          setReview(parsed.review || {});
          setVisited(parsed.visited || {});
          setBookmarks(parsed.bookmarks || {});
          setTimeLeft(parsed.timeLeft ?? 1800);
        }

        if (filteredQuestions.length > 0 && !saved) {
          setVisited({
            [filteredQuestions[0].id]: true,
          });
        }
      } catch (err) {
        console.log(err);
      } else {
        setLoading(false);
      }
    }
    loadExam();
  }, [examId]);

  /* =========================================
     AUTO SAVE
  ========================================= */
  useEffect(() => {
    if (loading || questions.length === 0) return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        answers,
        review,
        visited,
        bookmarks,
        timeLeft,
      })
    );
  }, [answers, review, visited, bookmarks, timeLeft, loading, questions]);

  /* =========================================
     TIMER
  ========================================= */
  useEffect(() => {
    if (loading) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          submitExam(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [loading]);

  function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function selectOption(index) {
    const qId = questions[currentQuestion].id;
    setAnswers((prev) => ({
      ...prev,
      [qId]: index,
    }));
  }

  function handleNext() {
    if (currentQuestion < questions.length - 1) {
      const next = currentQuestion + 1;
      setCurrentQuestion(next);
      setVisited((prev) => ({
        ...prev,
        [questions[next].id]: true,
      }));
    }
  }

  function handlePrev() {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    }
  }

  function clearResponse() {
    const qId = questions[currentQuestion].id;
    setAnswers((prev) => {
      const updated = { ...prev };
      delete updated[qId];
      return updated;
    });
  }

  function toggleReview() {
    const qId = questions[currentQuestion].id;
    setReview((prev) => ({
      ...prev,
      [qId]: !prev[qId],
    }));
  }

  /* =========================================
     SUBMIT
  ========================================= */
  async function submitExam(isAuto = false) {
    let score = 0;
    questions.forEach((q) => {
      const userAns = answers[q.id];
      const map = { A: 0, B: 1, C: 2, D: 3 };
      let correctIndex = 0;
      if (typeof q.correctAnswer === "number") {
        correctIndex = q.correctAnswer;
      } else {
        correctIndex = map[q.correctAnswer] ?? 0;
      }
      if (userAns === correctIndex) {
        score += 4;
      }
    };

    const resultData = {
      examId,
      score,
      totalMarks: questions.length * 4,
      answers,
      questions,
      submittedAt: new Date().toISOString(),
    };

    try {
      await addDoc(collection(db, "results"), {
        ...resultData,
        userId: auth.currentUser?.uid || "anonymous",
      });
      localStorage.removeItem(STORAGE_KEY);
      navigate("/results", { state: resultData });
    } catch (err) {
      console.log("Error submitting exam: ", err);
    }
  }

  if (loading) {
    return (
      <div className="page">
        <h2>Loading Exam...</h2>
      </div>
    );
  }

  const current = questions[currentQuestion];

  return (
    <div className="page">
      {/* Top Banner section */}
      <div className="review-topbar">
        <div>
          <h2>Active Examination Workspace</h2>
          <p>{examData?.title || "Evaluating Content"}</p>
        </div>
        <div className="exam-timer-wrapper">
          <span className="timer-label">Time Remaining:</span>
          <span className="timer-countdown">{formatTime(timeLeft)}</span>
        </div>
      </div>

      {/* Main Column Framework matching ResultPage layout exactly */}
      <div className="review-container">
        
        {/* Left Side: Work Area */}
        <div className="review-main">
          <div className="question-review-card">
            <div className="review-question-header">
              <span className="review-q-number">
                Question {currentQuestion + 1} of {questions.length}
              </span>
            </div>

            {current && (
              <div className="review-card-body">
                <p className="review-question-text">{current.questionText}</p>

                <div className="review-options">
                  {current.options?.map((opt, idx) => {
                    const isSelected = answers[current.id] === idx;
                    return (
                      <div
                        key={idx}
                        className={`review-option ${isSelected ? "exam-option-active" : ""}`}
                        onClick={() => selectOption(idx)}
                      >
                        <span className="option-index-badge">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="option-text-content">{opt}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Core Controls */}
          <div className="review-navigation">
            <button
              className="review-nav-btn"
              disabled={currentQuestion === 0}
              onClick={handlePrev}
            >
              ← Previous
            </button>

            <div className="exam-action-mid-group">
              <button className="review-nav-btn alt-action" onClick={clearResponse}>
                Clear Response
              </button>
              <button className="review-nav-btn alt-action" onClick={toggleReview}>
                {review[current?.id] ? "Unmark Review" : "Mark for Review"}
              </button>
            </div>

            <button
              className="review-nav-btn"
              disabled={currentQuestion === questions.length - 1}
              onClick={handleNext}
            >
              Next →
            </button>
          </div>
        </div>

        {/* Right Side Sticky Panel */}
        <div className="review-sidebar">
          <h3>Question Palette</h3>

          <div className="review-legend">
            <div className="review-legend-item">
              <div className="review-dot status-palette-answered"></div>
              Answered
            </div>
            <div className="review-legend-item">
              <div className="review-dot status-palette-marked"></div>
              Marked
            </div>
            <div className="review-legend-item">
              <div className="review-dot status-palette-unanswered"></div>
              Unanswered
            </div>
          </div>

          <div className="review-palette">
            {questions.map((q, index) => {
              let statusClass = "";
              const answered = answers[q.id] !== undefined;
              const marked = review[q.id];
              const isVisited = visited[q.id];

              if (marked && answered) statusClass = "marked-answered";
              else if (marked) statusClass = "marked";
              else if (answered) statusClass = "answered";
              else if (isVisited) statusClass = "not-answered";
              else statusClass = "not-visited";

              if (currentQuestion === index) statusClass += " current";

              return (
                <button
                  key={q.id}
                  className={`palette-cell ${statusClass}`}
                  onClick={() => {
                    setCurrentQuestion(index);
                    setVisited((prev) => ({ ...prev, [q.id]: true }));
                  }}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>

          <div className="submit-action-container">
            <button className="generate-btn danger-submit" onClick={() => submitExam(false)}>
              Submit Examination
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
