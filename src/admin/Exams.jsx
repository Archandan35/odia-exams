import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  collection,
  onSnapshot,
  deleteDoc,
  doc,
} from "firebase/firestore";

import { db } from "../firebase/config";

import {
  listenSubjects,
} from "../services/subjectService";

import AdminLayout from "./AdminLayout";

export default function Exams(){

  const [exams,setExams] = useState([]);
  const [subjects,setSubjects] = useState([]);

  const [selectedMockType,setSelectedMockType] = useState("");
  const [selectedSubject,setSelectedSubject] = useState("");
  const [selectedTopic,setSelectedTopic] = useState("");
  const [selectedSubTopic,setSelectedSubTopic] = useState("");

  useEffect(()=>{

    const unsubscribe = onSnapshot(
      collection(db,"exams"),
      (snapshot)=>{

        const data = snapshot.docs.map((d)=>(
          {
            id:d.id,
            ...d.data(),
          }
        ));

        setExams(data);

      }
    );

    return ()=> unsubscribe();

  },[]);

  useEffect(()=>{

    const unsubscribe = listenSubjects(setSubjects);

    return ()=> unsubscribe();

  },[]);

  const filteredTopics = useMemo(()=>{

    return [
      ...new Set(
        exams
          .filter((e)=>
            selectedSubject
              ? e.subjectId === selectedSubject
              : true
          )
          .map((e)=> e.topicName)
          .filter(Boolean)
      )
    ];

  },[
    exams,
    selectedSubject,
  ]);

  const filteredSubTopics = useMemo(()=>{

    return [
      ...new Set(
        exams
          .filter((e)=>
            selectedTopic
              ? e.topicName === selectedTopic
              : true
          )
          .map((e)=> e.subTopicName)
          .filter(Boolean)
      )
    ];

  },[
    exams,
    selectedTopic,
  ]);

  const filteredExams = exams.filter((exam)=>{

    const mockTypeMatch = selectedMockType
      ? (exam.mockType || "sectional") === selectedMockType
      : true;

    const subjectMatch = selectedSubject
      ? exam.subjectId === selectedSubject
      : true;

    const topicMatch = selectedTopic
      ? exam.topicName === selectedTopic
      : true;

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

  function getSubjectName(id){
    return subjects.find((s)=> s.id === id)?.name || "-";
  }

  async function handleDelete(id){

    const confirmDelete = window.confirm(
      "Delete this exam?"
    );

    if(!confirmDelete) return;

    await deleteDoc(doc(db,"exams",id));

  }

  return(

    <AdminLayout>

      <div className="page">

        <div className="page-header">
          <div>
            <h2>Exams</h2>
            <p>Manage generated mocks</p>
          </div>
        </div>

        <div className="filter-bar">

          <select
            value={selectedMockType}
            onChange={(e)=>{
              setSelectedMockType(e.target.value);
              setSelectedSubTopic("");
            }}
          >
            <option value="">All Mock Types</option>
            <option value="full">Full Mock</option>
            <option value="sectional">Sectional Mock</option>
          </select>

          <select
            value={selectedSubject}
            onChange={(e)=> setSelectedSubject(e.target.value)}
          >
            <option value="">All Subjects</option>

            {subjects.map((subject)=>(
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}

          </select>

          <select
            value={selectedTopic}
            onChange={(e)=> setSelectedTopic(e.target.value)}
          >
            <option value="">All Topics</option>

            {filteredTopics.map((topic)=>(
              <option key={topic} value={topic}>
                {topic}
              </option>
            ))}

          </select>

          {selectedMockType !== "full" && (

            <select
              value={selectedSubTopic}
              onChange={(e)=> setSelectedSubTopic(e.target.value)}
            >
              <option value="">All Sub Topics</option>

              {filteredSubTopics.map((subTopic)=>(
                <option key={subTopic} value={subTopic}>
                  {subTopic}
                </option>
              ))}

            </select>

          )}

        </div>

        <div className="exam-grid">

          {filteredExams.map((exam)=>(

            <div key={exam.id} className="exam-card">

              <div className="exam-card-badge-row">

                <div
                  className={`exam-badge ${
                    (exam.mockType || "sectional") === "full"
                      ? "full-badge"
                      : "sectional-badge"
                  }`}
                >

                  {(exam.mockType || "sectional") === "full"
                    ? "FULL MOCK"
                    : "SECTIONAL MOCK"}

                </div>

              </div>

              <h2 className="exam-card-title">
                {exam.name}
              </h2>

              <div className="exam-details">

                <p>
                  <strong>Subject:</strong>{" "}
                  {getSubjectName(exam.subjectId)}
                </p>

                <p>
                  <strong>Topic:</strong>{" "}
                  {exam.topicName || "-"}
                </p>

                {(exam.mockType || "sectional") === "sectional" && (

                  <p>
                    <strong>Sub Topic:</strong>{" "}
                    {exam.subTopicName || "-"}
                  </p>

                )}

                <p>
                  <strong>Questions:</strong>{" "}
                  {
                    exam.totalQuestions ||
                    exam.questionCount ||
                    exam.questionIds?.length ||
                    exam.questions?.length ||
                    0
                  }
                </p>

                <p>
                  <strong>Duration:</strong>{" "}
                  {exam.duration || 0} mins
                </p>

              </div>

              <div className="exam-actions">

                <button
                  className="delete-btn"
                  onClick={()=> handleDelete(exam.id)}
                >
                  Delete
                </button>

              </div>

            </div>

          ))}

        </div>

      </div>

    </AdminLayout>

  );
}
