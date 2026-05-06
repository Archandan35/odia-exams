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

  const [review,
    setReview] =
    useState({});

  const [current,
    setCurrent] =
    useState(0);

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

        setTimeLeft((prev)=>{

          if (prev <= 1) {

            clearInterval(
              interval
            );

            submitExam();

            return 0;

          }

          return prev - 1;

        });

      },1000);

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

  function markReview(qid) {

    setReview((prev)=>({

      ...prev,

      [qid]:!prev[qid],

    }));

  }

  function saveNext() {

    if (
      current <
      questions.length - 1
    ) {

      setCurrent(
        current + 1
      );

    }

  }

  function previousQuestion() {

    if (current > 0) {

      setCurrent(
        current - 1
      );

    }

  }

  function submitExam() {

    let total = 0;

    questions.forEach((q)=>{

      if (
        answers[q.id] ===
        q.answer
      ) {

        total += 1;

      }

      else if (
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

  const q =
    questions[current];

  function getColor(id) {

    if (review[id]) {

      return "#f59e0b";

    }

    if (answers[id]) {

      return "#16a34a";

    }

    return "#334155";

  }

  return (

    <div className="exam-layout">

      <div className="exam-main">

        <div className="topbar">

          <h2>
            {subject}
          </h2>

          <h3>
            ⏳ {timeLeft}s
          </h3>

        </div>

        <div className="progress-box">

          Progress:
          {" "}
          {answered}
          /
          {questions.length}

        </div>

        {questions.length > 0 && q && (

          <div className="card">

            <h3>

              Question
              {" "}
              {current + 1}

            </h3>

            <h2>
              {q.question}
            </h2>

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

            <div
              style={{
                display:"flex",
                gap:"10px",
                marginTop:"20px",
                flexWrap:"wrap",
              }}
            >

              <button
                onClick={
                  previousQuestion
                }
              >
                Previous
              </button>

              <button
                onClick={
                  saveNext
                }
              >
                Save & Next
              </button>

              <button
                onClick={() =>
                  markReview(
                    q.id
                  )
                }
              >
                Mark Review
              </button>

              <button
                onClick={
                  submitExam
                }
              >
                Submit
              </button>

            </div>

          </div>

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

      <div className="navigator">

        <h3>
          Question Palette
        </h3>

        <div className="palette-grid">

          {questions.map((item,index)=>(

            <button
              key={item.id}
              className="palette-btn"
              style={{
                background:
                  getColor(
                    item.id
                  ),
              }}
              onClick={() =>
                setCurrent(index)
              }
            >

              {index + 1}

            </button>

          ))}

        </div>

        <div
          style={{
            marginTop:"20px",
          }}
        >

          <p>
            🟩 Answered
          </p>

          <p>
            🟨 Review
          </p>

          <p>
            ⬛ Not Answered
          </p>

        </div>

      </div>

    </div>
  );
}
