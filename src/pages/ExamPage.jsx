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

      elem.requestFullscreen()
        .catch(() => {});

    }

  }, []);

  /* =========================================
     CHEATING DETECTION
  ========================================= */

  useEffect(() => {

    function handleVisibility() {

      if (document.hidden) {

        setCheatCount(prev => {

          const next = prev + 1;

          if (next >= 3) {

            alert(
              "Exam auto-submitted due to cheating."
            );

            submitExam(true);

          }
          else {

            alert(
              `Warning ${next}/3 : Tab switching detected`
            );

          }

          return next;

        });

      }

    }

    document.addEventListener(
      "visibilitychange",
      handleVisibility
    );

    return () => {

      document.removeEventListener(
        "visibilitychange",
        handleVisibility
      );

    };

  }, []);

  /* =========================================
     LOAD EXAM
  ========================================= */

  useEffect(() => {

    async function loadExam() {

      try {

        const examRef = doc(
          db,
          "exams",
          examId
        );

        const examSnap = await getDoc(examRef);

        if (!examSnap.exists()) {

          setQuestions([]);

          return;

        }

        const exam = examSnap.data();

        setExamData(exam);

        const questionIds =
          exam.questionIds ||
          exam.questions ||
          [];

        const qSnap = await getDocs(
          collection(db, "questions")
        );

        const allQuestions =
          qSnap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }));

        const filteredQuestions =
          allQuestions.filter((q) =>
            questionIds.includes(q.id)
          );

        setQuestions(filteredQuestions);

        const saved =
          localStorage.getItem(
            STORAGE_KEY
          );

        if (saved) {

          const parsed =
            JSON.parse(saved);

          setAnswers(parsed.answers || {});
          setReview(parsed.review || {});
          setVisited(parsed.visited || {});
          setBookmarks(parsed.bookmarks || {});
          setTimeLeft(parsed.timeLeft ?? 1800);

        }

        if (
          filteredQuestions.length > 0 &&
          !saved
        ) {

          setVisited({
            [filteredQuestions[0].id]: true,
          });

        }

      }
      catch (err) {

        console.log(err);

      }
      finally {

        setLoading(false);

      }

    }

    loadExam();

  }, [examId]);

  /* =========================================
     AUTO SAVE
  ========================================= */

  useEffect(() => {

    if (
      loading ||
      questions.length === 0
    ) return;

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

  }, [
    answers,
    review,
    visited,
    bookmarks,
    timeLeft,
    loading,
    questions,
  ]);

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

  function selectOption(index) {

    const qId =
      questions[currentQuestion].id;

    setAnswers(prev => ({
      ...prev,
      [qId]: index,
    }));

  }

  function handleNext() {

    if (
      currentQuestion <
      questions.length - 1
    ) {

      const next =
        currentQuestion + 1;

      setCurrentQuestion(next);

      setVisited(prev => ({
        ...prev,
        [questions[next].id]: true,
      }));

    }

  }

  function handlePrev() {

    if (currentQuestion > 0) {

      const prev =
        currentQuestion - 1;

      setCurrentQuestion(prev);

    }

  }

  function clearResponse() {

    const qId =
      questions[currentQuestion].id;

    setAnswers(prev => {

      const updated = { ...prev };

      delete updated[qId];

      return updated;

    });

  }

  function toggleReview() {

    const qId =
      questions[currentQuestion].id;

    setReview(prev => ({
      ...prev,
      [qId]: !prev[qId],
    }));

  }

  function toggleBookmark() {

    const qId =
      questions[currentQuestion].id;

    setBookmarks(prev => ({
      ...prev,
      [qId]: !prev[qId],
    }));

  }

  /* =========================================
     SUBMIT
  ========================================= */

  async function submitExam(
    isAuto = false
  ) {

    if (!isAuto) {

      const confirmSubmit =
        window.confirm(
          "Are you sure you want to submit the exam?"
        );

      if (!confirmSubmit) return;

    }

    let score = 0;

    questions.forEach(q => {

      const userAns =
        answers[q.id];

      const map = {
        A: 0,
        B: 1,
        C: 2,
        D: 3,
      };

      let correctIndex = 0;

      if (
        typeof q.correctAnswer ===
        "number"
      ) {

        correctIndex =
          q.correctAnswer;

      }
      else {

        correctIndex =
          map[q.correctAnswer] ?? 0;

      }

      if (
        userAns === correctIndex
      ) {

        score += 4;

      }

    });

    const resultData = {
      examId,
      score,
      totalMarks:
        questions.length * 4,
      answers,
      questions,
      submittedAt:
        new Date().toISOString(),
    };

    try {

      await addDoc(
        collection(db, "results"),
        {
          ...resultData,
          userId:
            auth.currentUser?.uid ||
            "anonymous",
        }
      );

      localStorage.removeItem(
        STORAGE_KEY
      );

      if (document.fullscreenElement) {

        await document.exitFullscreen()
          .catch(() => {});

      }

      navigate("/result", {
        state: resultData,
      });

    }
    catch (err) {

      console.log(err);

    }

  }

  /* =========================================
     UI
  ========================================= */

  if (loading) {

    return (
      <div className="page">
        <h2>Loading Exam...</h2>
      </div>
    );

  }

  if (questions.length === 0) {

    return (
      <div className="page">
        <h2>No Questions Found!</h2>
      </div>
    );

  }

  const currentQ =
    questions[currentQuestion];

  const selectedOpt =
    answers[currentQ.id];

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

          <div style={{ textAlign:"right" }}>

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

          <h2>
            Question {currentQuestion + 1}
          </h2>

          <p
            style={{
              marginTop:"18px",
              lineHeight:"1.8",
              fontSize:"18px",
            }}
          >
            {currentQ.question || currentQ.text}
          </p>

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

                    <span className="option-label">
                      {String.fromCharCode(65 + idx)}.
                    </span>

                    {option}

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
