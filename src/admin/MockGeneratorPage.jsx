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
  const [exams,setExams] = useState([]);

  const [mockName,setMockName] = useState("");
  const [mockType,setMockType] = useState("sectional");

  const [subjectId,setSubjectId] = useState("");
  const [topic,setTopic] = useState("");
  const [subTopic,setSubTopic] = useState("");

  const [quantity,setQuantity] = useState(0);
  const [quantityInput,setQuantityInput] = useState("0");
  const [quantityError,setQuantityError] = useState("");

  const [duration,setDuration] = useState(60);

  const [secondsPerQuestion,setSecondsPerQuestion] =
    useState(30);

  const [desiredMocks,setDesiredMocks] =
    useState(1);

  const [includeAllQuestions,setIncludeAllQuestions] =
    useState(true);

  const [distributionMode,setDistributionMode] =
    useState("balanced");

  const [manualDistribution,setManualDistribution] =
    useState("");

  const [distributionPreview,setDistributionPreview] =
    useState([]);

  const [desiredMocksError,setDesiredMocksError] =
    useState("");

  const [mockNameError,setMockNameError] =
    useState("");

  const [uniqueWarning,setUniqueWarning] =
    useState("");

  const [loading,setLoading] =
    useState(false);

  const [generationProgress,setGenerationProgress] =
    useState(0);

  const [generatedMocks,setGeneratedMocks] =
    useState([]);

  /* =========================================
     SUBJECTS
  ========================================= */

  useEffect(()=>{

    const unsubscribe =
      listenSubjects(setSubjects);

    return ()=> unsubscribe();

  },[]);

  /* =========================================
     TOPICS
  ========================================= */

  useEffect(()=>{

    const unsub = onSnapshot(

      collection(db,"topics"),

      (snapshot)=>{

        setTopics(

          snapshot.docs.map((doc)=>({
            id:doc.id,
            ...doc.data()
          }))

        );

      }

    );

    return ()=> unsub();

  },[]);

  /* =========================================
     SUBTOPICS
  ========================================= */

  useEffect(()=>{

    const unsub = onSnapshot(

      collection(db,"subtopics"),

      (snapshot)=>{

        setSubTopics(

          snapshot.docs.map((doc)=>({
            id:doc.id,
            ...doc.data()
          }))

        );

      }

    );

    return ()=> unsub();

  },[]);

  /* =========================================
     QUESTIONS
  ========================================= */

  useEffect(()=>{

    async function loadQuestions(){

      const snapshot =
        await getDocs(
          collection(db,"questions")
        );

      setQuestions(

        snapshot.docs.map((doc)=>({
          id:doc.id,
          ...doc.data()
        }))

      );

    }

    loadQuestions();

  },[]);

  /* =========================================
     EXAMS
  ========================================= */

  useEffect(()=>{

    const unsub = onSnapshot(

      collection(db,"exams"),

      (snapshot)=>{

        setExams(

          snapshot.docs.map((doc)=>({
            id:doc.id,
            ...doc.data()
          }))

        );

      }

    );

    return ()=> unsub();

  },[]);

  /* =========================================
     FILTERED TOPICS
  ========================================= */

  const filteredTopics =

    topics.filter((t)=>

      String(t.subjectId)
      ===
      String(subjectId)

    );

  /* =========================================
     FILTERED SUBTOPICS
  ========================================= */

  const filteredSubTopics =

    mockType === "sectional"

      ? subTopics.filter((st)=>

          String(st.subjectId)
          ===
          String(subjectId)

          &&

          String(st.topicId)
          ===
          String(topic)

        )

      : [];

  /* =========================================
     SELECTED
  ========================================= */

  const selectedSubject =

    subjects.find((s)=>

      String(s.id)
      ===
      String(subjectId)

    );

  const selectedTopic =

    filteredTopics.find((t)=>

      String(t.id)
      ===
      String(topic)

    );

  const selectedSubTopic =

    filteredSubTopics.find((st)=>

      String(st.id)
      ===
      String(subTopic)

    );

  /* =========================================
     FILTERED QUESTIONS
  ========================================= */

  const filteredQuestions = useMemo(()=>{

    return questions.filter((q)=>{

      const subjectMatch =

        subjectId

          ? String(q.subjectId || "").trim()
            ===
            String(subjectId).trim()

          : true;

      const topicMatch =

        topic

          ? String(q.topicId || "").trim()
            ===
            String(topic).trim()

          : true;

      const subTopicMatch =

        mockType === "sectional"

          ? (

              subTopic

                ? String(q.subTopicId || "").trim()
                  ===
                  String(subTopic).trim()

                : true

            )

          : true;

      return (
        subjectMatch &&
        topicMatch &&
        subTopicMatch
      );

    });

  },[
    questions,
    subjectId,
    topic,
    subTopic,
    mockType
  ]);

  const totalQuestions =
    filteredQuestions.length;

  /* =========================================
     HELPERS
  ========================================= */

  function escapeRegex(str){

    return str.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );

  }

  /* =========================================
     RESOLVE BASE NAME
  ========================================= */

  function resolveBaseName(rawName){

    if(!rawName){

      return {
        baseName: rawName,
        nextNumber: 1
      };

    }

    const normalised =

      rawName
        .trim()
        .replace(/\s+/g," ");

    const stripped =

      normalised
        .replace(/ [0-9]+$/,"")
        .trim();

    let max = 0;

    const pattern =

      new RegExp(
        `^${escapeRegex(stripped)} ([0-9]+)$`
      );

    exams.forEach((exam)=>{

      if(

        String(exam.mockType || "sectional")
        !==
        String(mockType)

      ){
        return;
      }

      const normExamName =

        (exam.name || "")
          .trim()
          .replace(/\s+/g," ");

      const match =
        normExamName.match(pattern);

      if(match){

        const num =
          parseInt(match[1],10);

        if(num > max){
          max = num;
        }

      }

    });

    return {

      baseName: stripped,

      nextNumber: max + 1,

    };

  }

  /* =========================================
     USED QUESTION IDS
  ========================================= */

  function getUsedQuestionIds(baseName){

    const usedIds = new Set();

    if(!baseName){
      return usedIds;
    }

    const normBase =

      baseName
        .trim()
        .replace(/\s+/g," ");

    const pattern =

      new RegExp(
        `^${escapeRegex(normBase)} [0-9]+$`
      );

    exams.forEach((exam)=>{

      if(

        String(exam.mockType || "sectional")
        !==
        String(mockType)

      ){
        return;
      }

      const normName =

        (exam.name || "")
          .trim()
          .replace(/\s+/g," ");

      if(pattern.test(normName)){

        if(Array.isArray(exam.questionIds)){

          exam.questionIds.forEach((id)=>{
            usedIds.add(id);
          });

        }

        if(Array.isArray(exam.questions)){

          exam.questions.forEach((q)=>{

            usedIds.add(

              typeof q === "string"
                ? q
                : q.id

            );

          });

        }

      }

    });

    return usedIds;

  }

  /* =========================================
     RESOLVED BASE + NUMBER
  ========================================= */

  const {
    baseName: resolvedBase,
    nextNumber
  } = useMemo(()=>{

    return resolveBaseName(
      mockName.trim()
    );

  },[
    mockName,
    exams,
    mockType
  ]);

  /* =========================================
     USED IDS
  ========================================= */

  const usedIdsForSeries = useMemo(()=>{

    if(!mockName.trim()){
      return new Set();
    }

    return getUsedQuestionIds(
      resolvedBase
    );

  },[
    resolvedBase,
    exams,
    mockType
  ]);

  /* =========================================
     AVAILABLE QUESTIONS
  ========================================= */

  const availableQuestions = useMemo(()=>{

    return filteredQuestions.filter((q)=>

      !usedIdsForSeries.has(q.id)

    );

  },[
    filteredQuestions,
    usedIdsForSeries
  ]);

  const availableCount =
    availableQuestions.length;

  /* =========================================
     AUTO QUANTITY
  ========================================= */

  useEffect(()=>{

    const val =

      availableCount > 0
        ? availableCount
        : 0;

    setQuantity(val);
    setQuantityInput(String(val));
    setQuantityError("");

  },[availableCount]);

  /* =========================================
     STATS
  ========================================= */

  const totalMocks =

    quantity > 0

      ? Math.floor(
          availableCount / quantity
        )

      : 0;

  const remainder =

    quantity > 0

      ? availableCount % quantity

      : 0;

  const calculatedMinutes =

    Math.ceil(
      (quantity * secondsPerQuestion) / 60
    );

  const recommendedStrategy =

    remainder > 0
      ? "balanced"
      : "extra";

  /* =========================================
     AUTO DURATION
  ========================================= */

  useEffect(()=>{

    if(calculatedMinutes > 0){
      setDuration(calculatedMinutes);
    }

  },[calculatedMinutes]);

  /* =========================================
     DISTRIBUTION PREVIEW
  ========================================= */

  useEffect(()=>{

    if(

      !includeAllQuestions ||

      availableCount <= 0 ||

      quantity <= 0

    ){

      setDistributionPreview([]);

      return;

    }

    if(distributionMode === "balanced"){

      const totalCount =

        Math.ceil(
          availableCount / quantity
        );

      const base =

        Math.floor(
          availableCount / totalCount
        );

      const extra =
        availableCount % totalCount;

      const arr = [];

      for(let i=0; i<totalCount; i++){

        arr.push(
          base + (i < extra ? 1 : 0)
        );

      }

      setDistributionPreview(arr);

    }

    if(distributionMode === "extra"){

      const arr = [];

      const full =

        Math.floor(
          availableCount / quantity
        );

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

  },[
    includeAllQuestions,
    distributionMode,
    manualDistribution,
    availableCount,
    quantity,
    remainder
  ]);

  /* =========================================
     QUANTITY CHANGE
  ========================================= */

  function handleQuantityChange(raw){

    setQuantityInput(raw);
    setQuantityError("");

    const value = Number(raw);

    if(
      !raw ||
      isNaN(value) ||
      value <= 0
    ){
      return;
    }

    if(value > availableCount){

      setQuantityError(
        `Max allowed: ${availableCount} remaining unique questions`
      );

      return;
    }

    setQuantity(value);

  }

  /* =========================================
     DUPLICATE NAME
  ========================================= */

  useEffect(()=>{

    setMockNameError("");

    const trimmed =
      mockName.trim();

    if(!trimmed){
      return;
    }

    const exactMatch = exams.find((ex)=>

      (ex.name || "")
        .trim()
        .toLowerCase()

      ===

      trimmed.toLowerCase()

      &&

      String(ex.mockType || "sectional")
      ===
      String(mockType)

    );

    if(exactMatch){

      setMockNameError(

        `A ${mockType} mock named "${trimmed}" already exists.` +

        ` The series will auto-number from ${resolvedBase} ${nextNumber}.`

      );

    }

  },[
    mockName,
    exams,
    resolvedBase,
    nextNumber,
    mockType
  ]);

  /* =========================================
     UNIQUE WARNING
  ========================================= */

  useEffect(()=>{

    setUniqueWarning("");

    const trimmed =
      mockName.trim();

    if(!trimmed){
      return;
    }

    if(mockNameError){
      return;
    }

    if(

      usedIdsForSeries.size > 0 &&

      availableCount === 0

    ){

      setUniqueWarning(

        `All ${usedIdsForSeries.size} questions for "${resolvedBase}" ${mockType} series are already used. ` +

        `No unique questions available — generation cannot proceed.`

      );

    }

    else if(usedIdsForSeries.size > 0){

      setUniqueWarning(

        `${usedIdsForSeries.size} questions already used in existing "${resolvedBase}" ${mockType} mocks. ` +

        `${availableCount} unique questions remain available.`

      );

    }

  },[
    mockName,
    exams,
    availableCount,
    usedIdsForSeries,
    resolvedBase,
    mockNameError,
    mockType
  ]);

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

    if(availableCount === 0){
      alert("No unique questions available");
      return;
    }

    if(
      quantity <= 0 ||
      quantity > availableCount
    ){

      alert(
        `Questions per mock must be between 1 and ${availableCount}`
      );

      return;
    }

    if(desiredMocksError){
      alert(desiredMocksError);
      return;
    }

    const baseName =
      resolvedBase;

    const startNumber =
      nextNumber;

    try{

      setLoading(true);

      setGenerationProgress(0);

      const generated = [];

      const finalDistribution =

        includeAllQuestions

          ? distributionPreview

          : Array(desiredMocks).fill(quantity);

      let availablePool =

        [...availableQuestions]

          .sort(()=> Math.random() - 0.5);

      let poolIndex = 0;

      for(
        let i=0;
        i<finalDistribution.length;
        i++
      ){

        const currentNumber =
          startNumber + i;

        const currentName =
          `${baseName} ${currentNumber}`;

        const nameConflict = exams.find((e)=>

          (e.name || "")
            .trim()
            .toLowerCase()

          ===

          currentName.toLowerCase()

          &&

          String(e.mockType || "sectional")
          ===
          String(mockType)

        );

        if(nameConflict){

          alert(
            `"${currentName}" already exists`
          );

          break;
        }

        const count =
          finalDistribution[i];

        const questionsForThisMock =

          availablePool.slice(
            poolIndex,
            poolIndex + count
          );

        poolIndex += count;

        if(questionsForThisMock.length === 0){

          alert(
            "No unique questions left"
          );

          break;
        }

        await generateMocks({

          mockName: currentName,

          mockType,

          subject:
            selectedSubject?.name || "",

          topic:
            selectedTopic?.name || "",

          subTopic:
            selectedSubTopic?.name || "",

          subjectId,

          topicId: topic,

          subTopicId: subTopic,

          duration: Number(duration),

          questions:
            questionsForThisMock,

        });

        generated.push(currentName);

        setGenerationProgress(

          Math.floor(

            ((i + 1)
            /
            finalDistribution.length)

            * 100

          )

        );

      }

      setGeneratedMocks(generated);

      if(generated.length > 0){

        alert(
          `${generated.length} mock(s) generated successfully`
        );

      }

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

            <p>
              Generate intelligent mock tests automatically
            </p>

          </div>

        </div>

        {/* FULL JSX CONTINUES HERE */}
