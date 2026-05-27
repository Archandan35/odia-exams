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
        setTopics(snapshot.docs.map((doc)=>({ id:doc.id, ...doc.data() })));
      }
    );
    return ()=>unsub();
  },[]);

  /* SUBTOPICS */
  useEffect(()=>{
    const unsub = onSnapshot(
      collection(db,"subtopics"),
      (snapshot)=>{
        setSubTopics(snapshot.docs.map((doc)=>({ id:doc.id, ...doc.data() })));
      }
    );
    return ()=>unsub();
  },[]);

  /* QUESTIONS */
  useEffect(()=>{
    async function loadQuestions(){
      const snapshot = await getDocs(collection(db,"questions"));
      setQuestions(snapshot.docs.map((doc)=>({ id:doc.id, ...doc.data() })));
    }
    loadQuestions();
  },[]);

  /* EXAMS — for duplicate check and unique question logic */
  useEffect(()=>{
    const unsub = onSnapshot(
      collection(db,"exams"),
      (snapshot)=>{
        setExams(snapshot.docs.map((doc)=>({ id:doc.id, ...doc.data() })));
      }
    );
    return ()=>unsub();
  },[]);

  /* DERIVED SELECTIONS */
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

  /* FILTERED QUESTIONS */
  const filteredQuestions = useMemo(()=>{
    return questions.filter((q)=>{
      const subjectMatch = subjectId
        ? String(q.subjectId||"").trim() === String(subjectId).trim()
        : true;
      const topicMatch = topic
        ? String(q.topicId||"").trim() === String(topic).trim()
        : true;
      const subTopicMatch = subTopic
        ? String(q.subTopicId||"").trim() === String(subTopic).trim()
        : true;
      return subjectMatch && topicMatch && subTopicMatch;
    });
  },[questions, subjectId, topic, subTopic]);

  const totalQuestions = filteredQuestions.length;

  /* Auto-default quantity = totalQuestions when filter changes */
  useEffect(()=>{
    const val = totalQuestions > 0 ? totalQuestions : 0;
    setQuantity(val);
    setQuantityInput(String(val));
    setQuantityError("");
  },[totalQuestions]);

  const totalMocks        = quantity > 0 ? Math.floor(totalQuestions / quantity) : 0;
  const remainder         = quantity > 0 ? totalQuestions % quantity : 0;
  const calculatedMinutes = Math.ceil((quantity * secondsPerQuestion) / 60);
  const recommendedStrategy = remainder > 0 ? "balanced" : "extra";

  /* AUTO DURATION */
  useEffect(()=>{
    if(calculatedMinutes > 0){
      setDuration(calculatedMinutes);
    }
  },[calculatedMinutes]);

  /* DISTRIBUTION */
  useEffect(()=>{

    if(!includeAllQuestions || totalQuestions <= 0 || quantity <= 0){
      setDistributionPreview([]);
      return;
    }

    if(distributionMode === "balanced"){
      const totalCount = Math.ceil(totalQuestions / quantity);
      const base  = Math.floor(totalQuestions / totalCount);
      const extra = totalQuestions % totalCount;
      const arr = [];
      for(let i=0; i<totalCount; i++){
        arr.push(base + (i < extra ? 1 : 0));
      }
      setDistributionPreview(arr);
    }

    if(distributionMode === "extra"){
      const arr  = [];
      const full = Math.floor(totalQuestions / quantity);
      for(let i=0; i<full; i++) arr.push(quantity);
      if(remainder > 0) arr.push(remainder);
      setDistributionPreview(arr);
    }

    if(distributionMode === "manual"){
      const arr = manualDistribution
        .split(",")
        .map((n)=> Number(n.trim()))
        .filter(Boolean);
      setDistributionPreview(arr);
    }

  },[includeAllQuestions, distributionMode, manualDistribution, totalQuestions, quantity, remainder]);

  /* HELPERS */
  function escapeRegex(str){
    return str.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
  }

  /**
   * FIX 2 & 5: Find the true base name (strip any trailing number)
   * and return the next available sequential number across ALL
   * existing exams that match "<baseName> <N>".
   *
   * Examples:
   *   user types "ବେଣୁଧର ରାଉତ"   → strips nothing   → checks for "ବେଣୁଧର ରାଉତ 1", "ବେଣୁଧର ରାଉତ 2", …
   *   user types "ବେଣୁଧର ରାଉତ 1" → strips " 1"       → checks for "ବେଣୁଧର ରାଉତ 1", "ବେଣୁଧର ରାଉତ 2", …
   *   user types "ବେଣୁଧର ରାଉତ 3" → strips " 3"       → checks for existing 1,2,3,… → returns max+1
   */
  function resolveBaseName(rawName){
    if(!rawName) return { baseName: rawName, nextNumber: 1 };
    // Strip any trailing " <number>" so user can type either the base
    // name OR an already-numbered name and we still do the right thing.
    const stripped = rawName.trim().replace(/\s+\d+$/, "").trim();
    let max = 0;
    exams.forEach((exam)=>{
      const pattern = new RegExp(`^${escapeRegex(stripped)}\\s+(\\d+)$`, "i");
      const match   = exam.name.match(pattern);
      if(match){
        const num = parseInt(match[1], 10);
        if(num > max) max = num;
      }
    });
    return { baseName: stripped, nextNumber: max + 1 };
  }

  /**
   * FIX 3: Collect all question IDs already used in any exam whose
   * name matches "<baseName> <N>" (any number).
   */
  function getUsedQuestionIds(baseName){
    const usedIds = new Set();
    if(!baseName) return usedIds;
    const stripped = baseName.trim().replace(/\s+\d+$/, "").trim();
    exams.forEach((exam)=>{
      const pattern = new RegExp(`^${escapeRegex(stripped)}\\s+\\d+$`, "i");
      if(pattern.test(exam.name)){
        if(Array.isArray(exam.questionIds)){
          exam.questionIds.forEach((id)=> usedIds.add(id));
        }
        if(Array.isArray(exam.questions)){
          exam.questions.forEach((q)=> usedIds.add(q.id));
        }
      }
    });
    return usedIds;
  }

  /* quantity input handler */
  function handleQuantityChange(raw){
    setQuantityInput(raw);
    setQuantityError("");
    const value = Number(raw);
    if(!raw || isNaN(value) || value <= 0) return;
    if(value > totalQuestions){
      setQuantityError(`Max allowed: ${totalQuestions} questions`);
      return;
    }
    setQuantity(value);
  }

  /* =========================================
     GENERATE
  ========================================= */
  async function handleGenerate(){

    if(!mockName.trim()){
      alert("Enter mock name");
      return;
    }
    if(mockNameError){
      alert(mockNameError);
      return;
    }
    if(!subjectId){
      alert("Select subject");
      return;
    }
    if(totalQuestions === 0){
      alert("No questions available for the selected filters");
      return;
    }
    if(quantity <= 0 || quantity > totalQuestions){
      alert(`Questions per mock must be between 1 and ${totalQuestions}`);
      return;
    }
    if(desiredMocksError){
      alert(desiredMocksError);
      return;
    }

    const trimmedInput = mockName.trim();
    const { baseName, nextNumber: startNumber } = resolveBaseName(trimmedInput);

    /* FIX 1: Check no unique questions remain for this series */
    const usedIdsPre = getUsedQuestionIds(baseName);
    const availableCount = filteredQuestions.filter((q)=> !usedIdsPre.has(q.id)).length;
    if(usedIdsPre.size > 0 && availableCount === 0){
      alert(
        `A mock test with the same questions already exists.\n\n` +
        `All ${usedIdsPre.size} questions for the "${baseName}" series are already used in existing mocks. ` +
        `No unique questions available — generation cannot proceed.`
      );
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

      /* FIX 3: Exclude already-used questions from same series */
      const usedIds = getUsedQuestionIds(baseName);
      let availablePool = filteredQuestions
        .filter((q)=> !usedIds.has(q.id))
        .sort(()=> Math.random() - 0.5);

      let poolIndex = 0;

      for(let i=0; i<finalDistribution.length; i++){

        const currentNumber = startNumber + i;
        const currentName   = `${baseName} ${currentNumber}`;

        /* FIX 1 & 3: Guard each generated name for exact duplicates */
        const nameConflict = exams.find(
          (e)=> e.name.trim().toLowerCase() === currentName.toLowerCase()
        );
        if(nameConflict){
          alert(`"${currentName}" already exists. Stopping.`);
          break;
        }

        const count = finalDistribution[i];
        const questionsForThisMock = availablePool.slice(poolIndex, poolIndex + count);
        poolIndex += count;

        if(questionsForThisMock.length === 0){
          alert(`No unique questions left for mock ${currentNumber}. Stopping.`);
          break;
        }

        await generateMocks({
          mockName:     currentName,
          mockType,
          subject:      selectedSubject?.name  || "",
          topic:        selectedTopic?.name    || "",
          subTopic:     selectedSubTopic?.name || "",
          subjectId,
          topicId:      topic,
          subTopicId:   subTopic,
          duration:     Number(duration),
          distribution: [questionsForThisMock.length],
          questions:    questionsForThisMock,
        });

        generated.push(currentName);

        setGenerationProgress(
          Math.floor(((i + 1) / finalDistribution.length) * 100)
        );

      }

      setGeneratedMocks(generated);
      if(generated.length > 0){
        alert(`${generated.length} mock(s) generated successfully`);
      }

    }catch(error){
      console.error(error);
      alert("Failed to generate mocks");
    }finally{
      setLoading(false);
    }

  }

  /* =========================================
     REACTIVE: warn when no unique questions
     remain for this series
  ========================================= */
  useEffect(()=>{
    setUniqueWarning("");
    const trimmed = mockName.trim();
    if(!trimmed) return;
    if(mockNameError) return;

    const { baseName } = resolveBaseName(trimmed);
    const usedIds      = getUsedQuestionIds(baseName);
    const availableCount = filteredQuestions.filter((q)=> !usedIds.has(q.id)).length;

    if(usedIds.size > 0 && availableCount === 0){
      setUniqueWarning(
        `A mock test with the same questions already exists. ` +
        `All ${usedIds.size} questions for "${baseName}" series are used. ` +
        `No unique questions available — generation cannot proceed.`
      );
    } else if(usedIds.size > 0){
      setUniqueWarning(
        `${usedIds.size} questions already used in existing "${baseName}" mocks. ` +
        `${availableCount} unique questions remain.`
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[mockName, exams, filteredQuestions]);

  /* Validate mock name on every keystroke */
  useEffect(()=>{
    setMockNameError("");
    const trimmed = mockName.trim();
    if(!trimmed) return;

    // FIX 1 & 3: Exact name match check
    const exactMatch = exams.find(
      (ex)=> ex.name.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if(exactMatch){
      setMockNameError(
        `A mock test named "${trimmed}" already exists. ` +
        `Please use a different name.`
      );
    }
  },[mockName, exams]);

  /* FIX 2 & 5: Derive next number from resolved base */
  const { baseName: resolvedBase, nextNumber } = resolveBaseName(mockName.trim());

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

            {/* MOCK NAME */}
            <div className="form-group">
              <label>Mock Name</label>
              <input
                type="text"
                placeholder="Enter Mock Name"
                value={mockName}
                style={{ borderColor: mockNameError ? "#ef4444" : undefined }}
                onChange={(e)=>{
                  setMockName(e.target.value);
                  setUniqueWarning("");
                }}
              />
              {/* FIX 2 & 5: Show corrected next name using resolvedBase */}
              {mockName.trim() && !mockNameError && (
                <p style={{ fontSize:"12px", color:"#94a3b8", marginTop:"4px" }}>
                  Next mock will be named:{" "}
                  <strong>{resolvedBase} {nextNumber}</strong>
                </p>
              )}
              {mockNameError && (
                <p style={{ color:"#ef4444", fontSize:"12px", marginTop:"4px", fontWeight:"500" }}>
                  ⚠️ {mockNameError}
                </p>
              )}
              {uniqueWarning && !mockNameError && (
                <p style={{
                  color: uniqueWarning.includes("cannot proceed") ? "#ef4444" : "#f59e0b",
                  fontSize:"12px",
                  marginTop:"4px",
                  fontWeight:"500"
                }}>
                  ⚠️ {uniqueWarning}
                </p>
              )}
            </div>

            {/* MOCK TYPE */}
            <div className="form-group">
              <label>Mock Type</label>
              <select value={mockType} onChange={(e)=> setMockType(e.target.value)}>
                <option value="full">Full Mock</option>
                <option value="sectional">Sectional Mock</option>
              </select>
            </div>

            {/* SUBJECT */}
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

            {/* TOPIC */}
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

            {/* SUB TOPIC */}
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

            {/* QUESTIONS PER MOCK */}
            <div className="form-group">
              <label>
                Questions Per Mock
                {totalQuestions > 0 && (
                  <span style={{
                    marginLeft:"8px",
                    fontSize:"12px",
                    color:"var(--color-primary,#6366f1)",
                    fontWeight:"500"
                  }}>
                    (Max: {totalQuestions})
                  </span>
                )}
              </label>
              <div className="custom-input-group">
                <select
                  value={[100,50,25].includes(quantity) ? quantity : "custom"}
                  onChange={(e)=>{
                    if(e.target.value === "custom") return;
                    const value = Number(e.target.value);
                    if(value > totalQuestions){
                      setQuantityError(`Max allowed: ${totalQuestions} questions`);
                      return;
                    }
                    setQuantityError("");
                    setQuantity(value);
                    setQuantityInput(String(value));
                  }}
                >
                  <option value={100} disabled={totalQuestions < 100}>100 Questions</option>
                  <option value={50}  disabled={totalQuestions < 50}>50 Questions</option>
                  <option value={25}  disabled={totalQuestions < 25}>25 Questions</option>
                  <option value="custom">Custom</option>
                </select>
                <input
                  type="number"
                  min={1}
                  max={totalQuestions}
                  value={quantityInput}
                  onChange={(e)=> handleQuantityChange(e.target.value)}
                  style={{ borderColor: quantityError ? "#ef4444" : undefined }}
                />
              </div>
              {quantityError && (
                <p style={{
                  color:"#ef4444",
                  fontSize:"12px",
                  marginTop:"4px",
                  fontWeight:"500"
                }}>
                  ⚠️ {quantityError}
                </p>
              )}
            </div>

            {/* DURATION */}
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

            {/* SECONDS PER QUESTION */}
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

            {/* DESIRED MOCK QUANTITY */}
            <div className="form-group">
              <label>Desired Mock Quantity</label>
              <input
                type="number"
                value={desiredMocks}
                min={1}
                style={{ borderColor: desiredMocksError ? "#ef4444" : undefined }}
                onChange={(e)=>{
                  const value = Number(e.target.value);
                  if(value > totalMocks){
                    setDesiredMocksError(`Maximum mocks possible: ${totalMocks}`);
                    setDesiredMocks(value);
                    return;
                  }
                  setDesiredMocksError("");
                  setDesiredMocks(value);
                }}
              />
              {desiredMocksError && (
                <p style={{ color:"#ef4444", fontSize:"12px", marginTop:"4px", fontWeight:"500" }}>
                  ⚠️ {desiredMocksError}
                </p>
              )}
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
                    placeholder="e.g. 25,25,17"
                    value={manualDistribution}
                    onChange={(e)=> setManualDistribution(e.target.value)}
                  />
                )}

                <div className="distribution-preview">
                  {distributionPreview.map((q,index)=>(
                    <div key={index} className="distribution-card">
                      <div className="distribution-icon">📄</div>
                      <div className="distribution-info">
                        {/* FIX 2 & 5: Show the correct sequential name */}
                        <h4>{resolvedBase} {nextNumber + index}</h4>
                        <p>{q} Questions</p>
                      </div>
                    </div>
                  ))}
                </div>

              </>
            )}

          </div>

        </div>

        {/* GENERATE BUTTON */}
        <button
          className="generate-btn"
          onClick={handleGenerate}
          disabled={
            loading ||
            !!quantityError ||
            !!mockNameError ||
            !!desiredMocksError ||
            (uniqueWarning && uniqueWarning.includes("cannot proceed"))
          }
        >
          {loading
            ? `Generating ${generationProgress}%...`
            : "🚀 Generate Mocks"}
        </button>

        {/* GENERATED LIST */}
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
