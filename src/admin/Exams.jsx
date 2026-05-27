import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  collection,
  onSnapshot,
  deleteDoc,
  updateDoc,
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
  const [sortOrder, setSortOrder] = useState("default"); // "default" or "recent"
  const [selectedSubject,setSelectedSubject] = useState("");
  const [selectedTopic,setSelectedTopic] = useState("");
  const [selectedSubTopic,setSelectedSubTopic] = useState("");

  // --- State for Editing ---
  const [editingExamId, setEditingExamId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    mockType: "sectional",
    subjectId: "",
    topicName: "",
    subTopicName: "",
    duration: 0,
    totalQuestions: 0
  });

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

  // Global Filter Topics
  const filteredTopics = useMemo(()=>{
    return [
      ...new Set(
        exams
          .filter((e)=> selectedSubject ? e.subjectId === selectedSubject : true)
          .map((e)=> e.topicName)
          .filter(Boolean)
      )
    ];
  },[exams, selectedSubject]);

  // Global Filter Sub Topics
  const filteredSubTopics = useMemo(()=>{
    return [
      ...new Set(
        exams
          .filter((e)=> selectedTopic ? e.topicName === selectedTopic : true)
          .map((e)=> e.subTopicName)
          .filter(Boolean)
      )
    ];
  },[exams, selectedTopic]);

  // --- Dynamic Dropdown Options for the EDIT Form ---
  const editFormTopics = useMemo(() => {
    return [
      ...new Set(
        exams
          .filter((e) => editFormData.subjectId ? e.subjectId === editFormData.subjectId : true)
          .map((e) => e.topicName)
          .filter(Boolean)
      )
    ];
  }, [exams, editFormData.subjectId]);

  const editFormSubTopics = useMemo(() => {
    return [
      ...new Set(
        exams
          .filter((e) => editFormData.topicName ? e.topicName === editFormData.topicName : true)
          .map((e) => e.subTopicName)
          .filter(Boolean)
      )
    ];
  }, [exams, editFormData.topicName]);


  const filteredAndSortedExams = useMemo(() => {
    // 1. Filter implementation
    const filtered = exams.filter((exam) => {
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

      return mockTypeMatch && subjectMatch && topicMatch && subTopicMatch;
    });

    // 2. Sort implementation
    return filtered.sort((a, b) => {
      if (sortOrder === "recent") {
        const timeA = a.createdAt?.seconds || a.createdAt || 0;
        const timeB = b.createdAt?.seconds || b.createdAt || 0;

        if (timeB !== timeA) {
          return timeB - timeA; // Newest first
        }
        return String(b.id).localeCompare(String(a.id));
      } else {
        const nameA = a.name || "";
        const nameB = b.name || "";
        return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
      }
    });
  }, [exams, selectedMockType, selectedSubject, selectedTopic, selectedSubTopic, sortOrder]);

  function getSubjectName(id){
    return subjects.find((s)=> s.id === id)?.name || "-";
  }

  async function handleDelete(id){
    const confirmDelete = window.confirm("Delete this exam?");
    if(!confirmDelete) return;
    await deleteDoc(doc(db,"exams",id));
  }

  // --- Edit Handler Functions ---
  function handleStartEdit(exam) {
    setEditingExamId(exam.id);
    setEditFormData({
      name: exam.name || "",
      mockType: exam.mockType || "sectional",
      subjectId: exam.subjectId || "",
      topicName: exam.topicName || "",
      subTopicName: exam.subTopicName || "",
      duration: exam.duration || 0,
      totalQuestions: exam.totalQuestions || exam.questionCount || exam.questionIds?.length || exam.questions?.length || 0
    });
  }

  function handleEditFormChange(e) {
    const { name, value } = e.target;
    
    setEditFormData((prev) => {
      const updated = {
        ...prev,
        [name]: name === "duration" || name === "totalQuestions" ? Number(value) : value,
      };

      // Reset nested values on parent dropdown change
      if (name === "mockType" && value === "full") {
        updated.subTopicName = "";
      }
      if (name === "subjectId") {
        updated.topicName = "";
        updated.subTopicName = "";
      }
      if (name === "topicName") {
        updated.subTopicName = "";
      }

      return updated;
    });
  }

  async function handleUpdate(e, id) {
    e.preventDefault();
    try {
      const examRef = doc(db, "exams", id);
      
      const updatedFields = {
        name: editFormData.name,
        mockType: editFormData.mockType,
        subjectId: editFormData.subjectId,
        topicName: editFormData.topicName,
        subTopicName: editFormData.mockType === "full" ? "" : editFormData.subTopicName,
        duration: editFormData.duration,
        totalQuestions: editFormData.totalQuestions
      };

      await updateDoc(examRef, updatedFields);
      setEditingExamId(null); 
    } catch (error) {
      console.error("Error updating exam: ", error);
      alert("Failed to update exam field properties.");
    }
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
          {/* 1. Mock Type */}
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

          {/* 2. Sorting Option Dropdown (Inserted Here) */}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="default">Sort: Default (Ascending)</option>
            <option value="recent">Sort: Recently Added</option>
          </select>

          {/* 3. Subject */}
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

          {/* 4. Topic */}
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

          {/* 5. Sub Topic */}
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
          {filteredAndSortedExams.map((exam)=>(
            <div key={exam.id} className="exam-card">

              {editingExamId === exam.id ? (
                // --- EDITING MODE FORM ---
                <form onSubmit={(e) => handleUpdate(e, exam.id)} className="edit-exam-form">
                  <h3>Edit Exam</h3>
                  
                  <label>Exam Name:</label>
                  <input
                    type="text"
                    name="name"
                    value={editFormData.name}
                    onChange={handleEditFormChange}
                    required
                  />

                  <label>Mock Type:</label>
                  <select
                    name="mockType"
                    value={editFormData.mockType}
                    onChange={handleEditFormChange}
                  >
                    <option value="sectional">Sectional Mock</option>
                    <option value="full">Full Mock</option>
                  </select>

                  <label>Subject:</label>
                  <select
                    name="subjectId"
                    value={editFormData.subjectId}
                    onChange={handleEditFormChange}
                  >
                    <option value="">Select Subject</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>

                  {/* TOPIC DROPDOWN */}
                  <label>Topic Name:</label>
                  <select
                    name="topicName"
                    value={editFormData.topicName}
                    onChange={handleEditFormChange}
                  >
                    <option value="">Select Topic</option>
                    {editFormTopics.map((topic) => (
                      <option key={topic} value={topic}>{topic}</option>
                    ))}
                  </select>

                  {/* SUB TOPIC DROPDOWN (Hidden dynamically if Full Mock) */}
                  {editFormData.mockType !== "full" && (
                    <>
                      <label>Sub Topic Name:</label>
                      <select
                        name="subTopicName"
                        value={editFormData.subTopicName}
                        onChange={handleEditFormChange}
                      >
                        <option value="">Select Sub Topic</option>
                        {editFormSubTopics.map((subTopic) => (
                          <option key={subTopic} value={subTopic}>{subTopic}</option>
                        ))}
                      </select>
                    </>
                  )}

                  <label>Questions Count:</label>
                  <input
                    type="number"
                    name="totalQuestions"
                    value={editFormData.totalQuestions}
                    onChange={handleEditFormChange}
                  />

                  <label>Duration (mins):</label>
                  <input
                    type="number"
                    name="duration"
                    value={editFormData.duration}
                    onChange={handleEditFormChange}
                  />

                  <div className="exam-actions" style={{ marginTop: '15px' }}>
                    <button type="submit" className="save-btn">Save</button>
                    <button type="button" className="cancel-btn" onClick={() => setEditingExamId(null)}>
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                // --- VIEW MODE ---
                <>
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
                      className="edit-btn"
                      onClick={() => handleStartEdit(exam)}
                    >
                      Edit
                    </button>
                    <button
                      className="delete-btn"
                      onClick={()=> handleDelete(exam.id)}
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}

            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
