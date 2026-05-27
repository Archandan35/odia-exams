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
  updateDoc,
} from "firebase/firestore";

import { db } from "../firebase/config";

import {
  listenSubjects,
} from "../services/subjectService";

import AdminLayout from "./AdminLayout";

export default function Exams(){

  const [exams,setExams] = useState([]);

  const [subjects,setSubjects] = useState([]);

  const [selectedSubject,setSelectedSubject] = useState("");
  const [selectedTopic,setSelectedTopic] = useState("");
  const [selectedSubTopic,setSelectedSubTopic] = useState("");

  useEffect(()=>{

    const unsubscribe =
      onSnapshot(
        collection(db,"exams"),
        (snapshot)=>{

          const data =
            snapshot.docs.map((doc)=>({
              id:doc.id,
              ...doc.data()
            }));

          setExams(data);

        }
      );

    return ()=>unsubscribe();

  },[]);

  useEffect(()=>{

    const unsubscribe =
      listenSubjects(setSubjects);

    return ()=>unsubscribe();

  },[]);

  const topics = useMemo(()=>{
    return [
      ...new Set(
        exams
          .map((e)=> e.topicName)
          .filter(Boolean)
      )
    ];
  },[exams]);

  const subTopics = useMemo(()=>{
    return [
      ...new Set(
        exams
          .map((e)=> e.subTopicName)
          .filter(Boolean)
      )
    ];
  },[exams]);

  const filteredExams =
    exams.filter((exam)=>{

      const subjectMatch =
        selectedSubject
          ? exam.subjectId === selectedSubject
          : true;

      const topicMatch =
        selectedTopic
          ? exam.topicName === selectedTopic
          : true;

      const subTopicMatch =
        selectedSubTopic
          ? exam.subTopicName === selectedSubTopic
          : true;

      return (
        subjectMatch &&
        topicMatch &&
        subTopicMatch
      );

    });

  function getSubjectName(id){

    return (
      subjects.find((s)=> s.id === id)?.name || "-"
    );

  }

  async function handleDelete(id){

    const confirmDelete =
      window.confirm("Delete this exam?");

    if(!confirmDelete) return;

    await deleteDoc(doc(db,"exams",id));
  }

  return (

    <AdminLayout>

      <div className="page">

        <div className="exam-grid">

          {filteredExams.map((exam)=>(

            <div
              key={exam.id}
              className="exam-card"
            >

              <div
                style={{
                  display:"flex",
                  alignItems:"flex-start",
                  justifyContent:"space-between",
                  gap:"10px",
                  marginBottom:"12px",
                }}
              >

                <h2
                  className="exam-card-title"
                  style={{
                    margin:0,
                    flex:1,
                    wordBreak:"break-word",
                    overflowWrap:"anywhere",
                    lineHeight:"1.4",
                    paddingRight:"6px"
                  }}
                >
                  {exam.name}
                </h2>

                <div
                  className={`exam-badge ${
                    (exam.mockType || "sectional") === "full"
                      ? "full-badge"
                      : "sectional-badge"
                  }`}
                  style={{
                    flexShrink:0,
                    marginTop:"2px",
                    whiteSpace:"nowrap",
                    alignSelf:"flex-start"
                  }}
                >
                  {(exam.mockType || "sectional") === "full"
                    ? "FULL MOCK"
                    : "SECTIONAL MOCK"}
                </div>

              </div>

              <div className="exam-details">

                <p>
                  <strong>Subject:</strong>{" "}
                  {getSubjectName(exam.subjectId)}
                </p>

                <p>
                  <strong>Topic:</strong>{" "}
                  {exam.topicName}
                </p>

                <p>
                  <strong>Sub Topic:</strong>{" "}
                  {exam.subTopicName}
                </p>

                <p>
                  <strong>Quantity:</strong>{" "}
                  {exam.totalQuestions || 0} Questions
                </p>

                <p>
                  <strong>Duration:</strong>{" "}
                  {exam.duration} mins
                </p>

              </div>

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

          ))}

        </div>

      </div>

    </AdminLayout>
  );

}
