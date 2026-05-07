import {
  useEffect,
  useState,
} from "react";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";

import toast from "react-hot-toast";

import { db } from "../firebase/config";

import AdminLayout from "./AdminLayout";

export default function Questions() {

  const [subjects,setSubjects] = useState([]);
  const [topics,setTopics] = useState([]);
  const [subTopics,setSubTopics] = useState([]);
  const [questions,setQuestions] = useState([]);

  const [selectedSubject,setSelectedSubject] = useState("");
  const [selectedTopic,setSelectedTopic] = useState("");
  const [selectedSubTopic,setSelectedSubTopic] = useState("");

  const [filterSubject,setFilterSubject] = useState("");
  const [filterTopic,setFilterTopic] = useState("");
  const [filterSubTopic,setFilterSubTopic] = useState("");

  const [questionText,setQuestionText] = useState("");

  const [optionA,setOptionA] = useState("");
  const [optionB,setOptionB] = useState("");
  const [optionC,setOptionC] = useState("");
  const [optionD,setOptionD] = useState("");

  const [correctAnswer,setCorrectAnswer] = useState("A");

  const [difficulty,setDifficulty] = useState("easy");

  const [explanation,setExplanation] = useState("");

  const [showPopup,setShowPopup] = useState(false);

  const [editingId,setEditingId] = useState(null);

  const [search,setSearch] = useState("");

  const [selectedQuestions,setSelectedQuestions] = useState([]);

  const [page,setPage] = useState(1);

  const perPage = 10;

  const optionLabels = ["A","B","C","D"];

  /* SUBJECTS */

  useEffect(()=>{

    const unsub = onSnapshot(
      collection(db,"subjects"),
      (snapshot)=>{

        const data = snapshot.docs.map((doc)=>({
          id:doc.id,
          ...doc.data(),
        }));

        setSubjects(data);

      }
    );

    return ()=>unsub();

  },[]);

  /* TOPICS */

  useEffect(()=>{

    const unsub = onSnapshot(
      collection(db,"topics"),
      (snapshot)=>{

        const data = snapshot.docs.map((doc)=>({
          id:doc.id,
          ...doc.data(),
        }));

        setTopics(data);

      }
    );

    return ()=>unsub();

  },[]);

  /* SUBTOPICS */

  useEffect(()=>{

    const unsub = onSnapshot(
      collection(db,"subTopics"),
      (snapshot)=>{

        const data = snapshot.docs.map((doc)=>({
          id:doc.id,
          ...doc.data(),
        }));

        setSubTopics(data);

      }
    );

    return ()=>unsub();

  },[]);

  /* QUESTIONS */

  useEffect(()=>{

    const unsub = onSnapshot(
      collection(db,"questions"),
      (snapshot)=>{

        const data = snapshot.docs.map((doc)=>({
          id:doc.id,
          ...doc.data(),
        }));

        setQuestions(data);

      }
    );

    return ()=>unsub();

  },[]);

  /* FILTERED */

  const filteredTopics =
    topics.filter(
      (t)=>
        t.subjectId === selectedSubject
    );

  const filteredSubTopics =
    subTopics.filter(
      (s)=>
        s.subjectId === selectedSubject &&
        s.topicId === selectedTopic
    );

  /* ADD QUESTION */

  async function handleAddQuestion(){

    if(!questionText.trim()){
      toast.error("Question required");
      return;
    }

    if(
      !optionA.trim() ||
      !optionB.trim() ||
      !optionC.trim() ||
      !optionD.trim()
    ){
      toast.error("All options required");
      return;
    }

    if(
      !selectedSubject ||
      !selectedTopic ||
      !selectedSubTopic
    ){
      toast.error("Select hierarchy");
      return;
    }

    const duplicateQuery = query(
      collection(db,"questions"),
      where("question","==",questionText.trim()),
      where("subTopicId","==",selectedSubTopic)
    );

    const duplicate = await getDocs(duplicateQuery);

    if(!duplicate.empty){
      toast.error("Question already exists");
      return;
    }

    await addDoc(
      collection(db,"questions"),
      {
        subjectId:selectedSubject,
        topicId:selectedTopic,
        subTopicId:selectedSubTopic,

        question:questionText.trim(),

        options:[
          optionA.trim(),
          optionB.trim(),
          optionC.trim(),
          optionD.trim(),
        ],

        correctAnswer:
          typeof correctAnswer === "number"
          ? optionLabels[correctAnswer]
          : correctAnswer,

        difficulty,

        explanation:explanation.trim(),

        createdAt:Date.now(),
      }
    );

    toast.success("Question Added");

    resetForm();

  }

  /* EDIT */

  function editQuestion(q){

    setEditingId(q.id);

    setSelectedSubject(q.subjectId);
    setSelectedTopic(q.topicId);
    setSelectedSubTopic(q.subTopicId);

    setQuestionText(q.question);

    setOptionA(q.options?.[0] || "");
    setOptionB(q.options?.[1] || "");
    setOptionC(q.options?.[2] || "");
    setOptionD(q.options?.[3] || "");

    setCorrectAnswer(q.correctAnswer || "A");

    setDifficulty(q.difficulty || "easy");

    setExplanation(q.explanation || "");

    setShowPopup(true);

  }

  /* UPDATE */

  async function updateQuestion(){

    await updateDoc(
      doc(db,"questions",editingId),
      {
        subjectId:selectedSubject,
        topicId:selectedTopic,
        subTopicId:selectedSubTopic,

        question:questionText.trim(),

        options:[
          optionA.trim(),
          optionB.trim(),
          optionC.trim(),
          optionD.trim(),
        ],

        correctAnswer:
          typeof correctAnswer === "number"
          ? optionLabels[correctAnswer]
          : correctAnswer,

        difficulty,

        explanation:explanation.trim(),
      }
    );

    toast.success("Question Updated");

    resetForm();

  }

  /* DELETE */

  async function handleDelete(id){

    const confirmDelete = window.confirm(
      "Delete Question?"
    );

    if(!confirmDelete) return;

    await deleteDoc(
      doc(db,"questions",id)
    );

    toast.success("Question Deleted");

  }

  /* BULK DELETE */

  async function bulkDeleteQuestions(){

    const confirmDelete = window.confirm(
      `Delete ${selectedQuestions.length} questions?`
    );

    if(!confirmDelete) return;

    for(const id of selectedQuestions){

      await deleteDoc(
        doc(db,"questions",id)
      );

    }

    setSelectedQuestions([]);

    toast.success("Questions Deleted");

  }

  /* RESET */

  function resetForm(){

    setQuestionText("");

    setOptionA("");
    setOptionB("");
    setOptionC("");
    setOptionD("");

    setCorrectAnswer("A");

    setDifficulty("easy");

    setExplanation("");

    setEditingId(null);

    setShowPopup(false);

  }

  /* NAME */

  function getName(arr,id){

    const item = arr.find(
      (x)=>x.id === id
    );

    return item ? item.name : "Unknown";

  }

  /* FILTER QUESTIONS */

  const filteredQuestions = questions.filter((q)=>{

    const matchesSearch =
      q.question
      ?.toLowerCase()
      .includes(search.toLowerCase());

    const matchesSubject =
      filterSubject
      ? q.subjectId === filterSubject
      : true;

    const matchesTopic =
      filterTopic
      ? q.topicId === filterTopic
      : true;

    const matchesSubTopic =
      filterSubTopic
      ? q.subTopicId === filterSubTopic
      : true;

    return (
      matchesSearch &&
      matchesSubject &&
      matchesTopic &&
      matchesSubTopic
    );

  });

  const totalPages = Math.ceil(
    filteredQuestions.length / perPage
  );

  const paginated = filteredQuestions.slice(
    (page - 1) * perPage,
    page * perPage
  );

  return(

    <AdminLayout>

      <div className="page-header">

        <div>

          <h2>
            Questions Management
          </h2>

          <p>
            Total Questions:
            {" "}
            {filteredQuestions.length}
          </p>

        </div>

      </div>

      <div className="questions-toolbar">

        <div className="questions-toolbar-left">

          <input
            className="question-search"
            placeholder="Search Questions..."
            value={search}
            onChange={(e)=>
              setSearch(e.target.value)
            }
          />

          <div className="inline-filters">

            <select
              value={filterSubject}
              onChange={(e)=>{

                setFilterSubject(
                  e.target.value
                );

                setFilterTopic("");
                setFilterSubTopic("");

              }}
            >

              <option value="">
                Subject
              </option>

              {
                subjects.map((s)=>(

                <option
                  key={s.id}
                  value={s.id}
                >
                  {s.name}
                </option>

                ))
              }

            </select>

            <select
              value={filterTopic}
              onChange={(e)=>{

                setFilterTopic(
                  e.target.value
                );

                setFilterSubTopic("");

              }}
            >

              <option value="">
                Topic
              </option>

              {
                topics
                .filter(
                  (t)=>
                    !filterSubject ||
                    t.subjectId === filterSubject
                )
                .map((t)=>(

                <option
                  key={t.id}
                  value={t.id}
                >
                  {t.name}
                </option>

                ))
              }

            </select>

            <select
              value={filterSubTopic}
              onChange={(e)=>
                setFilterSubTopic(
                  e.target.value
                )
              }
            >

              <option value="">
                SubTopic
              </option>

              {
                subTopics
                .filter((st)=>{

                  const sameSubject =
                    !filterSubject ||
                    st.subjectId === filterSubject;

                  const sameTopic =
                    !filterTopic ||
                    st.topicId === filterTopic;

                  return (
                    sameSubject &&
                    sameTopic
                  );

                })
                .map((st)=>(

                <option
                  key={st.id}
                  value={st.id}
                >
                  {st.name}
                </option>

                ))
              }

            </select>

          </div>

        </div>

        <div className="questions-toolbar-right">

          {
            selectedQuestions.length > 0 && (

            <button
              className="delete-btn"
              onClick={bulkDeleteQuestions}
            >
              Delete Selected
              ({selectedQuestions.length})
            </button>

            )
          }

          <button
            className="add-question-btn"
            onClick={()=>setShowPopup(true)}
          >
            + Add Question
          </button>

        </div>

      </div>

      <div className="table-card">

        <table>

          <thead>

            <tr>

              <th>

                <input
                  type="checkbox"
                  checked={
                    selectedQuestions.length === filteredQuestions.length &&
                    filteredQuestions.length > 0
                  }
                  onChange={(e)=>{

                    if(e.target.checked){

                      setSelectedQuestions(
                        filteredQuestions.map(
                          (q)=>q.id
                        )
                      );

                    }else{

                      setSelectedQuestions([]);

                    }

                  }}
                />

              </th>

              <th>Question</th>
              <th>Subject</th>
              <th>Difficulty</th>
              <th>Answer</th>
              <th>Edit</th>
              <th>Delete</th>

            </tr>

          </thead>

          <tbody>

            {
              paginated.map((q,index)=>(

              <tr key={q.id}>

                <td>

                  <input
                    type="checkbox"
                    checked={
                      selectedQuestions.includes(q.id)
                    }
                    onChange={(e)=>{

                      if(e.target.checked){

                        setSelectedQuestions(
                          (prev)=>[
                            ...prev,
                            q.id
                          ]
                        );

                      }else{

                        setSelectedQuestions(
                          (prev)=>
                            prev.filter(
                              (id)=>id !== q.id
                            )
                        );

                      }

                    }}
                  />

                </td>

                <td>
                  {(page - 1) * perPage + index + 1}. {q.question}
                </td>

                <td>
                  {getName(subjects,q.subjectId)}
                </td>

                <td>
                  {q.difficulty}
                </td>

                <td>

                  {
                    typeof q.correctAnswer === "number"

                    ? q.options?.[
                        q.correctAnswer
                      ]

                    : q.options?.[
                        optionLabels.indexOf(
                          q.correctAnswer
                        )
                      ]
                  }

                </td>

                <td>

                  <button
                    className="edit-btn"
                    onClick={()=>editQuestion(q)}
                  >
                    Edit
                  </button>

                </td>

                <td>

                  <button
                    className="delete-btn"
                    onClick={()=>
                      handleDelete(q.id)
                    }
                  >
                    Delete
                  </button>

                </td>

              </tr>

              ))
            }

          </tbody>

        </table>

      </div>

      <div className="pagination">

        <button
          disabled={page === 1}
          onClick={()=>setPage(page - 1)}
        >
          Prev
        </button>

        <span>
          Page {page} of {totalPages}
        </span>

        <button
          disabled={page === totalPages}
          onClick={()=>setPage(page + 1)}
        >
          Next
        </button>

      </div>

    </AdminLayout>

  );

}
