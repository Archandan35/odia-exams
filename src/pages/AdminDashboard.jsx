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
  updateSubject,
} from "../services/subjectService";

import {
  addQuestion,
  deleteQuestion,
  listenQuestions,
  updateQuestion,
} from "../services/questionService";

export default function AdminDashboard() {

  const nav = useNavigate();

  const [subjects, setSubjects] =
    useState([]);

  const [questions, setQuestions] =
    useState([]);

  const [showSubjectForm,
    setShowSubjectForm] =
    useState(false);

  const [showQuestionForm,
    setShowQuestionForm] =
    useState(false);

  const [title, setTitle] =
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

  const [editingQuestion,
    setEditingQuestion] =
    useState(null);

  const [editQuestionText,
    setEditQuestionText] =
    useState("");

  const [editSubjectName,
    setEditSubjectName] =
    useState("");

  const [editOption1,
    setEditOption1] =
    useState("");

  const [editOption2,
    setEditOption2] =
    useState("");

  const [editOption3,
    setEditOption3] =
    useState("");

  const [editOption4,
    setEditOption4] =
    useState("");

  const [editAnswer,
    setEditAnswer] =
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

    if (!title) return;

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

    if (
      !subject ||
      !question
    ) return;

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

  async function editSubject(s) {

    const newTitle =
      prompt(
        "Edit Title",
        s.title
      );

    if (!newTitle) return;

    const newDescription =
      prompt(
        "Edit Description",
        s.description
      );

    if (!newDescription) return;

    const newDuration =
      prompt(
        "Edit Duration",
        s.duration
      );

    if (!newDuration) return;

    await updateSubject(
      s.id,
      {
        title:newTitle,
        description:newDescription,
        duration:newDuration,
      }
    );
  }

  function openEditQuestion(q) {

    setEditingQuestion(q.id);

    setEditQuestionText(
      q.question
    );

    setEditSubjectName(
      q.subject
    );

    setEditOption1(
      q.options[0]
    );

    setEditOption2(
      q.options[1]
    );

    setEditOption3(
      q.options[2]
    );

    setEditOption4(
      q.options[3]
    );

    setEditAnswer(
      q.answer
    );
  }

  async function saveEditQuestion() {

    await updateQuestion(

      editingQuestion,

      {

        subject:
          editSubjectName,

        question:
          editQuestionText,

        options:[

          editOption1,
          editOption2,
          editOption3,
          editOption4,

        ],

        answer:
          editAnswer,

      }

    );

    setEditingQuestion(null);

  }

  async function handleDeleteSubject(id) {

    const ok =
      window.confirm(
        "Delete Subject?"
      );

    if (!ok) return;

    await deleteSubject(id);

  }

  async function handleDeleteQuestion(id) {

    const ok =
      window.confirm(
        "Delete Question?"
      );

    if (!ok) return;

    await deleteQuestion(id);

  }

  return (

    <div className="page">

      <div className="topbar">

        <h1>
          Admin Dashboard
        </h1>

        <button
          onClick={logout}
        >
          Logout
        </button>

      </div>

      <div className="admin-actions">

        <button
          onClick={() =>
            setShowSubjectForm(
              !showSubjectForm
            )
          }
        >
          Add Subject
        </button>

        <button
          onClick={() =>
            setShowQuestionForm(
              !showQuestionForm
            )
          }
        >
          Add Question
        </button>

      </div>

      {showSubjectForm && (

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
            Save Subject
          </button>

        </div>

      )}

      {showQuestionForm && (

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
            Save Question
          </button>

        </div>

      )}

      <h2>
        Subjects
      </h2>

      <div className="grid">

        {subjects.map((s)=>(

          <div
            key={s.id}
            className="subject-card"
          >

            <h2>
              {s.title}
            </h2>

            <p>
              {s.description}
            </p>

            <p>
              Duration:
              {" "}
              {s.duration}
              {" "}
              mins
            </p>

            <button
              onClick={() =>
                editSubject(s)
              }
            >
              Edit
            </button>

            <button
              onClick={() =>
                handleDeleteSubject(
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

      <div
        style={{
          display:"flex",
          flexDirection:"column",
          gap:"15px",
        }}
      >

        {questions.map((q)=>(

          <div
            key={q.id}
            className="question-row"
          >

            <div
              className="question-left"
            >

              <h3>
                {q.question}
              </h3>

              <div className="option-line">

                <span>
                  A) {q.options?.[0]}
                </span>

                <span>
                  B) {q.options?.[1]}
                </span>

                <span>
                  C) {q.options?.[2]}
                </span>

                <span>
                  D) {q.options?.[3]}
                </span>

              </div>

              <p>
                Answer:
                {" "}
                {q.answer}
              </p>

            </div>

            <div
              className="question-right"
            >

              <button
                onClick={() =>
                  openEditQuestion(q)
                }
              >
                Edit
              </button>

              <button
                onClick={() =>
                  handleDeleteQuestion(
                    q.id
                  )
                }
              >
                Delete
              </button>

            </div>

          </div>

        ))}

      </div>

      {editingQuestion && (

        <div className="card">

          <h2>
            Edit Question
          </h2>

          <input
            value={editQuestionText}
            onChange={(e)=>
              setEditQuestionText(
                e.target.value
              )
            }
            placeholder="Question"
          />

          <select
            value={editSubjectName}
            onChange={(e)=>
              setEditSubjectName(
                e.target.value
              )
            }
          >

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
            value={editOption1}
            onChange={(e)=>
              setEditOption1(
                e.target.value
              )
            }
            placeholder="Option 1"
          />

          <input
            value={editOption2}
            onChange={(e)=>
              setEditOption2(
                e.target.value
              )
            }
            placeholder="Option 2"
          />

          <input
            value={editOption3}
            onChange={(e)=>
              setEditOption3(
                e.target.value
              )
            }
            placeholder="Option 3"
          />

          <input
            value={editOption4}
            onChange={(e)=>
              setEditOption4(
                e.target.value
              )
            }
            placeholder="Option 4"
          />

          <input
            value={editAnswer}
            onChange={(e)=>
              setEditAnswer(
                e.target.value
              )
            }
            placeholder="Correct Answer"
          />

          <button
            onClick={
              saveEditQuestion
            }
          >
            Update Question
          </button>

        </div>

      )}

    </div>
  );
}
