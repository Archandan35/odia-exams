import {
  useEffect,
  useState,
} from "react";

import {
  useParams,
} from "react-router-dom";

import {
  getQuestionsBySubject,
} from "../services/questionService";

export default function ExamPage() {

  const { subject } =
    useParams();

  const [questions,
    setQuestions] =
    useState([]);

  const [answers,
    setAnswers] =
    useState({});

  const [timeLeft,
    setTimeLeft] =
    useState(1800);

  const [submitted,
    setSubmitted] =
    useState(false);

  const [score,
    setScore] =
    useState(0);

  useEffect(() => {

    async function load() {

      const data =
        await getQuestionsBySubject(
          subject
        );

      setQuestions(data);

    }

    load();

  }, [subject]);

  useEffect(() => {

    if (submitted) return;

    const interval =
      setInterval(() => {

        setTimeLeft(
          (prev) => {

            if (prev <= 1) {

              clearInterval(
                interval
              );

              submitExam();

              return 0;

            }

            return prev - 1;

          }
        );

      }, 1000);

    return () =>
      clearInterval(
        interval
      );

  }, [submitted]);

  function selectAnswer(
    qid,
    option
  ) {

    setAnswers((prev)=>({

      ...prev,

      [qid]:option,

    }));

  }

  function submitExam() {

    let total = 0;

    questions.forEach((q)=>{

      if (
        answers[q.id] ===
        q.answer
      ) {

        total += 1;

      } else if (
        answers[q.id]
      ) {

        total -= 0.25;

      }

    });

    setScore(total);

    setSubmitted(true);

  }

  const answered =
    Object.keys(
      answers
    ).length;

  return (

    <div className="page">

      <div className="topbar">

        <h1>{subject}</h1>

        <h2>
          Timer:
          {timeLeft}s
        </h2>

      </div>

      <div
        style={{
          marginBottom:20,
        }}
      >

        Progress:
        {" "}
        {answered}
        /
        {questions.length}

      </div>

      {questions.length === 0 && (

        <h3>
          No Questions Found
        </h3>

      )}

      {questions.map((q,index)=>(

        <div
          key={q.id}
          className="card"
        >

          <h3>

            {index + 1}.
            {" "}
            {q.question}

          </h3>

          {q.options.map((o,i)=>(

            <label
              key={i}
              className="option"
            >

              <input
                type="radio"
                checked={
                  answers[q.id]
                  === o
                }
                onChange={() =>
                  selectAnswer(
                    q.id,
                    o
                  )
                }
              />

              {o}

            </label>

          ))}

        </div>

      ))}

      {!submitted && (

        <button
          onClick={
            submitExam
          }
        >
          Submit Exam
        </button>

      )}

      {submitted && (

        <div className="card">

          <h2>
            Exam Submitted
          </h2>

          <h3>
            Score:
            {" "}
            {score}
          </h3>

          <p>
            Accuracy:
            {" "}
            {
              questions.length
              ?
              (
                (score /
                questions.length)
                *100
              ).toFixed(2)
              :
              0
            }
            %
          </p>

        </div>

      )}

    </div>
  );
}
