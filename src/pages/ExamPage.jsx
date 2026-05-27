import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { collection, getDocs, addDoc, doc, getDoc } from "firebase/firestore";
import { db, auth } from "../firebase/config";

export default function ExamPage() {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [examData, setExamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [visited, setVisited] = useState({});
  const [review, setReview] = useState({});
  const [timeLeft, setTimeLeft] = useState(1800);
  const [cheatCount, setCheatCount] = useState(0);

  /* =========================================
     FULLSCREEN MANAGEMENT
  ========================================= */
  useEffect(() => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(() => {});
    }
  }, []);

  /* =========================================
     CHEATING DETECTION (VISIBILITY CHANGE)
  ========================================= */
  useEffect(() => {
    function handleVisibility() {
      if (document.hidden) {
        setCheatCount((prev) => {
          const next = prev + 1;
          if (next >= 3) {
            alert("Exam auto-submitted due to multiple window switches.");
            handleSubmitExam();
          } else {
            alert(`Warning! Tab switching is tracked. (${next}/3)`);
          }
          return next;
        });
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [questions, answers]);

  /* =========================================
     FETCH DATA
  ========================================= */
  useEffect(() => {
    async function loadExam() {
      try {
        const examRef = doc(db, "exams", examId);
        const examSnap = await getDoc(examRef);
        if (examSnap.exists()) {
          setExamData(examSnap.data());
          if (examSnap.data().duration) {
            setTimeLeft(examSnap.data().duration * 60);
          }
        }

        const qRef = collection(db, "exams", examId, "questions");
        const qSnap = await getDocs(qRef);
        const list = qSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setQuestions(list);

        if (list.length > 0) {
          setVisited({ [list[0].id]: true });
        }
      } catch (err) {
        console.error("Error loading exam:", err);
      } finally {
        setLoading(false);
      }
    }
    loadExam();
  }, [examId]);

  /* =========================================
     TIMER LOGIC
  ========================================= */
  useEffect(() => {
    if (loading || questions.length === 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, questions]);

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  /* =========================================
     SUBMIT EXAM
  ========================================= */
  async function handleSubmitExam() {
    try {
      const user = auth.currentUser;
      const submission = {
        examId,
        examTitle: examData?.title || "Exam",
        userId: user ? user.uid : "anonymous",
        userEmail: user ? user.email : "anonymous@test.com",
        answers,
        questions,
        cheatCount,
        submittedAt: new Date().toISOString(),
      };

      await addDoc(collection(db, "submissions"), submission);
      navigate("/result", { state: submission });
    } catch (err) {
      console.error("Submission failed: ", err);
      alert("Failed to submit exam cleanly. Please try again.");
    }
  }

  /* =========================================
     CONTROL ACTIONS
  ========================================= */
  function handleOptionSelect(optionIndex) {
    const activeQ = questions[currentQuestion];
    setAnswers((prev) => ({ ...prev, [activeQ.id]: optionIndex }));
  }

  function handleClearAnswer() {
    const activeQ = questions[currentQuestion];
    setAnswers((prev) => {
      const copy = { ...prev };
      delete copy[activeQ.id];
      return copy;
    });
  }

  function handleToggleReview() {
    const activeQ = questions[currentQuestion];
    setReview((prev) => ({ ...prev, [activeQ.id]: !prev[activeQ.id] }));
  }

  function handleNext() {
    if (currentQuestion < questions.length - 1) {
      const nextIndex = currentQuestion + 1;
      setCurrentQuestion(nextIndex);
      setVisited((prev) => ({ ...prev, [questions[nextIndex].id]: true }));
    }
  }

  function handlePrev() {
    if (currentQuestion > 0) {
      const prevIndex = currentQuestion - 1;
      setCurrentQuestion(prevIndex);
      setVisited((prev) => ({ ...prev, [questions[prevIndex].id]: true }));
    }
  }

  if (loading) {
    return (
      <div className="page" style={{ textAlign: "center", paddingTop: "100px" }}>
        <h2>Loading Exam Questions...</h2>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="page" style={{ textAlign: "center", paddingTop: "100px" }}>
        <h2>No questions discovered for this exam challenge.</h2>
      </div>
    );
  }

  const activeQuestionItem = questions[currentQuestion];

  return (
    <div className="page">
      <div className="exam-container">
        
        {/* LEFT SECTION: QUESTION PANEL */}
        <div className="question-panel">
          <div className="question-header">
            <h3>Question {currentQuestion + 1} of {questions.length}</h3>
            {activeQuestionItem.marks && (
              <span>Marks: +{activeQuestionItem.marks}</span>
            )}
          </div>

          <div className="question-body">
            <p>{activeQuestionItem.questionText}</p>
          </div>

          <div className="options-list">
            {activeQuestionItem.options?.map((option, idx) => {
              const isSelected = answers[activeQuestionItem.id] === idx;
              return (
                <label 
                  key={idx} 
                  className={`option-item ${isSelected ? "selected" : ""}`}
                >
                  <input
                    type="radio"
                    name={`question_${activeQuestionItem.id}`}
                    checked={isSelected}
                    onChange={() => handleOptionSelect(idx)}
                  />
                  <span>{option}</span>
                </label>
              );
            })}
          </div>

          <div className="exam-actions">
            <div className="nav-btn-group">
              <button 
                className="exam-btn" 
                onClick={handlePrev} 
                disabled={currentQuestion === 0}
              >
                Previous
              </button>
              <button 
                className="exam-btn" 
                onClick={handleNext} 
                disabled={currentQuestion === questions.length - 1}
              >
                Next
              </button>
            </div>

            <div className="nav-btn-group">
              <button className="exam-btn warning" onClick={handleToggleReview}>
                {review[activeQuestionItem.id] ? "Unmark Review" : "Mark for Review"}
              </button>
              <button className="exam-btn" onClick={handleClearAnswer}>
                Clear Response
              </button>
              <button className="exam-btn success" onClick={handleSubmitExam}>
                Submit Exam
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT SECTION: SIDEBAR PALETTE */}
        <div className="exam-sidebar">
          <div className="sidebar-header">
            <span>Time Left</span>
            <span className="timer-display">{formatTime(timeLeft)}</span>
          </div>

          <div className="palette-grid">
            {questions.map((q, index) => {
              let btnClass = "palette-btn";
              const answered = answers[q.id] !== undefined;
              const marked = review[q.id];
              const isVisited = visited[q.id];

              if (marked && answered) {
                btnClass += " marked-answered";
              } else if (marked) {
                btnClass += " marked";
              } else if (answered) {
                btnClass += " answered";
              } else if (isVisited) {
                btnClass += " not-answered";
              } else {
                btnClass += " not-visited";
              }

              if (currentQuestion === index) {
                btnClass += " current";
              }

              return (
                <button
                  key={q.id}
                  className={btnClass}
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
        </div>

      </div>
    </div>
  );
}
