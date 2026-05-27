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

  const [subjects,setSubjects]     = useState([]);
  const [topics,setTopics]         = useState([]);
  const [subTopics,setSubTopics]   = useState([]);
  const [questions,setQuestions]   = useState([]);
  const [exams,setExams]           = useState([]);

  const [mockName,setMockName]     = useState("");
  const [mockType,setMockType]     = useState("sectional");
  const [subjectId,setSubjectId]   = useState("");
  const [topic,setTopic]           = useState("");
  const [subTopic,setSubTopic]     = useState("");

  const [quantity,setQuantity]           = useState(0);
  const [quantityInput,setQuantityInput] = useState("0");
  const [quantityError,setQuantityError] = useState("");
  const [duration,setDuration]           = useState(60);

  const [secondsPerQuestion,setSecondsPerQuestion] = useState(30);
  const [desiredMocks,setDesiredMocks]             = useState(1);
  const [includeAllQuestions,setIncludeAllQuestions] = useState(true);
  const [distributionMode,setDistributionMode]     = useState("balanced");
  const [manualDistribution,setManualDistribution] = useState("");
  const [distributionPreview,setDistributionPreview] = useState([]);

  const [desiredMocksError,setDesiredMocksError]   = useState("");
  const [mockNameError,setMockNameError]           = useState("");
  const [uniqueWarning,setUniqueWarning]           = useState("");
  const [loading,setLoading]                       = useState(false);
  const [generationProgress,setGenerationProgress] = useState(0);
  const [generatedMocks,setGeneratedMocks]         = useState([]);

  useEffect(()=>{
    const unsubscribe = listenSubjects(setSubjects);
    return ()=>unsubscribe();
  },[]);

  useEffect(()=>{
    const unsub = onSnapshot(
      collection(db,"topics"),
      (snapshot)=>{
        setTopics(snapshot.docs.map((doc)=>({ id:doc.id, ...doc.data() })));
      }
    );
    return ()=>unsub();
  },[]);

  useEffect(()=>{
    const unsub = onSnapshot(
      collection(db,"subtopics"),
      (snapshot)=>{
        setSubTopics(snapshot.docs.map((doc)=>({ id:doc.id, ...doc.data() })));
      }
    );
    return ()=>unsub();
  },[]);

  useEffect(()=>{
    async function loadQuestions(){
      const snapshot = await getDocs(collection(db,"questions"));
      setQuestions(snapshot.docs.map((doc)=>({ id:doc.id, ...doc.data() })));
    }
    loadQuestions();
  },[]);

  useEffect(()=>{
    const unsub = onSnapshot(
      collection(db,"exams"),
      (snapshot)=>{
        setExams(snapshot.docs.map((doc)=>({ id:doc.id, ...doc.data() })));
      }
    );
    return ()=>unsub();
  },[]);

  const filteredTopics =
    topics.filter((t)=> String(t.subjectId) === String(subjectId));

  const filteredSubTopics =
    subTopics.filter((st)=>
      String(st.subjectId) === String(subjectId) &&
      String(st.topicId)   === String(topic)
    );

  const selectedSubject  = subjects.find((s)=> String(s.id) === String(subjectId));
  const selectedTopic    = filteredTopics.find((t)=> String(t.id) === String(topic));
  const selectedSubTopic = filteredSubTopics.find((st)=> String(st.id) === String(subTopic));

  const filteredQuestions = useMemo(()=>{

    return questions.filter((q)=>{

      const subjectMatch = subjectId
        ? String(q.subjectId||"").trim() === String(subjectId).trim()
        : true;

      const topicMatch = topic
        ? String(q.topicId||"").trim() === String(topic).trim()
        : true;

      const subTopicMatch =
        mockType === "sectional"
          ? (
              subTopic
                ? String(q.subTopicId||"").trim() === String(subTopic).trim()
                : true
            )
          : true;

      return subjectMatch && topicMatch && subTopicMatch;

    });

  },[
    questions,
    mockType,
    subjectId,
    topic,
    subTopic,
  ]);

  const totalQuestions = filteredQuestions.length;

  function escapeRegex(str){
    return str.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
  }

  function resolveBaseName(rawName){

    if(!rawName){
      return { baseName: rawName, nextNumber: 1 };
    }

    const normalised = rawName.trim().replace(/\s+/g, " ");
    const stripped   = normalised.replace(/ [0-9]+$/, "").trim();

    let max = 0;

    const pattern = new RegExp(
      `^${escapeRegex(stripped)} ([0-9]+)$`
    );

    exams
      .filter((exam)=>(exam.mockType || "sectional") === mockType)
      .forEach((exam)=>{

        const normExamName =
          (exam.name || "")
            .trim()
            .replace(/\s+/g, " ");

        const match = normExamName.match(pattern);

        if(match){
          const num = parseInt(match[1],10);
          if(num > max) max = num;
        }

      });

    return {
      baseName: stripped,
      nextNumber: max + 1,
    };
  }

  function getUsedQuestionIds(baseName){

    const usedIds = new Set();

    if(!baseName) return usedIds;

    if(mockType === "full"){
      return usedIds;
    }

    const normBase = baseName.trim().replace(/\s+/g, " ");

    const pattern = new RegExp(
      `^${escapeRegex(normBase)} [0-9]+$`
    );

    exams
      .filter((exam)=>(exam.mockType || "sectional") === "sectional")
      .forEach((exam)=>{

        const normName =
          (exam.name || "")
            .trim()
            .replace(/\s+/g, " ");

        if(pattern.test(normName)){

          if(Array.isArray(exam.questionIds)){
            exam.questionIds.forEach((id)=> usedIds.add(id));
          }

          if(Array.isArray(exam.questions)){
            exam.questions.forEach((q)=>
              usedIds.add(typeof q === "string" ? q : q.id)
            );
          }
        }

      });

    return usedIds;
  }

  const {
    baseName: resolvedBase,
    nextNumber,
  } = useMemo(()=>{

    return resolveBaseName(mockName.trim());

  },[
    mockName,
    exams,
    mockType,
  ]);

  const usedIdsForSeries = useMemo(()=>{

    if(mockType === "full"){
      return new Set();
    }

    if(!mockName.trim()){
      return new Set();
    }

    return getUsedQuestionIds(resolvedBase);

  },[
    resolvedBase,
    exams,
    mockName,
    mockType,
  ]);

  const availableQuestions = useMemo(()=>{

    if(mockType === "full"){
      return filteredQuestions;
    }

    return filteredQuestions.filter(
      (q)=> !usedIdsForSeries.has(q.id)
    );

  },[
    filteredQuestions,
    usedIdsForSeries,
    mockType,
  ]);

  const availableCount = availableQuestions.length;

  useEffect(()=>{

    const val = availableCount > 0 ? availableCount : 0;

    setQuantity(val);
    setQuantityInput(String(val));
    setQuantityError("");

  },[availableCount]);

  useEffect(()=>{

    setMockNameError("");

    const trimmed = mockName.trim();

    if(!trimmed) return;

    const exactMatch = exams.find(
      (ex)=>
        (ex.mockType || "sectional") === mockType &&
        (ex.name||"").trim().toLowerCase() === trimmed.toLowerCase()
    );

    if(exactMatch){

      setMockNameError(
        `A ${mockType} mock named "${trimmed}" already exists.`
      );

    }

  },[
    mockName,
    exams,
    mockType,
  ]);

  useEffect(()=>{

    if(mockType === "full"){
      setUniqueWarning("");
      return;
    }

    setUniqueWarning("");

    const trimmed = mockName.trim();

    if(!trimmed) return;

    if(mockNameError) return;

    if(usedIdsForSeries.size > 0 && availableCount === 0){

      setUniqueWarning(
        `All questions already used in sectional mock series.`
      );

    }
    else if(usedIdsForSeries.size > 0){

      setUniqueWarning(
        `${usedIdsForSeries.size} questions already used. ${availableCount} unique questions remaining.`
      );

    }

  },[
    mockType,
    mockName,
    mockNameError,
    availableCount,
    usedIdsForSeries,
  ]);

  async function handleGenerate(){

    if(!mockName.trim()){
      alert("Enter mock name");
      return;
    }

    if(!subjectId){
      alert("Select subject");
      return;
    }

    if(!topic){
      alert("Select topic");
      return;
    }

    if(mockType === "sectional" && !subTopic){
      alert("Select sub topic");
      return;
    }

    if(quantity <= 0){
      alert("Invalid question quantity");
      return;
    }

    try{

      setLoading(true);

      const finalName = `${resolvedBase} ${nextNumber}`;

      await generateMocks({

        mockName: finalName,
        mockType,

        subject: selectedSubject?.name || "",
        topic: selectedTopic?.name || "",
        subTopic:
          mockType === "sectional"
            ? selectedSubTopic?.name || ""
            : "",

        subjectId,
        topicId: topic,
        subTopicId:
          mockType === "sectional"
            ? subTopic
            : "",

        duration,
        questions: availableQuestions.slice(0, quantity),

      });

      alert("Mock Generated Successfully");

      setGeneratedMocks([finalName]);

    }catch(error){

      console.error(error);

      alert("Generation Failed");

    }finally{
      setLoading(false);
    }
  }

  return(

    <AdminLayout>

      <div className="page mock-generator-page">

        <div className="page-header">
          <div>
            <h2>Mock Generator</h2>
            <p>Generate intelligent mock tests automatically</p>
          </div>
        </div>

        <div className="mock-section">

          <div className="mock-section-title">
            ⚙️ Mock Configuration
          </div>

          <div className="mock-generator-grid">

            <div className="form-group">
              <label>Mock Name</label>
              <input
                type="text"
                value={mockName}
                onChange={(e)=> setMockName(e.target.value)}
                placeholder="Enter Mock Name"
              />
            </div>

            <div className="form-group">
              <label>Mock Type</label>
              <select
                value={mockType}
                onChange={(e)=>{
                  setMockType(e.target.value);
                  setSubTopic("");
                  setGeneratedMocks([]);
                }}
              >
                <option value="sectional">Sectional Mock</option>
                <option value="full">Full Mock</option>
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
                <option value="">Select Topic</option>

                {filteredTopics.map((t)=>(
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}

              </select>
            </div>

            {mockType === "sectional" && (

              <div className="form-group">
                <label>Sub Topic</label>
                <select
                  value={subTopic}
                  onChange={(e)=> setSubTopic(e.target.value)}
                >
                  <option value="">Select Sub Topic</option>

                  {filteredSubTopics.map((st)=>(
                    <option key={st.id} value={st.id}>
                      {st.name}
                    </option>
                  ))}

                </select>
              </div>

            )}

            <div className="form-group">
              <label>Questions Per Mock</label>
              <input
                type="number"
                value={quantityInput}
                onChange={(e)=>{
                  setQuantityInput(e.target.value);
                  setQuantity(Number(e.target.value));
                }}
              />
            </div>

            <div className="form-group">
              <label>Duration</label>
              <input
                type="number"
                value={duration}
                onChange={(e)=> setDuration(Number(e.target.value))}
              />
            </div>

          </div>

          {mockType === "sectional" && uniqueWarning && (
            <div className="recommended-box">
              ⚠️ {uniqueWarning}
            </div>
          )}

        </div>

        <button
          className="generate-btn"
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? "Generating..." : "🚀 Generate Mock"}
        </button>

        {generatedMocks.length > 0 && (

          <div className="mock-section">

            <div className="mock-section-title">
              Generated Successfully
            </div>

            {generatedMocks.map((mock)=>(
              <div key={mock} className="distribution-card">
                <div className="distribution-info">
                  <h4>{mock}</h4>
                </div>
              </div>
            ))}

          </div>

        )}

      </div>

    </AdminLayout>

  );
}
