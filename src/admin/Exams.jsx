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

export default function Exams() {

  const [subjects,setSubjects] =
    useState([]);

  const [topics,setTopics] =
    useState([]);

  const [subTopics,setSubTopics] =
    useState([]);

  const [exams,setExams] =
    useState([]);

  const [showPopup,
    setShowPopup] =
    useState(false);

  const [editingId,
    setEditingId] =
    useState(null);

  const [examName,
    setExamName] =
    useState("");

  const [examType,
    setExamType] =
    useState("subject");

  const [selectedSubject,
    setSelectedSubject] =
    useState("");

  const [selectedTopic,
    setSelectedTopic] =
    useState("");

  const [selectedSubTopic,
    setSelectedSubTopic] =
    useState("");

  const [questionCount,
    setQuestionCount] =
    useState(10);

  const [duration,
    setDuration] =
    useState(30);

  const [negativeMarking,
    setNegativeMarking] =
    useState(0.25);

  const [shuffleQuestions,
    setShuffleQuestions] =
    useState(true);

  useEffect(()=>{

    const unsubSubjects =
      onSnapshot(
        collection(db,"subjects"),
        (snapshot)=>{

          setSubjects(
            snapshot.docs.map(
              (doc)=>({
                id:doc.id,
                ...doc.data(),
              })
            )
          );

        }
      );

    const unsubTopics =
      onSnapshot(
        collection(db,"topics"),
        (snapshot)=>{

          setTopics(
            snapshot.docs.map(
              (doc)=>({
                id:doc.id,
                ...doc.data(),
              })
            )
          );

        }
      );

    const unsubSubTopics =
      onSnapshot(
        collection(db,"subtopics"),
        (snapshot)=>{

          setSubTopics(
            snapshot.docs.map(
              (doc)=>({
                id:doc.id,
                ...doc.data(),
              })
            )
          );

        }
      );

    const unsubExams =
      onSnapshot(
        collection(db,"exams"),
        (snapshot)=>{

          setExams(
            snapshot.docs.map(
              (doc)=>({
                id:doc.id,
                ...doc.data(),
              })
            )
          );

        }
      );

    return ()=>{

      unsubSubjects();
      unsubTopics();
      unsubSubTopics();
      unsubExams();

    };

  },[]);

  const filteredTopics =
    topics.filter(
      (t)=>
        t.subjectId ===
        selectedSubject
    );

  const filteredSubTopics =
    subTopics.filter(
      (s)=>
        s.subjectId ===
          selectedSubject &&
        s.topicId ===
          selectedTopic
    );

  async function handleAddExam(){

    if(
      !examName.trim()
    ){

      toast.error(
        "Exam name required"
      );

      return;

    }

    if(
      Number(questionCount) <= 0
    ){

      toast.error(
        "Invalid question count"
      );

      return;

    }

    if(
      Number(duration) <= 0
    ){

      toast.error(
        "Invalid duration"
      );

      return;

    }

    if(
      examType !== "mixed" &&
      !selectedSubject
    ){

      toast.error(
        "Select subject"
      );

      return;

    }

    if(
      examType === "topic" &&
      !selectedTopic
    ){

      toast.error(
        "Select topic"
      );

      return;

    }

    if(
      examType === "subtopic" &&
      !selectedSubTopic
    ){

      toast.error(
        "Select subtopic"
      );

      return;

    }

    const duplicateQuery =
      query(
        collection(db,"exams"),
        where(
          "name",
          "==",
          examName.trim()
        )
      );

    const duplicate =
      await getDocs(
        duplicateQuery
      );

    if(!duplicate.empty){

      toast.error(
        "Exam already exists"
      );

      return;

    }

    await addDoc(
      collection(db,"exams"),
      {

        name:
          examName.trim(),

        examType,

        subjectId:
          selectedSubject || null,

        topicId:
          selectedTopic || null,

        subTopicId:
          selectedSubTopic || null,

        questionCount:
          Number(questionCount),

        duration:
          Number(duration),

        negativeMarking:
          Number(
            negativeMarking
          ),

        shuffleQuestions,

        createdAt:
          Date.now(),

      }
    );

    toast.success(
      "Exam Created"
    );

    resetForm();

  }

  async function updateExam(){

    if(
      !examName.trim()
    ){

      toast.error(
        "Exam name required"
      );

      return;

    }

    await updateDoc(
      doc(
        db,
        "exams",
        editingId
      ),
      {

        name:
          examName.trim(),

        examType,

        subjectId:
          selectedSubject || null,

        topicId:
          selectedTopic || null,

        subTopicId:
          selectedSubTopic || null,

        questionCount:
          Number(questionCount),

        duration:
          Number(duration),

        negativeMarking:
          Number(
            negativeMarking
          ),

        shuffleQuestions,

      }
    );

    toast.success(
      "Exam Updated"
    );

    resetForm();

  }

  function editExam(exam){

    setEditingId(exam.id);

    setExamName(exam.name);

    setExamType(
      exam.examType ||
      "subject"
    );

    setSelectedSubject(
      exam.subjectId || ""
    );

    setSelectedTopic(
      exam.topicId || ""
    );

    setSelectedSubTopic(
      exam.subTopicId || ""
    );

    setQuestionCount(
      exam.questionCount
    );

    setDuration(
      exam.duration
    );

    setNegativeMarking(
      exam.negativeMarking
    );

    setShuffleQuestions(
      exam.shuffleQuestions
    );

    setShowPopup(true);

  }

  async function handleDelete(id){

    const confirmDelete =
      window.confirm(
        "Delete Exam?"
      );

    if(!confirmDelete)
    return;

    await deleteDoc(
      doc(db,"exams",id)
    );

    toast.success(
      "Exam Deleted"
    );

  }

  function resetForm(){

    setExamName("");

    setExamType("subject");

    setQuestionCount(10);

    setDuration(30);

    setNegativeMarking(0.25);

    setShuffleQuestions(true);

    setEditingId(null);

    setShowPopup(false);

  }

  return(

    <AdminLayout>

      <div className="page-header">

        <div>

          <h2>
            Advanced Exams
          </h2>

          <p>
            Total Exams:
            {" "}
            {exams.length}
          </p>

        </div>

        <button
          onClick={()=>
            setShowPopup(true)
          }
        >
          + Create Exam
        </button>

      </div>

      <div className="table-card">

        <table>

          <thead>

            <tr>

              <th>
                Exam
              </th>

              <th>
                Type
              </th>

              <th>
                Questions
              </th>

              <th>
                Duration
              </th>

              <th>
                Edit
              </th>

              <th>
                Delete
              </th>

            </tr>

          </thead>

          <tbody>

            {
              exams.map((e)=>(

              <tr key={e.id}>

                <td>
                  {e.name}
                </td>

                <td>
                  {e.examType}
                </td>

                <td>
                  {e.questionCount}
                </td>

                <td>
                  {e.duration}m
                </td>

                <td>

                  <button
                    className="edit-btn"
                    onClick={()=>
                      editExam(e)
                    }
                  >
                    Edit
                  </button>

                </td>

                <td>

                  <button
                    className="delete-btn"
                    onClick={()=>
                      handleDelete(e.id)
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

      {
        showPopup && (

        <div className="popup-overlay">

          <div className="
popup
large-popup
">

            <h3>

              {
                editingId
                ?
                "Edit Exam"
                :
                "Create Exam"
              }

            </h3>

            <input
              placeholder="Exam Name"
              value={examName}
              onChange={(e)=>
                setExamName(
                  e.target.value
                )
              }
            />

            <select
              value={examType}
              onChange={(e)=>
                setExamType(
                  e.target.value
                )
              }
            >

              <option value="subject">
                Subject Exam
              </option>

              <option value="topic">
                Topic Exam
              </option>

              <option value="subtopic">
                SubTopic Exam
              </option>

              <option value="mixed">
                Mixed Exam
              </option>

            </select>

            {
              examType !== "mixed" && (

              <select
                value={
                  selectedSubject
                }
                onChange={(e)=>
                  setSelectedSubject(
                    e.target.value
                  )
                }
              >

                <option value="">
                  Select Subject
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

              )
            }
            
{
  (examType === "topic" ||
   examType === "subtopic") &&

  (
  <select
    value={
      selectedTopic
    }
    onChange={(e)=>
      setSelectedTopic(
        e.target.value
      )
    }
  >

    <option value="">
      Select Topic
    </option>

    {
      filteredTopics.map((t)=>(

      <option
        key={t.id}
        value={t.id}
      >
        {t.name}
      </option>

      ))
    }

  </select>
  )
}

            {
              examType === "subtopic" &&
              (
              <select
                value={
                  selectedSubTopic
                }
                onChange={(e)=>
                  setSelectedSubTopic(
                    e.target.value
                  )
                }
              >

                <option value="">
                  Select SubTopic
                </option>

                {
                  filteredSubTopics.map((s)=>(

                  <option
                    key={s.id}
                    value={s.id}
                  >
                    {s.name}
                  </option>

                  ))
                }

              </select>
              )
            }

            <input
              type="number"
              placeholder="
Question Count
"
              value={questionCount}
              onChange={(e)=>
                setQuestionCount(
                  e.target.value
                )
              }
            />

            <input
              type="number"
              placeholder="
Duration
"
              value={duration}
              onChange={(e)=>
                setDuration(
                  e.target.value
                )
              }
            />

            <input
              type="number"
              step="0.25"
              placeholder="
Negative Marking
"
              value={negativeMarking}
              onChange={(e)=>
                setNegativeMarking(
                  e.target.value
                )
              }
            />

            <label
              className="checkbox"
            >

              <input
                type="checkbox"
                checked={
                  shuffleQuestions
                }
                onChange={(e)=>
                  setShuffleQuestions(
                    e.target.checked
                  )
                }
              />

              Shuffle Questions

            </label>

            {
              editingId
              ?
              (
              <button
                onClick={
                  updateExam
                }
              >
                Update Exam
              </button>
              )
              :
              (
              <button
                onClick={
                  handleAddExam
                }
              >
                Create Exam
              </button>
              )
            }

            <button
              className="
cancel-btn
"
              onClick={
                resetForm
              }
            >
              Cancel
            </button>

          </div>

        </div>

        )
      }

    </AdminLayout>

  );

}
