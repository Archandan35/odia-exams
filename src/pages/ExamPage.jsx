import {
  useEffect,
  useState,
} from "react";

import {
  getQuestionsBySubject,
} from "../services/questionService";

export default function ExamPage() {

  const [questions,
    setQuestions] =
    useState([]);

  useEffect(() => {

    async function load() {

      const data =
        await getQuestionsBySubject(
          "SBI PO Mock"
        );

      setQuestions(data);

    }

    load();

  }, []);

  return (

    <div className="page">

      <h1>
        Mock Exam
      </h1>

      {questions.map((q,index)=>(

        <div
          key={q.id}
          className="card"
        >

          <h3>
            {index+1}.
            {" "}
            {q.question}
          </h3>

          {q.options.map((o,i)=>(

            <div key={i}>

              <label>

                <input
                  type="radio"
                  name={q.id}
                />

                {" "}
                {o}

              </label>

            </div>

          ))}

        </div>

      ))}

    </div>
  );
}
