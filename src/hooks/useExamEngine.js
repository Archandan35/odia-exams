  import { useEffect, useState } from "react";

import {
  useParams,
  useNavigate
} from "react-router-dom";

import {
  collection,
  getDocs,
  addDoc,
  doc,
  getDoc
} from "firebase/firestore";

import {
  db,
  auth
} from "../firebase/config";

export default function useExamEngine() {
  
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

        } else {

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

  if (!currentQ) return;

  const qId = currentQ.id;

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

  if (!currentQ) return;

  const qId = currentQ.id;

  setAnswers(prev => {

    const updated = { ...prev };

    delete updated[qId];

    return updated;

  });

}
  
 function toggleReview() {

  if (!currentQ) return;

  const qId = currentQ.id;

  setReview(prev => ({
    ...prev,
    [qId]: !prev[qId],
  }));

}
  
  function toggleBookmark() {

  if (!currentQ) return;

  const qId = currentQ.id;

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

  

 const currentQ =
  questions[currentQuestion] || null;

 const selectedOpt =
  currentQ
    ? answers[currentQ.id]
    : undefined;

  

return {

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

};
  }
