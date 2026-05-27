import {
  useEffect,
  useState,
} from "react";

import {
  collection,
  doc,
  getDoc,
  onSnapshot,
} from "firebase/firestore";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import { db } from "../firebase/config";

export default function ExamPage(){

  // =========================================
  // ROUTER
  // =========================================

  const { examId } = useParams();

  const navigate = useNavigate();

  // =========================================
  // STATES
  // =========================================

  const [loading,setLoading] = useState(true);

  const [currentExam,setCurrentExam] = useState(null);

  const [questions,setQuestions] = useState([]);

  const [currentQuestionIndex,setCurrentQuestionIndex] =
    useState(0);

  const [selectedAnswers,setSelectedAnswers] =
    useState({});

  const [timeLeft,setTimeLeft] = useState(0);

  const [submitted,setSubmitted] = useState(false);

  // =========================================
  // LOAD EXAM
  // =========================================

  useEffect(()=>{

    async function loadExam(){

      try{

        // ---------------------------------
        // FETCH EXAM DOCUMENT
        // ---------------------------------

        const examRef = doc(
          db,
          "exams",
          examId
        );

        const examSnap = await getDoc(examRef);

        if(!examSnap.exists()){

          alert("Exam not found");

          navigate("/dashboard");

          return;
        }

        const examData = {
          id:examSnap.id,
          ...examSnap.data()
        };

        setCurrentExam(examData);

      }
      catch(error){

        console.error(error);

        alert("Failed to load exam");

      }

    }

    loadExam();

  },[
    examId,
    navigate
  ]);

  // =========================================
  // LOAD QUESTIONS BASED ON MOCK TYPE
  // =========================================

  useEffect(()=>{

    if(!currentExam) return;

    const unsubscribe = onSnapshot(

      collection(db,"questions"),

      (snapshot)=>{

        let allQuestions =
          snapshot.docs.map((doc)=>({
            id:doc.id,
            ...doc.data()
          }));

        // =====================================
        // SECTIONAL MOCK FILTERING
        // SUBJECT + TOPIC + SUBTOPIC
        // =====================================

        if(
          currentExam.mockType === "sectional"
        ){

          allQuestions = allQuestions.filter(
            (q)=>

              String(q.subjectId) ===
              String(currentExam.subjectId)

              &&

              String(q.topicId) ===
              String(currentExam.topicId)

              &&

              String(q.subTopicId) ===
              String(currentExam.subTopicId)
          );

        }

        // =====================================
        // FULL MOCK FILTERING
        // SUBJECT + TOPIC ONLY
        // =====================================

        if(
          currentExam.mockType === "full"
        ){

          allQuestions = allQuestions.filter(
            (q)=>

              String(q.subjectId) ===
              String(currentExam.subjectId)

              &&

              String(q.topicId) ===
              String(currentExam.topicId)
          );

        }

        // =====================================
        // FALLBACK
        // USE SAVED QUESTION IDS
        // =====================================

        if(
          currentExam.questionIds &&
          currentExam.questionIds.length > 0
        ){

          allQuestions = allQuestions.filter(
            (q)=>
              currentExam.questionIds.includes(q.id)
          );

        }

        // =====================================
        // SET QUESTIONS
        // =====================================

        setQuestions(allQuestions);

        // =====================================
        // SET TIMER
        // =====================================

        setTimeLeft(
          (currentExam.duration || 0) * 60
        );

        setLoading(false);

      }

    );

    return ()=> unsubscribe();

  },[
    currentExam
  ]);

  // =========================================
  // TIMER
  // =========================================

  useEffect(()=>{

    if(submitted) return;

    if(timeLeft <= 0){

      handleSubmitExam();

      return;
    }

    const timer = setInterval(()=>{

      setTimeLeft((prev)=> prev - 1);

    },1000);

    return ()=> clearInterval(timer);

  },[
    timeLeft,
    submitted
  ]);

  // =========================================
  // HANDLE OPTION SELECT
  // =========================================

  function handleSelectOption(questionId,option){

    setSelectedAnswers((prev)=>({

      ...prev,

      [questionId]:option

    }));

  }

  // =========================================
  // NAVIGATION
  // =========================================

  function nextQuestion(){

    if(
      currentQuestionIndex <
      questions.length - 1
    ){

      setCurrentQuestionIndex(
        (prev)=> prev + 1
      );

    }

  }

  function previousQuestion(){

    if(currentQuestionIndex > 0){

      setCurrentQuestionIndex(
        (prev)=> prev - 1
      );

    }

  }

  // =========================================
  // SUBMIT EXAM
  // =========================================

  function handleSubmitExam(){

    if(submitted) return;

    setSubmitted(true);

    let score = 0;

    questions.forEach((question)=>{

      const selected =
        selectedAnswers[question.id];

      if(selected === question.correctAnswer){

        score++;

      }

    });

    alert(
      `Exam Submitted\n\nScore: ${score}/${questions.length}`
    );

    navigate("/dashboard");

  }

  // =========================================
  // FORMAT TIMER
  // =========================================

  function formatTime(seconds){

    const mins = Math.floor(seconds / 60);

    const secs = seconds % 60;

    return `${mins}:${
      secs < 10 ? "0" : ""
    }${secs}`;

  }

  // =========================================
  // LOADING
  // =========================================

  if(loading){

    return(

      <div className="exam-loading">

        Loading Exam...

      </div>

    );

  }

  // =========================================
  // NO QUESTIONS
  // =========================================

  if(questions.length === 0){

    return(

      <div className="exam-loading">

        No Questions Found

      </div>

    );

  }

  // =========================================
  // CURRENT QUESTION
  // =========================================

  const currentQuestion =
    questions[currentQuestionIndex];

  // =========================================
  // UI
  // =========================================

  return(

    <div className="exam-page">

      {/* ================================= */}
      {/* HEADER */}
      {/* ================================= */}

      <div className="exam-header">

        <div>

          <h2>
            {currentExam?.name}
          </h2>

          <p>
            {
              currentExam?.mockType === "full"
                ? "FULL MOCK"
                : "SECTIONAL MOCK"
            }
          </p>

        </div>

        <div className="exam-timer">

          ⏳ {formatTime(timeLeft)}

        </div>

      </div>

      {/* ================================= */}
      {/* EXAM DETAILS */}
      {/* ================================= */}

      <div className="exam-info">

        <p>
          <strong>Subject:</strong>{" "}
          {currentExam?.subject || "-"}
        </p>

        <p>
          <strong>Topic:</strong>{" "}
          {currentExam?.topicName || "-"}
        </p>

        {
          currentExam?.mockType ===
          "sectional" && (

            <p>
              <strong>Sub Topic:</strong>{" "}
              {currentExam?.subTopicName || "-"}
            </p>

          )
        }

        <p>
          <strong>Total Questions:</strong>{" "}
          {questions.length}
        </p>

        <p>
          <strong>Duration:</strong>{" "}
          {currentExam?.duration || 0} mins
        </p>

      </div>

      {/* ================================= */}
      {/* QUESTION CARD */}
      {/* ================================= */}

      <div className="question-card">

        <h3>
          Question {currentQuestionIndex + 1}
        </h3>

        <p className="question-text">

          {currentQuestion?.question}

        </p>

        {/* ============================= */}
        {/* OPTIONS */}
        {/* ============================= */}

        <div className="options-container">

          {
            currentQuestion?.options?.map(
              (option,index)=>(

                <button
                  key={index}
                  className={`option-btn ${
                    selectedAnswers[
                      currentQuestion.id
                    ] === option
                      ? "selected-option"
                      : ""
                  }`}
                  onClick={()=>
                    handleSelectOption(
                      currentQuestion.id,
                      option
                    )
                  }
                >

                  {option}

                </button>

              )
            )
          }

        </div>

      </div>

      {/* ================================= */}
      {/* NAVIGATION */}
      {/* ================================= */}

      <div className="exam-navigation">

        <button
          onClick={previousQuestion}
          disabled={currentQuestionIndex === 0}
        >
          Previous
        </button>

        {
          currentQuestionIndex ===
          questions.length - 1
            ? (

              <button
                className="submit-btn"
                onClick={handleSubmitExam}
              >
                Submit Exam
              </button>

            )
            : (

              <button
                onClick={nextQuestion}
              >
                Next
              </button>

            )
        }

      </div>

    </div>

  );
}
