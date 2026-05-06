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
} from "firebase/firestore";

import { db } from "../firebase/config";

import AdminLayout from "./AdminLayout";

export default function Exams() {

  const [subjects, setSubjects] =
    useState([]);

  const [topics, setTopics] =
    useState([]);

  const [subTopics, setSubTopics] =
    useState([]);

  const [exams, setExams] =
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

  useEffect(() => {

    const unsubSubjects =
      onSnapshot(
        collection(db, "subjects"),
        (snapshot) => {

          const data =
            snapshot.docs.map(
              (doc) => ({
                id: doc.id,
                ...doc.data(),
              })
            );

          setSubjects(data);

          if (
            data.length > 0 &&
            !selectedSubject
          ) {
            setSelectedSubject(
              data[0].id
            );
          }

        }
      );

    return () =>
      unsubSubjects();

  }, []);

  useEffect(() => {

    const unsubTopics =
      onSnapshot(
        collection(db, "topics"),
        (snapshot) => {

          const data =
            snapshot.docs.map(
              (doc) => ({
                id: doc.id,
                ...doc.data(),
              })
            );

          setTopics(data);

        }
      );

    return () =>
      unsubTopics();

  }, []);

  useEffect(() => {

    const unsubSubTopics =
      onSnapshot(
        collection(db, "subtopics"),
        (snapshot) => {

          const data =
            snapshot.docs.map(
              (doc) => ({
                id: doc.id,
                ...doc.data(),
              })
            );

          setSubTopics(data);

        }
      );

    return () =>
      unsubSubTopics();

  }, []);

  useEffect(() => {

    const unsubExams =
      onSnapshot(
        collection(db, "exams"),
        (snapshot) => {

          const data =
            snapshot.docs.map(
              (doc) => ({
                id: doc.id,
                ...doc.data(),
              })
            );

          setExams(data);

        }
      );

    return () =>
      unsubExams();

  }, []);

  const filteredTopics =
    topics.filter(
      (t) =>
        t.subjectId ===
        selectedSubject
    );

  const filteredSubTopics =
    subTopics.filter(
      (s) =>
        s.subjectId ===
          selectedSubject &&
        s.topicId ===
          selectedTopic
    );

  useEffect(() => {

    if (
      filteredTopics.length > 0
    ) {
      setSelectedTopic(
        filteredTopics[0].id
      );
    }

  }, [selectedSubject]);

  useEffect(() => {

    if (
      filteredSubTopics.length > 0
    ) {
      setSelectedSubTopic(
        filteredSubTopics[0].id
      );
    }

  }, [selectedTopic]);

  async function handleAddExam() {

    await addDoc(
      collection(db, "exams"),
      {

        name: examName,

        subjectId:
          selectedSubject,

        topicId:
          selectedTopic,

        subTopicId:
          selectedSubTopic,

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

    resetForm();
  }

  function editExam(exam) {

    setEditingId(exam.id);

    setExamName(exam.name);

    setSelectedSubject(
      exam.subjectId
    );

    setSelectedTopic(
      exam.topicId
    );

    setSelectedSubTopic(
      exam.subTopicId
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

  async function updateExam() {

    await updateDoc(
      doc(
        db,
        "exams",
        editingId
      ),
      {

        name: examName,

        subjectId:
          selectedSubject,

        topicId:
          selectedTopic,

        subTopicId:
          selectedSubTopic,

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

    resetForm();
  }

  async function handleDelete(id) {

    const confirmDelete =
      window.confirm(
        "Delete Exam?"
      );

    if (!confirmDelete)
      return;

    await deleteDoc(
      doc(
        db,
        "exams",
        id
      )
    );
  }

  function resetForm() {

    setExamName("");

    setQuestionCount(10);

    setDuration(30);

    setNegativeMarking(0.25);

    setShuffleQuestions(true);

    setEditingId(null);

    setShowPopup(false);
  }

  function getName(
    arr,
    id
  ) {

    const item =
      arr.find(
        (x) => x.id === id
      );

    return item
      ? item.name
      : "Unknown";
  }

  return (

    <AdminLayout>

      <div className="page-header">

        <div>

          <h2>
            Exam Management
          </h2>

          <p>
            Total Exams:
            {" "}
            {exams.length}
          </p>

        </div>

        <button
          onClick={() =>
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
                Subject
              </th>

              <th>
                Questions
              </th>

              <th>
                Duration
              </th>

              <th>
                Negative
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
              exams.map((e) => (

                <tr key={e.id}>

                  <td>
                    {e.name}
                  </td>

                  <td>
                    {
                      getName(
                        subjects,
                        e.subjectId
                      )
                    }
                  </td>

                  <td>
                    {
                      e.questionCount
                    }
                  </td>

                  <td>
                    {e.duration} min
                  </td>

                  <td>
                    {
                      e.negativeMarking
                    }
                  </td>

                  <td>

                    <button
                      className="edit-btn"
                      onClick={() =>
                        editExam(e)
                      }
                    >
                      Edit
                    </button>

                  </td>

                  <td>

                    <button
                      className="delete-btn"
                      onClick={() =>
                        handleDelete(
                          e.id
                        )
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

            <div className="popup large-popup">

              <h3>

                {
                  editingId
                    ? "Edit Exam"
                    : "Create Exam"
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
                value={
                  selectedSubject
                }
                onChange={(e)=>
                  setSelectedSubject(
                    e.target.value
                  )
                }
              >

                {
                  subjects.map(
                    (s)=>(
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
                value={
                  selectedTopic
                }
                onChange={(e)=>
                  setSelectedTopic(
                    e.target.value
                  )
                }
              >

                {
                  filteredTopics.map(
                    (t)=>(
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
                value={
                  selectedSubTopic
                }
                onChange={(e)=>
                  setSelectedSubTopic(
                    e.target.value
                  )
                }
              >

                {
                  filteredSubTopics.map(
                    (s)=>(
                    <option
                      key={s.id}
                      value={s.id}
                    >
                      {s.name}
                    </option>
                  ))
                }

              </select>

              <input
                type="number"
                placeholder="Question Count"
                value={questionCount}
                onChange={(e)=>
                  setQuestionCount(
                    e.target.value
                  )
                }
              />

              <input
                type="number"
                placeholder="Duration"
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
                placeholder="Negative Marking"
                value={
                  negativeMarking
                }
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
                editingId ? (

                  <button
                    onClick={
                      updateExam
                    }
                  >
                    Update Exam
                  </button>

                ) : (

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
                className="cancel-btn"
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
