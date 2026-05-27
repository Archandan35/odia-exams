The root cause of both issues lies entirely inside **`ExamPage.jsx`** within its `loadExam` initialization effect.

Here is why both issues are happening:

1. **Why questions are loaded randomly/incorrectly:** Inside `ExamPage.jsx`, your code fetches the exam template correctly, but then it completely ignores the pre-generated array of questions (`currentExam.questions` or `currentExam.questionIds`) attached to that specific mock test. Instead, it re-queries the entire `questions` collection from Firestore and tries to run manual fallback filtering logic. Because `currentExam.examType` is undefined for dynamically generated mocks (the mock generator uses `mockType`), none of your `if/else if` conditions match. It falls back to sorting or slicing the *entire* question database!
2. **Why 1287 questions show up instead of 100:**
Because your fallback filters fail to match, the entire database of 1287 questions is loaded into state. Furthermore, `currentExam.questionCount` is undefined (the mock generator saves this field as `quantity` or `totalQuestions`), so the `.slice(0, currentExam.questionCount)` statement passes `undefined`, slicing nothing and returning all 1287 questions.

### The Solution

When a mock test is generated via `mockGeneratorService.js`, the exact, shuffled array of question objects is explicitly saved inside the exam document under the `questions` property.

To fix both bugs at once, `ExamPage.jsx` simply needs to extract `currentExam.questions` directly. If it exists, use it immediately; otherwise, fall back to historical filtering methods.

Here is the complete, updated **`ExamPage.jsx`** file with the corrected logic:

