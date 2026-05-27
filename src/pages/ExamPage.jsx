import { useEffect, useMemo, useState } from "react";

import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";

import { db } from "../firebase/config";

import AdminLayout from "./AdminLayout";

import { listenSubjects } from "../services/subjectService";

export default function Exams() {

  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [selectedMockType, setSelectedMockType] =
    useState("");

  const [selectedSubject, setSelectedSubject] =
    useState("");

  const [selectedTopic, setSelectedTopic] =
    useState("");

  const [selectedSubTopic, setSelectedSubTopic] =
    useState("");

  // LOAD EXAMS

  useEffect(() => {

    const unsubscribe = onSnapshot(

      collection(db, "exams"),

      (snapshot) => {

        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setExams(data);
      }

    );

    return () => unsubscribe();

  }, []);

  // LOAD SUBJECTS

  useEffect(() => {

    const unsubscribe =
      listenSubjects(setSubjects);

    return () => unsubscribe();

  }, []);

  // FILTERED TOPICS

  const filteredTopics = useMemo(() => {

    return [

      ...new Set(

        exams

          .filter((exam) =>

            selectedSubject
              ? exam.subjectId === selectedSubject
              : true

          )

          .map((exam) =>
            exam.topicName || exam.topic || ""
          )

          .filter(Boolean)

      )

    ];

  }, [exams, selectedSubject]);

  // FILTERED SUBTOPICS

  const filteredSubTopics = useMemo(() => {

    return [

      ...new Set(

        exams

          .filter((exam) =>

            selectedTopic
              ? (
                  exam.topicName === selectedTopic ||
                  exam.topic === selectedTopic
                )
              : true

          )

          .map((exam) =>
            exam.subTopicName ||
            exam.subTopic ||
            ""
          )

          .filter(Boolean)

      )

    ];

  }, [exams, selectedTopic]);

  // FILTER EXAMS

  const filteredExams = exams.filter((exam) => {

    const mockTypeMatch =

      selectedMockType
        ? (
            (exam.mockType || "sectional")
            === selectedMockType
          )
        : true;

    const subjectMatch =

      selectedSubject
        ? exam.subjectId === selectedSubject
        : true;

    const topicValue =
      exam.topicName || exam.topic || "";

    const topicMatch =

      selectedTopic
        ? topicValue === selectedTopic
        : true;

    const subTopicValue =
      exam.subTopicName || exam.subTopic || "";

    const subTopicMatch =

      selectedMockType === "full"

        ? true

        : (

            selectedSubTopic
              ? subTopicValue === selectedSubTopic
              : true
          );

    return (
      mockTypeMatch &&
      subjectMatch &&
      topicMatch &&
      subTopicMatch
    );

  });

  // DELETE

  async function handleDelete(id) {

    const confirmDelete =
      window.confirm("Delete exam?");

    if (!confirmDelete) return;

    try {

      await deleteDoc(doc(db, "exams", id));

    }
    catch (error) {

      console.error(error);

      alert("Delete Failed");
    }
  }

  // SUBJECT NAME

  function getSubjectName(id) {

    return (
      subjects.find((s) => s.id === id)?.name
      || "-"
    );

  }

  return (

    <AdminLayout>

      <div className="page">

        {/* HEADER */}

        <div className="page-header">

          <div>

            <h2>Exams</h2>

            <p>
              Manage generated mocks
            </p>

          </div>

        </div>

        {/* FILTERS */}

        <div className="filter-bar">

          {/* MOCK TYPE */}

          <select
            value={selectedMockType}
            onChange={(e) => {

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

          {/* SUBJECT */}

          <select
            value={selectedSubject}
            onChange={(e) =>
              setSelectedSubject(
                e.target.value
              )
            }
          >

            <option value="">
              All Subjects
            </option>

            {
              subjects.map((subject) => (

                <option
                  key={subject.id}
                  value={subject.id}
                >

                  {subject.name}

                </option>

              ))
            }

          </select>

          {/* TOPIC */}

          <select
            value={selectedTopic}
            onChange={(e) =>
              setSelectedTopic(
                e.target.value
              )
            }
          >

            <option value="">
              All Topics
            </option>

            {
              filteredTopics.map((topic) => (

                <option
                  key={topic}
                  value={topic}
                >

                  {topic}

                </option>

              ))
            }

          </select>

          {/* SUBTOPIC */}

          {
            selectedMockType !== "full" && (

              <select
                value={selectedSubTopic}
                onChange={(e) =>
                  setSelectedSubTopic(
                    e.target.value
                  )
                }
              >

                <option value="">
                  All Sub Topics
                </option>

                {
                  filteredSubTopics.map((subTopic) => (

                    <option
                      key={subTopic}
                      value={subTopic}
                    >

                      {subTopic}

                    </option>

                  ))
                }

              </select>

            )
          }

        </div>

        {/* EXAM CARDS */}

        <div className="exam-grid">

          {
            filteredExams.map((exam) => {

              const topic =
                exam.topicName ||
                exam.topic ||
                "-";

              const subTopic =
                exam.subTopicName ||
                exam.subTopic ||
                "-";

              const questionCount =

                exam.totalQuestions ||

                exam.questionCount ||

                exam.questionIds?.length ||

                exam.questions?.length ||

                0;

              return (

                <div
                  key={exam.id}
                  className="exam-card"
                >

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

                  <h2 className="exam-title">

                    {exam.name || "-"}

                  </h2>

                  <div className="exam-details">

                    <p>
                      <strong>Subject:</strong>{" "}
                      {
                        getSubjectName(
                          exam.subjectId
                        )
                      }
                    </p>

                    <p>
                      <strong>Topic:</strong>{" "}
                      {topic}
                    </p>

                    {
                      (exam.mockType || "sectional")
                      === "sectional" && (

                        <p>
                          <strong>Sub Topic:</strong>{" "}
                          {subTopic}
                        </p>

                      )
                    }

                    <p>
                      <strong>Questions:</strong>{" "}
                      {questionCount}
                    </p>

                    <p>
                      <strong>Duration:</strong>{" "}
                      {exam.duration || 0} mins
                    </p>

                  </div>

                  <div className="exam-actions">

                    <button
                      className="delete-btn"
                      onClick={() =>
                        handleDelete(exam.id)
                      }
                    >
                      Delete
                    </button>

                  </div>

                </div>

              );

            })
          }

        </div>

      </div>

    </AdminLayout>

  );
}
