import {
  useEffect,
  useMemo,
  useState,
} from "react";

import AdminLayout from "./AdminLayout";

import {
  collection,
  getDocs,
  onSnapshot,
} from "firebase/firestore";

import { db } from "../firebase/config";

import {
  listenSubjects,
} from "../services/subjectService";

import {
  generateMocks,
} from "../services/mockGeneratorService";

export default function MockGeneratorPage(){

  const [subjects,setSubjects] = useState([]);
  const [topics,setTopics] = useState([]);
  const [subTopics,setSubTopics] = useState([]);
  const [questions,setQuestions] = useState([]);

  const [mockName,setMockName] = useState("");
  const [mockType,setMockType] = useState("sectional");
  const [subjectId,setSubjectId] = useState("");
  const [topic,setTopic] = useState("");
  const [subTopic,setSubTopic] = useState("");
  const [quantity,setQuantity] = useState(25);
  const [duration,setDuration] = useState(60);

  const [secondsPerQuestion,setSecondsPerQuestion] = useState(30);
  const [desiredMocks,setDesiredMocks] = useState(1);
  const [includeAllQuestions,setIncludeAllQuestions] = useState(true);
  const [distributionMode,setDistributionMode] = useState("balanced");
  const [manualDistribution,setManualDistribution] = useState("");
  const [distributionPreview,setDistributionPreview] = useState([]);

  const [loading,setLoading] = useState(false);
  const [generationProgress,setGenerationProgress] = useState(0);
  const [generatedMocks,setGeneratedMocks] = useState([]);

  /* SUBJECTS */
  useEffect(()=>{
    const unsubscribe = listenSubjects(setSubjects);
    return ()=>unsubscribe();
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
      collection(db,"subtopics"),
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
    async function loadQuestions(){
      const snapshot = await getDocs(collection(db,"questions"));
      const data = snapshot.docs.map((doc)=>({
        id:doc.id,
        ...doc.data(),
      }));
      setQuestions(data);
    }
    loadQuestions();
  },[]);

  /* FILTER TOPICS */
  const filteredTopics =
    topics.filter(
      (t)=> String(t.subjectId) === String(subjectId)
    );

  /* FILTER SUBTOPICS */
  const filteredSubTopics =
    subTopics.filter(
      (st)=>
        String(st.subjectId) === String(subjectId) &&
        String(st.topicId) === String(topic)
    );

  const selectedSubject =
    subjects.find((s)=> String(s.id) === String(subjectId));

  const selectedTopic =
    filteredTopics.find((t)=> String(t.id) === String(topic));

  const selectedSubTopic =
    filteredSubTopics.find((st)=> String(st.id) === String(subTopic));

  /* FILTER QUESTIONS — ✅ FIXED: now matches by IDs not name strings */
  const filteredQuestions =
    useMemo(()=>{
      return questions.filter((q)=>{

        const subjectMatch =
          subjectId
          ? String(q.subjectId || "").trim() === String(subjectId).trim()
          : true;

        const topicMatch =
          topic
          ? String(q.topicId || "").trim() === String(topic).trim()
          : true;

        const subTopicMatch =
          subTopic
          ? String(q.subTopicId || "").trim() === String(subTopic).trim()
          : true;

        return subjectMatch && topicMatch && subTopicMatch;

      });
    },[questions, subjectId, topic, subTopic, selectedSubject, selectedTopic, selectedSubTopic]);

  const totalQuestions = filteredQuestions.length;
  const totalMocks = Math.floor(totalQuestions / quantity);
  const remainder = totalQuestions % quantity;
  const calculatedMinutes = Math.ceil((totalQuestions * secondsPerQuestion) / 60);
  const recommendedStrategy = remainder > 0 ? "balanced" : "extra";

  /* AUTO DURATION */
  useEffect(()=>{
    if(calculatedMinutes > 0){
      setDuration(calculatedMinutes);
    }
  },[calculatedMinutes]);

  /* DISTRIBUTION */
  useEffect(()=>{

    if(!includeAllQuestions){
      setDistributionPreview([]);
      return;
    }

    if(totalQuestions <= 0){
      setDistributionPreview([]);
      return;
    }

    if(distributionMode === "balanced"){
      const totalCount = Math.ceil(totalQuestions / quantity);
      const base = Math.floor(totalQuestions / totalCount);
      const extra = totalQuestions % totalCount;
      const arr = [];
      for(let i=0; i<totalCount; i++){
        arr.push(base + (i < extra ? 1 : 0));
      }
      setDistributionPreview(arr);
    }

    if(distributionMode === "extra"){
      const arr = [];
      const full = Math.floor(totalQuestions / quantity);
      for(let i=0; i<full; i++){
        arr.push(quantity);
      }
      if(remainder > 0){
        arr.push(remainder);
      }
      setDistributionPreview(arr);
    }

    if(distributionMode === "manual"){
      const arr =
        manualDistribution
          .split(",")
          .map((n)=> Number(n.trim()))
          .filter(Boolean);
      setDistributionPreview(arr);
    }

  },[includeAllQuestions, distributionMode, manualDistribution, totalQuestions, quantity, remainder]);

  /* GENERATE */
  async function handleGenerate(){

    if(!mockName){
      alert("Enter mock name");
      return;
    }

    if(!subjectId){
      alert("Select subject");
      return;
    }

    if(quantity > totalQuestions){
      alert(`Only ${totalQuestions} questions available`);
      return;
    }

    if(desiredMocks > totalMocks && !includeAllQuestions){
      alert(`Maximum mocks possible is ${totalMocks}`);
      return;
    }

    try{

      setLoading(true);
      setGenerationProgress(0);

      const generated = [];

      const finalDistribution =
        includeAllQuestions
        ? distributionPreview
        : Array(desiredMocks).fill(quantity);

      for(let i=0; i<finalDistribution.length; i++){

        const currentName = `${mockName} ${i + 1}`;

        await generateMocks({
          mockName:   currentName,
          mockType,
          subject:    selectedSubject?.name || "",
          topic:      selectedTopic?.name   || "",
          subTopic:   selectedSubTopic?.name || "",
          subjectId,
          topicId:    topic,
          subTopicId: subTopic,
          duration:   Number(duration),
          distribution: [finalDistribution[i]],
          questions:  filteredQuestions,
        });

        generated.push(currentName);

        setGenerationProgress(
          Math.floor(((i + 1) / finalDistribution.length) * 100)
        );

      }

      setGeneratedMocks(generated);
      alert(`${generated.length} mocks generated successfully`);

    }catch(error){

      console.error(error);
      alert("Failed to generate mocks");

    }finally{

      setLoading(false);

    }

  }

  return(

    <AdminLayout>

      <div className="page mock-generator-page">

        {/* HEADER */}
        <div className="page-header">
          <div>
            <h2>Mock Generator</h2>
            <p>Generate intelligent mock tests automatically</p>
          </div>
        </div>

        {/* TOP STATS */}
        <div className="mock-top-stats">

          <div className="mock-stat-card">
            <div className="mock-stat-icon">📄</div>
            <div className="mock-stat-content">
              <span>Total Questions</span>
              <h2>{totalQuestions}</h2>
            </div>
          </div>

          <div className="mock-stat-card">
            <div className="mock-stat-icon green">📋</div>
            <div className="mock-stat-content">
              <span>Maximum Mocks</span>
              <h2>{totalMocks}</h2>
            </div>
          </div>

        </div>

        {/* CONFIGURATION */}
        <div className="mock-section">

          <div className="mock-section-title">⚙️ Mock Configuration</div>

          <div className="mock-generator-grid">

            <div className="form-group">
              <label>Mock Name</label>
              <input
                type="text"
                placeholder="Enter Mock Name"
                value={mockName}
                onChange={(e)=> setMockName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Mock Type</label>
              <select value={mockType} onChange={(e)=> setMockType(e.target.value)}>
                <option value="full">Full Mock</option>
                <option value="sectional">Sectional Mock</option>
              </select>
            </div>

            <div className="form-group">
              <label>Subject</label>
              <select
                value={subjectId}
                onChange={(e)=>{
                  setSubjectId(e.target.value);
                  setTopic("");
                  setSubTopic("");
                }}
              >
                <option value="">Select Subject</option>
                {subjects.map((subject)=>(
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Topic</label>
              <select
                value={topic}
                onChange={(e)=>{
                  setTopic(e.target.value);
                  setSubTopic("");
                }}
              >
                <option value="">All Topics</option>
                {filteredTopics.map((t)=>(
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Sub Topic</label>
              <select
                value={subTopic}
                onChange={(e)=> setSubTopic(e.target.value)}
              >
                <option value="">All Sub Topics</option>
                {filteredSubTopics.map((st)=>(
                  <option key={st.id} value={st.id}>{st.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Questions Per Mock</label>
              <div className="custom-input-group">
                <select
                  value={quantity}
                  onChange={(e)=>{
                    const value = Number(e.target.value);
                    if(value > totalQuestions){
                      alert(`Only ${totalQuestions} questions available`);
                      return;
                    }
                    setQuantity(value);
                  }}
                >
                  <option value={100}>100 Questions</option>
                  <option value={50}>50 Questions</option>
                  <option value={25}>25 Questions</option>
                  {![100,50,25].includes(quantity) && (
                    <option value={quantity}>{quantity} Questions</option>
                  )}
                </select>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e)=>{
                    const value = Number(e.target.value);
                    if(value > totalQuestions){
                      alert(`Only ${totalQuestions} questions available`);
                      return;
                    }
                    setQuantity(value);
                  }}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Duration</label>
              <div className="custom-input-group">
                <select
                  value={duration}
                  onChange={(e)=> setDuration(Number(e.target.value))}
                >
                  <option value={60}>60 mins</option>
                  <option value={45}>45 mins</option>
                  <option value={30}>30 mins</option>
                  <option value={15}>15 mins</option>
                  {![60,45,30,15].includes(duration) && (
                    <option value={duration}>{duration} mins</option>
                  )}
                </select>
                <input
                  type="number"
                  value={duration}
                  placeholder={`${calculatedMinutes} mins`}
                  onChange={(e)=> setDuration(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Seconds Per Question</label>
              <div className="custom-input-group">
                <input
                  type="number"
                  placeholder="30"
                  value={secondsPerQuestion}
                  onChange={(e)=> setSecondsPerQuestion(Number(e.target.value))}
                />
                <div className="auto-duration-box">
                  Suggested: <strong>{calculatedMinutes} mins</strong>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Desired Mock Quantity</label>
              <input
                type="number"
                value={desiredMocks}
                onChange={(e)=>{
                  const value = Number(e.target.value);
                  if(value > totalMocks){
                    alert(`Maximum Mocks Possible: ${totalMocks}`);
                    return;
                  }
                  setDesiredMocks(value);
                }}
              />
            </div>

          </div>

        </div>

        {/* DISTRIBUTION */}
        <div className="mock-section">

          <div className="mock-section-title">🎯 Distribution & Strategy</div>

          <div className="distribution-container">

            <label className="include-row">
              <input
                type="checkbox"
                checked={includeAllQuestions}
                onChange={(e)=> setIncludeAllQuestions(e.target.checked)}
              />
              Include All Available Questions
            </label>

            {includeAllQuestions && (
              <>

                <div className="recommended-box">
                  ⭐ Recommended:{" "}
                  {recommendedStrategy === "balanced"
                    ? "Balanced Distribution"
                    : "Create Extra Mock"}
                </div>

                <div className="distribution-options">

                  <div
                    className={`distribution-option ${distributionMode === "balanced" ? "active" : ""}`}
                    onClick={()=> setDistributionMode("balanced")}
                  >
                    <input type="radio" checked={distributionMode === "balanced"} readOnly />
                    Balanced Distribution
                  </div>

                  <div
                    className={`distribution-option ${distributionMode === "extra" ? "active" : ""}`}
                    onClick={()=> setDistributionMode("extra")}
                  >
                    <input type="radio" checked={distributionMode === "extra"} readOnly />
                    Create Extra Mock
                  </div>

                  <div
                    className={`distribution-option ${distributionMode === "manual" ? "active" : ""}`}
                    onClick={()=> setDistributionMode("manual")}
                  >
                    <input type="radio" checked={distributionMode === "manual"} readOnly />
                    Manual Distribution
                  </div>

                </div>

                {distributionMode === "manual" && (
                  <input
                    type="text"
                    placeholder="100,100,19"
                    value={manualDistribution}
                    onChange={(e)=> setManualDistribution(e.target.value)}
                  />
                )}

                <div className="distribution-preview">
                  {distributionPreview.map((q,index)=>(
                    <div key={index} className="distribution-card">
                      <div className="distribution-icon">📄</div>
                      <div className="distribution-info">
                        <h4>Mock {index + 1}</h4>
                        <p>{q} Questions</p>
                      </div>
                    </div>
                  ))}
                </div>

              </>
            )}

          </div>

        </div>

        <button
          className="generate-btn"
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading
            ? `Generating ${generationProgress}...`
            : "🚀 Generate Mocks"}
        </button>

        {generatedMocks.length > 0 && (
          <div className="mock-section">

            <div className="mock-section-title">✅ Generated Successfully</div>

            <div className="distribution-preview">
              {generatedMocks.map((m)=>(
                <div key={m} className="distribution-card">
                  <div className="distribution-icon">✅</div>
                  <div className="distribution-info">
                    <h4>{m}</h4>
                    <p>Generated Successfully</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              className="generate-btn"
              onClick={()=> window.location.href = "/admin/exams"}
            >
              View Mock Tests
            </button>

          </div>
        )}

      </div>

    </AdminLayout>

  );

}
