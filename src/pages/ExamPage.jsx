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

  const { subject } = useParams();

  const [questions, setQuestions] =
    useState([]);

  useEffect(() => {

    async function load() {

      const data =
        await getQuestionsBySubject(subject);

      setQuestions(data);

    }

    load();

  }, [subject]);

  return (

    <div className="page">

      <h1>{subject}</h1>

      {questions.length === 0 && (
        <h3>No Questions Found</h3>
      )}

      {questions.map((q, index) => (

        <div
          key={q.id}
          className="card"
        >

          <h3>
            {index + 1}. {q.question}
          </h3>

          {q.options.map((o, i) => (

            <label
              key={i}
              className="option"
            >

              <input
                type="radio"
                name={q.id}
              />

              {o}

            </label>

          ))}

        </div>

      ))}

    </div>
  );
}
