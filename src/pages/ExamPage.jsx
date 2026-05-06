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

export default function ExamPage() {

  const { subject } =
    useParams();

  const navigate =
    useNavigate();

  const STORAGE_KEY =
    `exam_${subject}`;

  const [questions,
    setQuestions] =
    useState([]);

  const [currentQuestion,
    setCurrentQuestion] =
    useState(0);

  const [answers,
    setAnswers] =
    useState({});

  const [visited,
    setVisited] =
    useState({});

  const [review,
    setReview] =
    useState({});

  const [bookmarks,
    setBookmarks] =
    useState({});

  const [timeLeft,
    setTimeLeft] =
    useState(1800);

  const [examData,
    setExamData] =
    useState(null);

  const [loading,
    setLoading] =
    useState(true);

  /* LOAD EXAM */

  useEffect(() => {

    async function loadExam() {

      const saved =
        localStorage.getItem(
          STORAGE_KEY
        );

      if(saved){

        const parsed =
          JSON.parse(saved);

        setAnswers(
          parsed.answers || {}
        );

        setVisited(
          parsed.visited || {}
        );

        setReview(
          parsed.review || {}
        );

        setBookmarks(
          parsed.bookmarks || {}
        );

        setCurrentQuestion(
          parsed.currentQuestion || 0
        );

        setTimeLeft(
          parsed.timeLeft || 1800
        );

      }

      const examSnapshot =
        await getDocs(
          collection(db, "exams")
        );

      const exams =
        examSnapshot.docs.map(
          (doc) => ({
            id: doc.id,
            ...doc.data(),
          })
        );

      const currentExam =
        exams.find(
          (e) =>
            e.subjectId ===
            subject
        );

      setExamData(currentExam);

      if (
        currentExam &&
        !saved
      ) {

        setTimeLeft(
          currentExam.duration
          * 60
        );

      }

      const questionSnapshot =
        await getDocs(
          collection(db, "questions")
        );

      let allQuestions =
        questionSnapshot.docs.map(
          (doc) => ({
            id: doc.id,
            ...doc.data(),
          })
        );

      allQuestions =
        allQuestions.filter(
          (q) =>
            q.subjectId ===
            subject
        );

      if (
        currentExam?.shuffleQuestions
      ) {

        allQuestions =
          allQuestions.sort(
            () =>
              Math.random() - 0.5
          );

      }

      allQuestions =
        allQuestions.slice(
          0,
          currentExam?.questionCount
        );

      setQuestions(allQuestions);

      setLoading(false);

    }

    loadExam();

  }, [subject]);

  /* AUTO SAVE */

  useEffect(() => {

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

  }, [

    answers,
    visited,
    review,
    bookmarks,
    currentQuestion,
    timeLeft,

  ]);

  /* TIMER */

  useEffect(() => {

    if (
      loading ||
      questions.length === 0
    ) return;

    const timer =
      setInterval(() => {

        setTimeLeft((prev) => {

          if (prev <= 1) {

            clearInterval(timer);

            submitExam();

            return 0;

          }

          return prev - 1;

        });

      }, 1000);

    return () =>
      clearInterval(timer);

  }, [
    loading,
    questions,
  ]);

  /* WARNING */

  useEffect(() => {

    const handleBeforeUnload =
      (e) => {

      e.preventDefault();

      e.returnValue =
        "Exam in progress";

    };

    window.addEventListener(
      "beforeunload",
      handleBeforeUnload
    );

    return () => {

      window.removeEventListener(
        "beforeunload",
        handleBeforeUnload
      );

    };

  }, []);

  function formatTime(seconds) {

    const hrs =
      Math.floor(
        seconds / 3600
      );

    const mins =
      Math.floor(
        (seconds % 3600)
        / 60
      );

    const secs =
      seconds % 60;

    return `
${String(hrs)
.padStart(2,"0")}h
${String(mins)
.padStart(2,"0")}m
${String(secs)
.padStart(2,"0")}s
`;

  }

  function selectAnswer(
    qid,
    option
  ) {

    setAnswers((prev) => ({
      ...prev,
      [qid]: option,
    }));

    setVisited((prev) => ({
      ...prev,
      [qid]: true,
    }));

  }

  function markReview(qid) {

    setReview((prev) => ({
      ...prev,
      [qid]:
        !prev[qid],
    }));

  }

  function toggleBookmark(qid){

    setBookmarks((prev)=>({

      ...prev,

      [qid]:
        !prev[qid],

    }));

  }

  function nextQuestion() {

    if (
      currentQuestion <
      questions.length - 1
    ) {

      setCurrentQuestion(
        currentQuestion + 1
      );

    }

  }

  function prevQuestion() {

    if (
      currentQuestion > 0
    ) {

      setCurrentQuestion(
        currentQuestion - 1
      );

    }

  }

  async function submitExam() {

    const confirmSubmit =
      window.confirm(
        "Submit Exam?"
      );

    if(!confirmSubmit)
    return;

    let correct = 0;

    let wrong = 0;

    questions.forEach((q) => {

      const ans =
        answers[q.id];

      if (!ans) return;

      if (
        ans === q.answer
      ) {

        correct++;

      } else {

        wrong++;

      }

    });

    const negative =
      wrong *
      (
        examData
        ?.negativeMarking || 0
      );

    const finalScore =
      correct - negative;

    const accuracy =
      questions.length > 0
      ? (
        (
          correct /
          questions.length
        ) * 100
      ).toFixed(2)
      : 0;

    const resultData = {

      userId:
        auth.currentUser?.uid,

      subject,

      totalQuestions:
        questions.length,

      correct,

      wrong,

      unanswered:
        questions.length
        -
        (
          correct + wrong
        ),

      score:
        finalScore,

      accuracy,

      timeTaken:
        examData?.duration
        * 60
        - timeLeft,

      createdAt:
        Date.now(),

    };

    await addDoc(
      collection(db, "results"),
      resultData
    );

    localStorage.removeItem(
      STORAGE_KEY
    );

    navigate(
      "/result",
      {
        state: resultData,
      }
    );

  }

  if (loading) {

    return (

      <div className="page">

        <h2>
          Loading Exam...
        </h2>

      </div>

    );

  }

  const q =
    questions[currentQuestion];

  return (

    <div className="exam-layout">

      <div className="exam-main">

        <div className="topbar">

          <div>

            <h2>
              Exam Engine
            </h2>

            <p>
              Subject:
              {" "}
              {subject}
            </p>

          </div>

          <div>

            <h2>
              ⏳
              {" "}
              {
                formatTime(
                  timeLeft
                )
              }
            </h2>

          </div>

        </div>

        {
          q && (

            <div className="question-card">

              <h3>

                Question
                {" "}
                {
                  currentQuestion
                  + 1
                }

              </h3>

              <h2>
                {q.question}
              </h2>

              <div className="options-list">

                {
                  q.options?.map(
                    (
                      option,
                      index
                    ) => (

                    <label
                      key={index}
                      className={
                        answers[q.id]
                        === option
                        ? "selected-option"
                        : "option-card"
                      }
                    >

                      <input
                        type="radio"
                        checked={
                          answers[q.id]
                          === option
                        }
                        onChange={() =>
                          selectAnswer(
                            q.id,
                            option
                          )
                        }
                      />

                      {option}

                    </label>

                  ))
                }

              </div>

              <div className="exam-buttons">

                <button
                  onClick={
                    prevQuestion
                  }
                >
                  Previous
                </button>

                <button
                  onClick={() =>
                    markReview(
                      q.id
                    )
                  }
                >
                  {
                    review[q.id]
                    ? "Remove Review"
                    : "Mark Review"
                  }
                </button>

                <button
                  onClick={() =>
                    toggleBookmark(
                      q.id
                    )
                  }
                >
                  {
                    bookmarks[q.id]
                    ? "Bookmarked"
                    : "Bookmark"
                  }
                </button>

                <button
                  onClick={
                    nextQuestion
                  }
                >
                  Save & Next
                </button>

                <button
                  className="submit-btn"
                  onClick={
                    submitExam
                  }
                >
                  Submit
                </button>

              </div>

            </div>

          )
        }

      </div>

      <div className="navigator">

        <h3>
          Question Palette
        </h3>

        <div className="palette-grid">

          {
            questions.map(
              (
                item,
                index
              ) => {

              let btnClass =
                "palette-btn";

              if (
                review[item.id]
              ) {

                btnClass +=
                  " review-btn";

              }

              else if (
                answers[item.id]
              ) {

                btnClass +=
                  " answered-btn";

              }

              else if (
                visited[item.id]
              ) {

                btnClass +=
                  " visited-btn";

              }

              return (

                <button
                  key={item.id}
                  className={
                    btnClass
                  }
                  onClick={() =>
                    setCurrentQuestion(
                      index
                    )
                  }
                >

                  {index + 1}

                </button>

              );

            })
          }

        </div>

        <div className="legend">

          <div>
            <span className="legend-box answered-btn"></span>
            Answered
          </div>

          <div>
            <span className="legend-box visited-btn"></span>
            Visited
          </div>

          <div>
            <span className="legend-box review-btn"></span>
            Review
          </div>

        </div>

      </div>

    </div>

  );
}
