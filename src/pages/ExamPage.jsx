import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { db, auth } from "../firebase/config";

export default function ExamPage() {
  const { examId } = useParams();
  const navigate = useNavigate();

  const STORAGE_KEY = `exam_${examId}`;

  const [questions, setQuestions] = useState([]);
  const [examData, setExamData]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers]     = useState({});
  const [visited, setVisited]     = useState({});
  const [review, setReview]       = useState({});
  const [bookmarks, setBookmarks] = useState({});
  const [timeLeft, setTimeLeft]   = useState(1800);
  const [cheatCount, setCheatCount] = useState(0);

  /* =========================================
     FULLSCREEN
  ========================================= */
  useEffect(() => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch((err) => console.log("Fullscreen error:", err));
    }
  }, []);

  /* =========================================
     CHEAT DETECTION
  ========================================= */
  useEffect(() => {
    function handleVisibility() {
      if (document.hidden) {
        handleCheating("Tab Switch Detected");
      }
    }
    function handleBlur() {
      handleCheating("Window Focus Lost");
    }
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleBlur);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleBlur);
    };
  }, [cheatCount]);

  function handleCheating(reason) {
    setCheatCount(prev => {
      const next = prev + 1;
      alert(`Warning ${next}/3: ${reason}. Switching tabs or exiting full screen is strictly monitored!`);
      if (next >= 3) {
        alert("Exam auto-submitted due to multiple cheating infractions.");
        submitExam(true);
      }
      return next;
    });
  }

  /* =========================================
     FETCH DATA & RESTORE STATE
  ========================================= */
  useEffect(() => {
    async function loadExam() {
      try {
        const qSnap = await getDocs(collection(db, `exams/${examId}/questions`));
        const list = qSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setQuestions(list);

        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setAnswers(parsed.answers || {});
          setReview(parsed.review || {});
          setVisited(parsed.visited || {});
          setBookmarks(parsed.bookmarks || {});
          setTimeLeft(parsed.timeLeft ?? 1800);
          setCheatCount(parsed.cheatCount || 0);
        }
        
        if (list.length > 0 && !saved) {
          setVisited({ [list[0].id]: true });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadExam();
  }, [examId]);

  /* =========================================
     AUTO SAVE TO LOCALSTORAGE
  ========================================= */
  useEffect(() => {
    if (loading || questions.length === 0) return;
    const stateObj = { answers, review, visited, bookmarks, timeLeft, cheatCount };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateObj));
  }, [answers, review, visited, bookmarks, timeLeft, cheatCount, loading, questions]);

  /* =========================================
     TIMER
  ========================================= */
  useEffect(() => {
    if (loading) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
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

  /* =========================================
     NAVIGATION ACTIONS
  ========================================= */
  function markVisited(idx) {
    if (questions[idx]) {
      setVisited(prev => ({ ...prev, [questions[idx].id]: true }));
    }
  }

  function handleNext() {
    if (currentQuestion < questions.length - 1) {
      const nextIdx = currentQuestion + 1;
      setCurrentQuestion(nextIdx);
      markVisited(nextIdx);
    }
  }

  function handlePrev() {
    if (currentQuestion > 0) {
      const prevIdx = currentQuestion - 1;
      setCurrentQuestion(prevIdx);
      markVisited(prevIdx);
    }
  }

  function selectOption(optIndex) {
    const qId = questions[currentQuestion].id;
    setAnswers(prev => ({ ...prev, [qId]: optIndex }));
  }

  function clearResponse() {
    const qId = questions[currentQuestion].id;
    setAnswers(prev => {
      const updated = { ...prev };
      delete updated[qId];
      return updated;
    });
  }

  function toggleMarkForReview() {
    const qId = questions[currentQuestion].id;
    setReview(prev => ({ ...prev, [qId]: !prev[qId] }));
  }

  function toggleBookmark() {
    const qId = questions[currentQuestion].id;
    setBookmarks(prev => ({ ...prev, [qId]: !prev[qId] }));
  }

  /* =========================================
     SUBMIT EXAM
  ========================================= */
  async function submitExam(isAuto = false) {
    if (!isAuto) {
      const confirmSub = window.confirm("Are you sure you want to finish and submit your exam?");
      if (!confirmSub) return;
    }

    let score = 0;
    questions.forEach(q => {
      const uAns = answers[q.id];
      if (uAns !== undefined) {
        const map = { A: 0, B: 1, C: 2, D: 3 };
        let cIndex = 0;
        if (typeof q.correctAnswer === "number") cIndex = q.correctAnswer;
        else if (typeof q.correctAnswer === "string") cIndex = map[q.correctAnswer.trim().toUpperCase()] ?? 0;
        else cIndex = map[q.answer] || 0;

        if (uAns === cIndex) {
          score += 4; // Assuming standard 4 marks per correct response
        }
      }
    });

    const totalMarksMax = questions.length * 4;
    const answeredCount = Object.keys(answers).length;
    const accuracy = answeredCount > 0 ? Math.round((score / (answeredCount * 4)) * 100) : 0;
    const timeTakenSec = 1800 - timeLeft;

    const finalResult = {
      examId,
      score,
      totalMarks: totalMarksMax,
      timeTaken: timeTakenSec,
      accuracy,
      answers,
      questions,
      submittedAt: new Date().toISOString(),
    };

    try {
      const user = auth.currentUser;
      await addDoc(collection(db, "results"), {
        ...finalResult,
        userId: user ? user.uid : "anonymous",
      });
      localStorage.removeItem(STORAGE_KEY);
      
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(err => console.log(err));
      }

      navigate("/result", { state: finalResult });
    } catch (err) {
      console.error("Error archiving your test record: ", err);
      alert("Submission failed. Saving backup locally.");
      navigate("/result", { state: finalResult });
    }
  }

  if (loading) return <div className="page"><h2>Loading Exam Questions...</h2></div>;
  if (questions.length === 0) return <div className="page"><h2>No Questions Found in Exam!</h2></div>;

  const currentQ = questions[currentQuestion];
  const selectedOpt = answers[currentQ.id];

  // Counter Calculations
  let answeredCount = 0;
  let markedCount = 0;
  let markedAnsweredCount = 0;
  let notAnsweredCount = 0;
  let notVisitedCount = 0;

  questions.forEach(q => {
    const hasAns = answers[q.id] !== undefined;
    const hasMark = review[q.id];
    const hasVisit = visited[q.id];

    if (hasMark && hasAns) markedAnsweredCount++;
    else if (hasMark) markedCount++;
    else if (hasAns) answeredCount++;
    else if (hasVisit) notAnsweredCount++;
    else notVisitedCount++;
  });

  return (
    <div className="exam-layout-grid">
      <div className="exam-workspace-pane">
        <div className="workspace-header">
          <div className="section-label-chip">Section: General Proficiency</div>
          <button 
            className={`bookmark-toggle-btn ${bookmarks[currentQ.id] ? "active" : ""}`}
            onClick={toggleBookmark}
          >
            {bookmarks[currentQ.id] ? "⭐ Bookmarked" : "☆ Bookmark"}
          </button>
        </div>

        <div className="question-body-card">
          <h3 className="question-number-heading">Question {currentQuestion + 1}</h3>
          <p className="question-text-paragraph">{currentQ.text || currentQ.question}</p>

          <div className="options-vertical-stack">
            {(currentQ.options || []).map((option, idx) => (
              <label 
                key={idx} 
                className={`option-row-card ${selectedOpt === idx ? "selected" : ""}`}
              >
                <input 
                  type="radio" 
                  name="exam-option-group" 
                  checked={selectedOpt === idx} 
                  onChange={() => selectOption(idx)} 
                />
                <span className="option-prefix-icon">{String.fromCharCode(65 + idx)}</span>
                <span className="option-text-label">{option}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="workspace-action-footer">
          <div className="footer-left-actions">
            <button className="action-btn secondary" onClick={toggleMarkForReview}>
              {review[currentQ.id] ? "Unmark Review" : "Mark for Review & Next"}
            </button>
            <button className="action-btn danger" onClick={clearResponse}>Clear Response</button>
          </div>
          <div className="footer-right-actions">
            <button className="action-btn primary" onClick={handlePrev} disabled={currentQuestion === 0}>Previous</button>
            <button className="action-btn primary" onClick={handleNext} disabled={currentQuestion === questions.length - 1}>Save & Next</button>
            <button className="action-btn success submit" onClick={() => submitExam(false)}>Submit Exam</button>
          </div>
        </div>
      </div>

      {/* Structured vertical sidebar wrapper to constrain height overflow */}
      <div className="exam-sidebar-pane">
        <div className="timer-countdown-card">
          <span className="timer-label">Time Remaining</span>
          <span className="timer-clock">{formatTime(timeLeft)}</span>
        </div>

        <div className="candidate-profile-summary">
          <div className="avatar-placeholder">👤</div>
          <div className="candidate-info">
            <h4>Anonymous Contender</h4>
            <span>Assessment Room Active</span>
          </div>
        </div>

        {/* Scrollable container setup for indicators and numbers grid */}
        <div className="sidebar-scrollable-container">
          <div className="exam-status-legend-grid">
            <div className="exam-legend-item">
              <div className="exam-legend-badge legend-answered">{answeredCount}</div>
              <span>Answered</span>
            </div>
            <div className="exam-legend-item">
              <div className="exam-legend-badge legend-marked">{markedCount}</div>
              <span>Marked</span>
            </div>
            <div className="exam-legend-item">
              <div className="exam-legend-badge legend-markedanswered">{markedAnsweredCount}</div>
              <span>Marked & Answered</span>
            </div>
            <div className="exam-legend-item">
              <div className="exam-legend-badge legend-notanswered">{notAnsweredCount}</div>
              <span>Not Answered</span>
            </div>
            <div className="exam-legend-item">
              <div className="exam-legend-badge legend-notvisited">{notVisitedCount}</div>
              <span>Not Visited</span>
            </div>
          </div>

          <div className="palette-grid">
            {questions.map((question, index) => {
              const answered = answers[question.id] !== undefined;
              const marked = review[question.id];
              const visitedQuestion = visited[question.id];

              let btnClass = "palette-btn";
              if (marked && answered) { btnClass += " marked-answered"; }
              else if (marked) { btnClass += " marked"; }
              else if (answered) { btnClass += " answered"; }
              else if (visitedQuestion) { btnClass += " not-answered"; }
              else { btnClass += " not-visited"; }

              if (currentQuestion === index) { btnClass += " current"; }

              return (
                <button
                  key={question.id}
                  className={btnClass}
                  onClick={() => {
                    setCurrentQuestion(index);
                    markVisited(index);
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