```jsx
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
  useEffect(()=>{
    const elem = document.documentElement;
    if(elem.requestFullscreen){
      elem.requestFullscreen().catch((err) => console.log("Fullscreen error:", err));
    }
  },[]);

  /* =========================================
     CHEAT DETECTION
  ========================================= */
  useEffect(()=>{
    function handleVisibility(){
      if(document.hidden){
        handleCheating("Tab Switch Detected");
      }
    }

    function handleFullscreen(){
      if(!document.fullscreenElement){
        handleCheating("Fullscreen Exited");
      }
    }

    document.addEventListener("visibilitychange", handleVisibility);
    document.addEventListener("fullscreenchange", handleFullscreen);

    return ()=>{
      document.removeEventListener("visibilitychange", handleVisibility);
      document.removeEventListener("fullscreenchange", handleFullscreen);
    };
  },[cheatCount]);

  function handleCheating(msg){
    const newCount = cheatCount + 1;
    setCheatCount(newCount);

    alert(`${msg}\n\nWarning: ${newCount}/3`);

    if(newCount >= 3){
      submitExam(true);
    }
  }

  /* =========================================
     LOAD EXAM
  ========================================= */
  useEffect(()=>{
    async function loadExam(){
      try{
        const saved = localStorage.getItem(STORAGE_KEY);
        if(saved){
          const parsed = JSON.parse(saved);
          setAnswers(parsed.answers || {});
          setVisited(parsed.visited || {});
          setReview(parsed.review || {});
          setBookmarks(parsed.bookmarks || {});
          setCurrentQuestion(parsed.currentQuestion || 0);
          setTimeLeft(parsed.timeLeft || 1800);
        }

        const examSnapshot = await getDocs(collection(db,"exams"));
        const exams = examSnapshot.docs.map((doc)=>({
          id:doc.id,
          ...doc.data(),
        }));

        const currentExam = exams.find((e)=>e.id === examId);
        if (!currentExam) {
          alert("Exam not found!");
          setLoading(false);
          return;
        }
        
        setExamData(currentExam);

        if(!saved){
          setTimeLeft((currentExam.duration || 30) * 60);
        }

        // FIX: Prioritize pre-generated questions saved by the mock generator
        if (Array.isArray(currentExam.questions) && currentExam.questions.length > 0) {
          setQuestions(currentExam.questions);
        } else {
          // Fallback legacy logic for manually configured exam types
          const questionSnapshot = await getDocs(collection(db,"questions"));
          let allQuestions = questionSnapshot.docs.map((doc)=>({
            id:doc.id,
            ...doc.data(),
          }));

          if(currentExam.examType === "subject"){
            allQuestions = allQuestions.filter((q)=> q.subjectId === currentExam.subjectId);
          }
          else if(currentExam.examType === "topic"){
            allQuestions = allQuestions.filter((q)=> q.topicId === currentExam.topicId);
          }
          else if(currentExam.examType === "subtopic"){
            allQuestions = allQuestions.filter((q)=> q.subTopicId === currentExam.subTopicId);
          }
          else if(currentExam.examType === "mixed"){
            allQuestions = allQuestions.sort(()=>Math.random()-0.5);
          }

          if(currentExam.shuffleQuestions){
            allQuestions = allQuestions.sort(()=>Math.random()-0.5);
          }

          const limit = currentExam.questionCount || currentExam.totalQuestions || currentExam.quantity || 10;
          allQuestions = allQuestions.slice(0, limit);
          setQuestions(allQuestions);
        }

        setLoading(false);
      }catch(error){
        console.error("Error loading exam:", error);
        setLoading(false);
      }
    }

    loadExam();
  }, [examId]);

  /* =========================================
     AUTO SAVE
  ========================================= */
  useEffect(()=>{
    if (loading) return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        answers,
        visited,
        review,
        bookmarks,
        currentQuestion,
        timeLeft,
      })
    );
  },[answers, visited, review, bookmarks, currentQuestion, timeLeft, loading]);

  /* =========================================
     TIMER
  ========================================= */
  useEffect(()=>{
    if(loading || questions.length === 0) return;

    const timer = setInterval(()=>{
      setTimeLeft((prev)=>{
        if(prev <= 1){
          clearInterval(timer);
          submitExam(true);
          return 0;
        }
        return prev - 1;
      });
    },1000);

    return ()=>clearInterval(timer);
  },[loading, questions]);

  /* =========================================
     FORMAT TIME
  ========================================= */
  function formatTime(seconds){
    const hrs = Math.floor(seconds/3600);
    const mins = Math.floor((seconds%3600)/60);
    const secs = seconds%60;

    return `${String(hrs).padStart(2,"0")}h ${String(mins).padStart(2,"0")}m ${String(secs).padStart(2,"0")}s`;
  }

  /* =========================================
     ANSWER SELECT
  ========================================= */
  function selectAnswer(qid, index){
    setAnswers((prev)=>({
      ...prev,
      [qid]:index,
    }));

    setVisited((prev)=>({
      ...prev,
      [qid]:true,
    }));
  }

  /* =========================================
     MARK REVIEW
  ========================================= */
  function markReview(qid){
    setReview((prev)=>({
      ...prev,
      [qid]: !prev[qid],
    }));
  }

  /* =========================================
     BOOKMARK
  ========================================= */
  function toggleBookmark(qid){
    setBookmarks((prev)=>({
      ...prev,
      [qid]: !prev[qid],
    }));
  }

  /* =========================================
     NAVIGATION
  ========================================= */
  function nextQuestion(){
    if(currentQuestion < questions.length - 1){
      setCurrentQuestion(currentQuestion + 1);
    }
  }

  function prevQuestion(){
    if(currentQuestion > 0){
      setCurrentQuestion(currentQuestion - 1);
    }
  }

  /* =========================================
     SUBMIT EXAM
  ========================================= */
  async function submitExam(autoSubmit=false){
    if(!autoSubmit){
      const confirmSubmit = window.confirm("Submit Exam?");
      if(!confirmSubmit) return;
    }

    let correct = 0;
    let wrong = 0;

    questions.forEach((q)=>{
      const ans = answers[q.id];
      if(ans === undefined) return;

      let correctIndex = 0;
      const answerMap = { A:0, B:1, C:2, D:3 };

      if(typeof q.correctAnswer === "number"){
        correctIndex = q.correctAnswer;
      }
      else if(typeof q.correctAnswer === "string"){
        correctIndex = answerMap[q.correctAnswer?.trim()?.toUpperCase()] ?? 0;
      }
      else{
        correctIndex = answerMap[q.answer] || 0;
      }

      if(correctIndex === ans){
        correct++;
      }else{
        wrong++;
      }
    });

    const negative = wrong * (examData?.negativeMarking || 0);
    const finalScore = correct - negative;

    const accuracy = questions.length > 0
      ? ((correct / questions.length) * 100).toFixed(2)
      : 0;

    const resultData = {
      userId: auth.currentUser?.uid,
      examId,
      examName: examData?.name,
      examType: examData?.examType || examData?.mockType || "mock",
      subject: questions?.[0]?.subjectId || examData?.subjectId || "",
      topicId: questions?.[0]?.topicId || examData?.topicId || "",
      subTopicId: questions?.[0]?.subTopicId || examData?.subTopicId || "",
      totalQuestions: questions.length,
      correct,
      wrong,
      unanswered: questions.length - (correct + wrong),
      score: finalScore,
      accuracy,
      timeTaken: (examData?.duration || 0) * 60 - timeLeft,
      cheatCount,
      questions,
      answers,
      bookmarks,
      review,
      createdAt: Date.now(),
    };
  
    try {
      await addDoc(collection(db,"results"), resultData);
      localStorage.removeItem(STORAGE_KEY);
      navigate("/result", { state: resultData });
    } catch (e) {
      console.error("Error saving exam results:", e);
      alert("Failed to submit results safely. Please check connection.");
    }
  }

  /* =========================================
     LOADING STATE
  ========================================= */
  if(loading){
    return(
      <div className="page">
        <h2>Loading Exam...</h2>
      </div>
    );
  }

  /* =========================================
     CURRENT QUESTION
  ========================================= */
  const q = questions[currentQuestion];

  /* =========================================
     LEGEND COUNTS
  ========================================= */
  const answeredCount = Object.keys(answers).filter(
    (key)=> answers[key] !== undefined && answers[key] !== null
  ).length;

  const markedCount = Object.keys(review).filter((key)=>review[key]).length;

  const markedAnsweredCount = Object.keys(review).filter(
    (key)=> review[key] && answers[key] !== undefined && answers[key] !== null
  ).length;

  const notAnsweredCount = Object.keys(visited).filter(
    (key)=> visited[key] && (answers[key] === undefined || answers[key] === null)
  ).length;

  const notVisitedCount = questions.length - Object.keys(visited).length;

  /* =========================================
     UI RENDER
  ========================================= */
  return(
    <div className="exam-layout">
      <div className="exam-main">
        <div className="topbar">
          <div>
            <h2>{examData?.name}</h2>
            <p>{examData?.examType || examData?.mockType || "Mock"} Exam</p>
          </div>
          <div>
            <h2>⏳ {formatTime(timeLeft)}</h2>
            <p>Warnings: {cheatCount}/3</p>
          </div>
        </div>

        {q ? (
          <div className="question-card">
            <h3>Question {currentQuestion + 1}</h3>
            <h2>{q.question}</h2>

            <div className="options-list">
              {q.options?.map((option, index)=>(
                <label
                  key={index}
                  className={answers[q.id] === index ? "selected-option" : "option-card"}
                >
                  <input
                    type="radio"
                    className="option-radio"
                    checked={answers[q.id] === index}
                    onChange={()=> selectAnswer(q.id, index)}
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
              <button onClick={()=>markReview(q.id)}>
                {review[q.id] ? "Remove Review" : "Mark Review"}
              </button>
              <button onClick={()=>toggleBookmark(q.id)}>
                {bookmarks[q.id] ? "Bookmarked" : "Bookmark"}
              </button>
              <button onClick={nextQuestion}>Save & Next</button>
              <button className="submit-btn" onClick={() => submitExam(false)}>Submit</button>
            </div>
          </div>
        ) : (
          <div className="question-card">
            <h2>No questions loaded for this exam.</h2>
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
          {questions.map((question, index)=>{
            const answered = answers[question.id] !== undefined;
            const marked = review[question.id];
            const visitedQuestion = visited[question.id];

            let btnClass = "palette-btn";
            if(marked && answered){ btnClass += " marked-answered"; }
            else if(marked){ btnClass += " marked"; }
            else if(answered){ btnClass += " answered"; }
            else if(visitedQuestion){ btnClass += " not-answered"; }
            else { btnClass += " not-visited"; }

            if(currentQuestion === index){ btnClass += " current"; }

            return(
              <button
                key={question.id}
                className={btnClass}
                onClick={()=> setCurrentQuestion(index)}
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

```
