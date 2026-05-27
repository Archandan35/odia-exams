import {
  useEffect,
  useState,
} from "react";

import {
  useParams,
  useNavigate,
} from "react-router-dom";

import {
  collection,
  getDocs,
  addDoc,
} from "firebase/firestore";

import {
  db,
  auth,
} from "../firebase/config";

export default function ExamPage(){

  const { examId } = useParams();
  const navigate = useNavigate();
  const STORAGE_KEY = `exam_${examId}`;

  const [questions, setQuestions] = useState([]);
  const [examData, setExamData] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // New state to manage whether the exam has officially started
  const [examStarted, setExamStarted] = useState(false);

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [visited, setVisited] = useState({});
  const [review, setReview] = useState({});
  const [bookmarks, setBookmarks] = useState({});
  const [timeLeft, setTimeLeft] = useState(1800);
  const [cheatCount, setCheatCount] = useState(0);

  /* =========================================
  CHEAT DETECTION (Active only when exam starts)
  ========================================= */

  useEffect(() => {
    if (!examStarted) return;

    function handleVisibility() {
      if (document.hidden) {
        handleCheating("Tab Switch Detected");
      }
    }

    function handleFullscreen() {
      if (!document.fullscreenElement) {
        handleCheating("Fullscreen Exited");
      }
    }

    document.addEventListener("visibilitychange", handleVisibility);
    document.addEventListener("fullscreenchange", handleFullscreen);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      document.removeEventListener("fullscreenchange", handleFullscreen);
    };
  }, [cheatCount, examStarted]);

  function handleCheating(msg) {
    const newCount = cheatCount + 1;
    setCheatCount(newCount);

    alert(`${msg}\n\nWarning: ${newCount}/3`);

    if (newCount >= 3) {
      submitExam(true);
    }
  }

  /* =========================================
  LOAD EXAM & SUBJECTS
  ========================================= */

  useEffect(() => {
    async function loadExamData() {
      try {
        // Fetch subjects first to map subject names
        const subjectSnapshot = await getDocs(collection(db, "subjects"));
        const subjectList = subjectSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSubjects(subjectList);

        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setAnswers(parsed.answers || {});
          setVisited(parsed.visited || {});
          setReview(parsed.review || {});
          setBookmarks(parsed.bookmarks || {});
          setCurrentQuestion(parsed.currentQuestion || 0);
          setTimeLeft(parsed.timeLeft || 1800);
          setExamStarted(parsed.examStarted || false);
        }

        const examSnapshot = await getDocs(collection(db, "exams"));
        const exams = examSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const currentExam = exams.find((e) => e.id === examId);
        setExamData(currentExam);

        if (currentExam && !saved) {
          setTimeLeft(currentExam.duration * 60);
        }

        const questionSnapshot = await getDocs(collection(db, "questions"));
        let allQuestions = questionSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        /* FILTERING VIA EXAM TYPE */
        if (currentExam) {
          if (currentExam.examType === "subject") {
            allQuestions = allQuestions.filter((q) => q.subjectId === currentExam.subjectId);
          } else if (currentExam.examType === "topic") {
            allQuestions = allQuestions.filter((q) => q.topicId === currentExam.topicId);
          } else if (currentExam.examType === "subtopic") {
            allQuestions = allQuestions.filter((q) => q.subTopicId === currentExam.subTopicId);
          } else if (currentExam.examType === "mixed") {
            allQuestions = allQuestions.sort(() => Math.random() - 0.5);
          }

          if (currentExam.shuffleQuestions) {
            allQuestions = allQuestions.sort(() => Math.random() - 0.5);
          }

          const targetCount = currentExam.totalQuestions || currentExam.questionCount || currentExam.questionIds?.length || allQuestions.length;
          allQuestions = allQuestions.slice(0, targetCount);
        }

        setQuestions(allQuestions);
        setLoading(false);
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    }

    loadExamData();
  }, [examId]);

  /* =========================================
  AUTO SAVE
  ========================================= */

  useEffect(() => {
    if (!loading && examData) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          answers,
          visited,
          review,
          bookmarks,
          currentQuestion,
          timeLeft,
          examStarted,
        })
      );
    }
  }, [answers, visited, review, bookmarks, currentQuestion, timeLeft, examStarted, loading, examData]);

  /* =========================================
  TIMER
  ========================================= */

  useEffect(() => {
    if (loading || questions.length === 0 || !examStarted) return;

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
  }, [loading, questions, examStarted]);

  /* =========================================
  FORMAT TIME
  ========================================= */

  function formatTime(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${String(hrs).padStart(2, "0")}h ${String(mins).padStart(2, "0")}m ${String(secs).padStart(2, "0")}s`;
  }

  /* =========================================
  HELPER FUNCTIONS
  ========================================= */

  function getSubjectName(id) {
    return subjects.find((s) => s.id === id)?.name || "-";
  }

  function startExam() {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch((err) => {
        console.log(`Error attempting to enable fullscreen: ${err.message}`);
      });
    }
    setExamStarted(true);
  }

  function selectAnswer(qid, index) {
    setAnswers((prev) => ({ ...prev, [qid]: index }));
    setVisited((prev) => ({ ...prev, [qid]: true }));
  }

  function markReview(qid) {
    setReview((prev) => ({ ...prev, [qid]: !prev[qid] }));
  }

  function toggleBookmark(qid) {
    setBookmarks((prev) => ({ ...prev, [qid]: !prev[qid] }));
  }

  function nextQuestion() {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  }

  function prevQuestion() {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  }

  /* =========================================
  SUBMIT EXAM
  ========================================= */

  async function submitExam(autoSubmit = false) {
    if (!autoSubmit) {
      const confirmSubmit = window.confirm("Submit Exam?");
      if (!confirmSubmit) return;
    }

    let correct = 0;
    let wrong = 0;

    questions.forEach((q) => {
      const ans = answers[q.id];
      if (ans === undefined) return;

      let correctIndex = 0;
      const answerMap = { A: 0, B: 1, C: 2, D: 3 };

      if (typeof q.correctAnswer === "number") {
        correctIndex = q.correctAnswer;
      } else if (typeof q.correctAnswer === "string") {
        correctIndex = answerMap[q.correctAnswer?.trim()?.toUpperCase()] ?? 0;
      } else {
        correctIndex = answerMap[q.answer] || 0;
      }

      if (correctIndex === ans) {
        correct++;
      } else {
        wrong++;
      }
    });

    const negative = wrong * (examData?.negativeMarking || 0);
    const finalScore = correct - negative;

    const accuracy = questions.length > 0 ? ((correct / questions.length) * 100).toFixed(2) : 0;
    
    const resultData = {
      userId: auth.currentUser?.uid,
      examId,
      examName: examData?.name,
      examType: examData?.examType,
      subject: questions?.[0]?.subjectId || "",
      topicId: questions?.[0]?.topicId || "",
      subTopicId: questions?.[0]?.subTopicId || "",
      totalQuestions: questions.length,
      correct,
      wrong,
      unanswered: questions.length - (correct + wrong),
      score: finalScore,
      accuracy,
      timeTaken: examData?.duration * 60 - timeLeft,
      cheatCount,
      questions,
      answers,
      bookmarks,
      review,
      createdAt: Date.now(),
    };

    await addDoc(collection(db, "results"), resultData);
    localStorage.removeItem(STORAGE_KEY);

    // Exit fullscreen upon submission if active
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }

    navigate("/result", { state: resultData });
  }

  /* =========================================
  LOADING STATE
  ========================================= */

  if (loading) {
    return (
      <div className="page">
        <h2>Loading Exam...</h2>
      </div>
    );
  }

  /* =========================================
  PRE-EXAM INFOCARD VIEW (Before Start)
  ========================================= */

  if (!examStarted && examData) {
    const isFullMock = (examData.mockType || "sectional") === "full";

    return (
      <div className="page" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
        <div className="exam-card" style={{ maxWidth: "500px", width: "100%", padding: "2rem", border: "1px solid #ccc", borderRadius: "8px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
          <div className="exam-card-badge-row" style={{ marginBottom: "1rem" }}>
            <div className={`exam-badge ${isFullMock ? "full-badge" : "sectional-badge"}`}>
              {isFullMock ? "FULL MOCK" : "SECTIONAL MOCK"}
            </div>
          </div>

          <h2 className="exam-card-title" style={{ marginBottom: "1.5rem" }}>{examData.name}</h2>

          <div className="exam-details" style={{ marginBottom: "2rem", lineHeight: "1.8" }}>
            <p><strong>Subject:</strong> {getSubjectName(examData.subjectId)}</p>
            <p><strong>Topic:</strong> {examData.topicName || "-"}</p>
            
            {/* Hides sub-topic configuration dynamically if full mock is active */}
            {!isFullMock && (
              <p><strong>Sub Topic:</strong> {examData.subTopicName || "-"}</p>
            )}

            <p><strong>Questions:</strong> {questions.length}</p>
            <p><strong>Duration:</strong> {examData.duration || 0} mins</p>
          </div>

          <div className="exam-actions">
            <button className="submit-btn" style={{ width: "100%", padding: "0.75rem", fontSize: "1.1rem" }} onClick={startExam}>
              Start Exam
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* =========================================
  ACTIVE EXAM LAYOUT
  ========================================= */

  const q = questions[currentQuestion];

  const answeredCount = Object.keys(answers).filter((key) => answers[key] !== undefined && answers[key] !== null).length;
  const markedCount = Object.keys(review).filter((key) => review[key]).length;
  const markedAnsweredCount = Object.keys(review).filter((key) => review[key] && answers[key] !== undefined && answers[key] !== null).length;
  const notAnsweredCount = Object.keys(visited).filter((key) => visited[key] && (answers[key] === undefined || answers[key] === null)).length;
  const notVisitedCount = questions.length - Object.keys(visited).length;

  return (
    <div className="exam-layout">
      <div className="exam-main">
        <div className="topbar">
          <div>
            <h2>{examData?.name}</h2>
            <p>{examData?.examType} Exam</p>
          </div>
          <div>
            <h2>⏳ {formatTime(timeLeft)}</h2>
            <p>Warnings: {cheatCount}/3</p>
          </div>
        </div>

        {q && (
          <div className="question-card">
            <h3>Question {currentQuestion + 1}</h3>
            <h2>{q.question}</h2>

            <div className="options-list">
              {q.options?.map((option, index) => (
                <label key={index} className={answers[q.id] === index ? "selected-option" : "option-card"}>
                  <input
                    type="radio"
                    className="option-radio"
                    checked={answers[q.id] === index}
                    onChange={() => selectAnswer(q.id, index)}
                  />
                  <div className="option-text">
                    <span className="option-label">{String.fromCharCode(65 + index)}.</span>
                    {option}
                  </div>
                </label>
              ))}
            </div>

            <div className="exam-buttons">
              <button onClick={prevQuestion}>Previous</button>
              <button onClick={() => markReview(q.id)}>{review[q.id] ? "Remove Review" : "Mark Review"}</button>
              <button onClick={() => toggleBookmark(q.id)}>{bookmarks[q.id] ? "Bookmarked" : "Bookmark"}</button>
              <button onClick={nextQuestion}>Save & Next</button>
              <button className="submit-btn" onClick={() => submitExam(false)}>Submit</button>
            </div>
          </div>
        )}
      </div>

      <div className="navigator">
        <h3 className="palette-title">Questions</h3>
        
        <div className="exam-legend">
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
            if (marked && answered) btnClass += " marked-answered";
            else if (marked) btnClass += " marked";
            else if (answered) btnClass += " answered";
            else if (visitedQuestion) btnClass += " not-answered";
            else btnClass += " not-visited";

            if (currentQuestion === index) btnClass += " current";

            return (
              <button key={question.id} className={btnClass} onClick={() => setCurrentQuestion(index)}>
                {index + 1}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

