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

import {
  db,
} from "../firebase/config";

import {
  listenSubjects,
} from "../services/subjectService";

export default function Exams() {

  // =========================================
  // STATES
  // =========================================

  const [exams,
    setExams] = useState([]);

  const [subjects,
    setSubjects] = useState([]);

  const [selectedSubject,
    setSelectedSubject] =
      useState("");

  const [selectedTopic,
    setSelectedTopic] =
      useState("");

  const [selectedSubTopic,
    setSelectedSubTopic] =
      useState("");

  const [editingExam,
    setEditingExam] =
      useState(null);

  const [showModal,
    setShowModal] =
      useState(false);

  // =========================================
  // LOAD EXAMS
  // =========================================

  useEffect(() => {

    const unsubscribe =
      onSnapshot(

        collection(db, "exams"),

        (snapshot) => {

          const data =
            snapshot.docs.map((doc)=>({

              id:doc.id,
              ...doc.data(),

            }));

          setExams(data);
        }
      );

    return () => unsubscribe();

  }, []);

  // =========================================
  // LOAD SUBJECTS
  // =========================================

  useEffect(() => {

    const unsubscribe =
      listenSubjects(setSubjects);

    return () => unsubscribe();

  }, []);

  // =========================================
  // TOPICS
  // =========================================

  const topics =
    useMemo(()=>{

      return [

        ...new Set(

          exams
            .map((e)=>e.topicId)
            .filter(Boolean)

        ),

      ];

    },[exams]);

  // =========================================
  // SUB TOPICS
  // =========================================

  const subTopics =
    useMemo(()=>{

      return [

        ...new Set(

          exams
            .map((e)=>e.subTopicId)
            .filter(Boolean)

        ),

      ];

    },[exams]);

  // =========================================
  // FILTERED EXAMS
  // =========================================

  const filteredExams =
    exams.filter((exam)=>{

      const subjectMatch =
        selectedSubject
          ? exam.subjectId ===
            selectedSubject
          : true;

      const topicMatch =
        selectedTopic
          ? exam.topicId ===
            selectedTopic
          : true;

      const subTopicMatch =
        selectedSubTopic
          ? exam.subTopicId ===
            selectedSubTopic
          : true;

      return (
        subjectMatch &&
        topicMatch &&
        subTopicMatch
      );
    });

  // =========================================
  // HELPERS
  // =========================================

  function getSubjectName(id){

    return (
      subjects.find(
        (s)=>s.id===id
      )?.name || "-"
    );
  }

  // =========================================
  // DELETE
  // =========================================

  async function handleDelete(id){

    const confirmDelete =
      window.confirm(
        "Delete this exam?"
      );

    if(!confirmDelete) return;

    await deleteDoc(
      doc(db,"exams",id)
    );
  }

  // =========================================
  // EDIT
  // =========================================

  function handleEdit(exam){

    setEditingExam(exam);

    setShowModal(true);
  }

  // =========================================
  // SAVE EDIT
  // =========================================

  async function handleSave(){

    if(!editingExam) return;

    await updateDoc(

      doc(
        db,
        "exams",
        editingExam.id
      ),

      {

        name:
          editingExam.name,

        subjectId:
          editingExam.subjectId,

        topicId:
          editingExam.topicId,

        subTopicId:
          editingExam.subTopicId,

        totalQuestions:
          Number(
            editingExam.totalQuestions
          ),

        duration:
          Number(
            editingExam.duration
          ),

      }

    );

    alert(
      "Exam Updated Successfully"
    );

    setShowModal(false);
  }

  // =========================================
  // UI
  // =========================================

  return (

    <div className="page">

      {/* HEADER */}

      <div className="page-header">

        <div>

          <h2>
            Exams
          </h2>

          <p>
            Manage generated mocks
          </p>

        </div>

      </div>

      {/* ===================================== */}
      {/* FILTERS */}
      {/* ===================================== */}

      <div className="filter-bar">

        {/* SUBJECT */}

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

          {subjects.map((subject)=>(

            <option
              key={subject.id}
              value={subject.id}
            >
              {subject.name}
            </option>

          ))}

        </select>

        {/* TOPIC */}

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

          {topics.map((topic)=>(

            <option
              key={topic}
              value={topic}
            >
              {topic}
            </option>

          ))}

        </select>

        {/* SUB TOPIC */}

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

          {subTopics.map((subTopic)=>(

            <option
              key={subTopic}
              value={subTopic}
            >
              {subTopic}
            </option>

          ))}

        </select>

      </div>

      {/* ===================================== */}
      {/* GRID */}
      {/* ===================================== */}

      <div className="exam-grid">

        {filteredExams.map((exam)=>(

          <div
            key={exam.id}
            className="exam-card"
          >

            {/* BADGE */}

            <div
              className={`exam-badge ${
                exam.mockType === "full"
                  ? "full-badge"
                  : "sectional-badge"
              }`}
            >

              {exam.mockType === "full"
                ? "FULL MOCK"
                : "SECTIONAL MOCK"}

            </div>

            {/* TITLE */}

            <h2 className="exam-card-title">

              {exam.name}

            </h2>

            {/* DETAILS */}

            <div className="exam-details">

              <p>

                <strong>
                  Subject:
                </strong>{" "}

                {getSubjectName(
                  exam.subjectId
                )}

              </p>

              <p>

                <strong>
                  Topic:
                </strong>{" "}

                {exam.topicId || "-"}

              </p>

              <p>

                <strong>
                  Sub Topic:
                </strong>{" "}

                {exam.subTopicId || "-"}

              </p>

              <p>

                <strong>
                  Quantity:
                </strong>{" "}

                {exam.totalQuestions}

              </p>

              <p>

                <strong>
                  Duration:
                </strong>{" "}

                {exam.duration} mins

              </p>

            </div>

            {/* ACTIONS */}

            <div className="exam-actions">

              <button
                className="edit-btn"
                onClick={()=>
                  handleEdit(exam)
                }
              >
                Edit
              </button>

              <button
                className="delete-btn"
                onClick={()=>
                  handleDelete(
                    exam.id
                  )
                }
              >
                Delete
              </button>

            </div>

          </div>

        ))}

      </div>

      {/* ===================================== */}
      {/* MODAL */}
      {/* ===================================== */}

      {showModal &&
        editingExam && (

        <div className="popup-overlay">

          <div className="popup exam-edit-modal">

            <h3>
              Edit Exam
            </h3>

            <div className="exam-edit-grid">

              {/* NAME */}

              <input
                className="exam-full-width"
                type="text"
                placeholder="Exam Name"
                value={editingExam.name}
                onChange={(e)=>
                  setEditingExam({

                    ...editingExam,

                    name:
                      e.target.value,

                  })
                }
              />

              {/* SUBJECT */}

              <select
                value={
                  editingExam.subjectId
                }
                onChange={(e)=>
                  setEditingExam({

                    ...editingExam,

                    subjectId:
                      e.target.value,

                  })
                }
              >

                <option value="">
                  Select Subject
                </option>

                {subjects.map((subject)=>(

                  <option
                    key={subject.id}
                    value={subject.id}
                  >
                    {subject.name}
                  </option>

                ))}

              </select>

              {/* TOPIC */}

              <input
                type="text"
                placeholder="Topic"
                value={
                  editingExam.topicId || ""
                }
                onChange={(e)=>
                  setEditingExam({

                    ...editingExam,

                    topicId:
                      e.target.value,

                  })
                }
              />

              {/* SUB TOPIC */}

              <input
                type="text"
                placeholder="Sub Topic"
                value={
                  editingExam.subTopicId || ""
                }
                onChange={(e)=>
                  setEditingExam({

                    ...editingExam,

                    subTopicId:
                      e.target.value,

                  })
                }
              />

              {/* QUANTITY */}

              <select
                value={
                  editingExam.totalQuestions
                }
                onChange={(e)=>
                  setEditingExam({

                    ...editingExam,

                    totalQuestions:
                      e.target.value,

                  })
                }
              >

                <option value={100}>
                  100
                </option>

                <option value={50}>
                  50
                </option>

                <option value={25}>
                  25
                </option>

              </select>

              {/* DURATION */}

              <select
                value={
                  editingExam.duration
                }
                onChange={(e)=>
                  setEditingExam({

                    ...editingExam,

                    duration:
                      e.target.value,

                  })
                }
              >

                <option value={60}>
                  60 mins
                </option>

                <option value={45}>
                  45 mins
                </option>

                <option value={30}>
                  30 mins
                </option>

                <option value={15}>
                  15 mins
                </option>

                <option value={10}>
                  10 mins
                </option>

              </select>

            </div>

            {/* ACTIONS */}

            <div className="exam-actions">

              <button
                className="submit-btn"
                onClick={handleSave}
              >
                Save
              </button>

              <button
                className="cancel-btn"
                onClick={()=>
                  setShowModal(false)
                }
              >
                Cancel
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}
