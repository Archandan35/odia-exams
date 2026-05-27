import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";

import { db } from "../firebase/config";

import AdminLayout from "./AdminLayout";

import {
  listenSubjects,
} from "../services/subjectService";

export default function Exams(){

  // =====================================
  // STATES
  // =====================================

  const [exams,setExams] = useState([]);

  const [subjects,setSubjects] = useState([]);

  const [selectedMockType,setSelectedMockType] =
    useState("");

  const [selectedSubject,setSelectedSubject] =
    useState("");

  const [selectedTopic,setSelectedTopic] =
    useState("");

  const [selectedSubTopic,setSelectedSubTopic] =
    useState("");

  // =====================================
  // LOAD EXAMS
  // =====================================

  useEffect(()=>{

    const unsubscribe = onSnapshot(

      collection(db,"exams"),

      (snapshot)=>{

        const data = snapshot.docs.map((doc)=>({

          id:doc.id,

          ...doc.data()

        }));

        setExams(data);

      }

    );

    return ()=> unsubscribe();

  },[]);

  // =====================================
  // LOAD SUBJECTS
  // =====================================

  useEffect(()=>{

    const unsubscribe =
      listenSubjects(setSubjects);

    return ()=> unsubscribe();

  },[]);

  // =====================================
  // FILTERED TOPICS
  // =====================================

  const filteredTopics = useMemo(()=>{

    return [

      ...new Set(

        exams

          .filter((exam)=>

            selectedSubject
              ? exam.subjectId === selectedSubject
              : true

          )

          .map((exam)=> exam.topicName)

          .filter(Boolean)

      )

    ];

  },[
    exams,
    selectedSubject
  ]);

  // =====================================
  // FILTERED SUB TOPICS
  // =====================================

  const filteredSubTopics = useMemo(()=>{

    return [

      ...new Set(

        exams

          .filter((exam)=>

            selectedTopic
              ? exam.topicName === selectedTopic
              : true

          )

          .map((exam)=> exam.subTopicName)

          .filter(Boolean)

      )

    ];

  },[
    exams,
    selectedTopic
  ]);

  // =====================================
  // FILTER EXAMS
  // =====================================

  const filteredExams = exams.filter((exam)=>{

    // ---------------------------------
    // MOCK TYPE FILTER
    // ---------------------------------

    const mockTypeMatch =

      selectedMockType
        ? (
            (exam.mockType || "sectional")
            ===
            selectedMockType
          )
        : true;

    // ---------------------------------
    // SUBJECT FILTER
    // ---------------------------------

    const subjectMatch =

      selectedSubject
        ? exam.subjectId === selectedSubject
        : true;

    // ---------------------------------
    // TOPIC FILTER
    // ---------------------------------

    const topicMatch =

      selectedTopic
        ? exam.topicName === selectedTopic
        : true;

    // ---------------------------------
    // SUBTOPIC FILTER
    // ONLY FOR SECTIONAL MOCK
    // ---------------------------------

    const subTopicMatch =

      selectedMockType === "full"

        ? true

        : (

            selectedSubTopic

              ? exam.subTopicName === selectedSubTopic

              : true
          );

    return (

      mockTypeMatch &&
      subjectMatch &&
      topicMatch &&
      subTopicMatch

    );

  });

  // =====================================
  // DELETE EXAM
  // =====================================

  async function handleDelete(id){

    const confirmDelete = window.confirm(
      "Delete this exam?"
    );

    if(!confirmDelete) return;

    try{

      await deleteDoc(doc(db,"exams",id));

    }
    catch(error){

      console.error(error);

      alert("Delete Failed");

    }

  }

  // =====================================
  // GET SUBJECT NAME
  // =====================================

  function getSubjectName(id){

    return (
      subjects.find((s)=> s.id === id)?.name
      || "-"
    );

  }

  // =====================================
  // UI
  // =====================================

  return(

    <AdminLayout>

      <div className="page">

        {/* ============================= */}
        {/* PAGE HEADER */}
        {/* ============================= */}

        <div className="page-header">

          <div>

            <h2>Exams</h2>

            <p>
              Manage generated mocks
            </p>

          </div>

        </div>

        {/* ============================= */}
        {/* FILTERS */}
        {/* ============================= */}

        <div className="filter-bar">

          {/* MOCK TYPE FILTER */}

          <select
            value={selectedMockType}
            onChange={(e)=>{

              setSelectedMockType(
                e.target.value
              );

              setSelectedSubTopic("");

            }}
          >

            <option value="">
              All Mock Types
            </option>

            <option value="full">
              Full Mock
            </option>

            <option value="sectional">
              Sectional Mock
            </option>

          </select>

          {/* SUBJECT FILTER */}

          <select
            value={selectedSubject}
            onChange={(e)=>
              setSelectedSubject(
                e.target.value
              )
            }
          >

            <option value="">
              All Subjects
            </option>

            {
              subjects.map((subject)=>(

                <option
                  key={subject.id}
                  value={subject.id}
                >

                  {subject.name}

                </option>

              ))
            }

          </select>

          {/* TOPIC FILTER */}

          <select
            value={selectedTopic}
            onChange={(e)=>
              setSelectedTopic(
                e.target.value
              )
            }
          >

            <option value="">
              All Topics
            </option>

            {
              filteredTopics.map((topic)=>(

                <option
                  key={topic}
                  value={topic}
                >

                  {topic}

                </option>

              ))
            }

          </select>

          {/* SUB TOPIC FILTER */}

          {
            selectedMockType !== "full" && (

              <select
                value={selectedSubTopic}
                onChange={(e)=>
                  setSelectedSubTopic(
                    e.target.value
                  )
                }
              >

                <option value="">
                  All Sub Topics
                </option>

                {
                  filteredSubTopics.map(
                    (subTopic)=>(

                      <option
                        key={subTopic}
                        value={subTopic}
                      >

                        {subTopic}

                      </option>

                    )
                  )
                }

              </select>

            )
          }

        </div>

        {/* ============================= */}
        {/* EXAM CARDS */}
        {/* ============================= */}

        <div className="exam-grid">

          {
            filteredExams.map((exam)=>(

              <div
                key={exam.id}
                className="exam-card"
              >

                {/* MOCK TYPE BADGE */}

                <div className="exam-badge-row">

                  <div
                    className={`exam-badge ${
                      (exam.mockType || "sectional")
                      === "full"
                        ? "full-badge"
                        : "sectional-badge"
                    }`}
                  >

                    {
                      (exam.mockType || "sectional")
                      === "full"

                        ? "FULL MOCK"

                        : "SECTIONAL MOCK"
                    }

                  </div>

                </div>

                {/* EXAM NAME */}

                <h2 className="exam-title">

                  {exam.name}

                </h2>

                {/* EXAM DETAILS */}

                <div className="exam-details">

                  {/* SUBJECT */}

                  <p>

                    <strong>
                      Subject:
                    </strong>{" "}

                    {
                      getSubjectName(
                        exam.subjectId
                      )
                    }

                  </p>

                  {/* TOPIC */}

                  <p>

                    <strong>
                      Topic:
                    </strong>{" "}

                    {
                      exam.topicName || "-"
                    }

                  </p>

                  {/* SUBTOPIC */}

                  {
                    (exam.mockType || "sectional")
                    === "sectional" && (

                      <p>

                        <strong>
                          Sub Topic:
                        </strong>{" "}

                        {
                          exam.subTopicName || "-"
                        }

                      </p>

                    )
                  }

                  {/* QUESTION COUNT */}

                  <p>

                    <strong>
                      Questions:
                    </strong>{" "}

                    {

                      exam.totalQuestions ||

                      exam.questionCount ||

                      exam.questionIds?.length ||

                      exam.questions?.length ||

                      0

                    }

                  </p>

                  {/* DURATION */}

                  <p>

                    <strong>
                      Duration:
                    </strong>{" "}

                    {exam.duration || 0} mins

                  </p>

                </div>

                {/* ACTIONS */}

                <div className="exam-actions">

                  <button
                    className="delete-btn"
                    onClick={()=>
                      handleDelete(exam.id)
                    }
                  >
                    Delete
                  </button>

                </div>

              </div>

            ))
          }

        </div>

      </div>

    </AdminLayout>

  );
}
