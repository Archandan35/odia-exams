import {
  useEffect,
  useState,
} from "react";

import {
  signOut,
} from "firebase/auth";

import {
  auth,
} from "../firebase/config";

import {
  useNavigate,
} from "react-router-dom";

import {
  addSubject,
  deleteSubject,
  listenSubjects,
} from "../services/subjectService";

import {
  addQuestion,
  deleteQuestion,
  listenQuestions,
} from "../services/questionService";

export default function AdminDashboard() {

  const nav =
    useNavigate();

  const [subjects,
    setSubjects] =
    useState([]);

  const [questions,
    setQuestions] =
    useState([]);

  const [title,
    setTitle] =
    useState("");

  const [description,
    setDescription] =
    useState("");

  const [duration,
    setDuration] =
    useState("");

  const [subject,
    setSubject] =
    useState("");

  const [question,
    setQuestion] =
    useState("");

  const [option1,
    setOption1] =
    useState("");

  const [option2,
    setOption2] =
    useState("");

  const [option3,
    setOption3] =
    useState("");

  const [option4,
    setOption4] =
    useState("");

  const [answer,
    setAnswer] =
    useState("");

  useEffect(() => {

    const unsub1 =
      listenSubjects(
        setSubjects
      );

    const unsub2 =
      listenQuestions(
        setQuestions
      );

    return () => {

      unsub1();
      unsub2();

    };

  }, []);

  async function logout() {

    await signOut(auth);

    nav("/");

  }

  async function createSubject() {

    await addSubject({
      title,
      description,
      duration,
      negativeMarking:0.25,
    });

    setTitle("");
    setDescription("");
    setDuration("");

  }

  async function createQuestion() {

    await addQuestion({
      subject,
      question,
      options:[
        option1,
        option2,
        option3,
        option4,
      ],
      answer,
    });

    setQuestion("");
    setOption1("");
    setOption2("");
    setOption3("");
    setOption4("");
    setAnswer("");

  }

  return (

    <div className="page">

      <div
        style={{
          display:"flex",
          justifyContent:
            "space-between",
        }}
      >

        <h1>
          Admin Dashboard
        </h1>

        <button
          onClick={logout}
        >
          Logout
        </button>

      </div>

      <div className="card">

        <h2>
          Add Subject
        </h2>

        <input
          placeholder="Title"
          value={title}
          onChange={(e)=>
            setTitle(
              e.target.value
            )
          }
        />

        <input
          placeholder="Description"
          value={description}
          onChange={(e)=>
            setDescription(
              e.target.value
            )
          }
        />

        <input
          placeholder="Duration"
          value={duration}
          onChange={(e)=>
            setDuration(
              e.target.value
            )
          }
        />

        <button
          onClick={
            createSubject
          }
        >
          Add Subject
        </button>

      </div>

      <div className="card">

        <h2>
          Add Question
        </h2>

        <select
          value={subject}
          onChange={(e)=>
            setSubject(
              e.target.value
            )
          }
        >

          <option>
            Select Subject
          </option>

          {subjects.map((s)=>(
            <option
              key={s.id}
              value={s.title}
            >
              {s.title}
            </option>
          ))}

        </select>

        <input
          placeholder="Question"
          value={question}
          onChange={(e)=>
            setQuestion(
              e.target.value
            )
          }
        />

        <input
          placeholder="Option 1"
          value={option1}
          onChange={(e)=>
            setOption1(
              e.target.value
            )
          }
        />

        <input
          placeholder="Option 2"
          value={option2}
          onChange={(e)=>
            setOption2(
              e.target.value
            )
          }
        />

        <input
          placeholder="Option 3"
          value={option3}
          onChange={(e)=>
            setOption3(
              e.target.value
            )
          }
        />

        <input
          placeholder="Option 4"
          value={option4}
          onChange={(e)=>
            setOption4(
              e.target.value
            )
          }
        />

        <input
          placeholder="Correct Answer"
          value={answer}
          onChange={(e)=>
            setAnswer(
              e.target.value
            )
          }
        />

        <button
          onClick={
            createQuestion
          }
        >
          Add Question
        </button>

      </div>

      <div className="grid">

        {subjects.map((s)=>(

          <div
            key={s.id}
            className="subject-card"
          >

            <h2>
              {s.title}
            </h2>

            <button
              onClick={() =>
                deleteSubject(
                  s.id
                )
              }
            >
              Delete
            </button>

          </div>

        ))}

      </div>

      <h2>
        Questions
      </h2>

      <div className="grid">

        {questions.map((q)=>(

          <div
            key={q.id}
            className="subject-card"
          >

            <h3>
              {q.question}
            </h3>

            <p>
              Subject:
              {q.subject}
            </p>

            <button
              onClick={() =>
                deleteQuestion(
                  q.id
                )
              }
            >
              Delete
            </button>

          </div>

        ))}

      </div>

    </div>
  );
}
