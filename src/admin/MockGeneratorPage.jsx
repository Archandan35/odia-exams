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

  const [quantity,setQuantity]         = useState(0);
  const [quantityInput,setQuantityInput] = useState("0");
  const [quantityError,setQuantityError] = useState("");

  const [desiredMockError,setDesiredMockError] = useState("");

  const [duration,setDuration]         = useState(60);

  const [secondsPerQuestion,setSecondsPerQuestion] = useState(30);
  const [desiredMocks,setDesiredMocks]             = useState(1);

  const [includeAllQuestions,setIncludeAllQuestions] = useState(true);

  const [distributionMode,setDistributionMode]     = useState("balanced");
  const [manualDistribution,setManualDistribution] = useState("");
  const [distributionPreview,setDistributionPreview] = useState([]);

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
        setTopics(snapshot.docs.map((doc)=>({
          id:doc.id,
          ...doc.data()
        })));
      }
    );
    return ()=>unsub();
  },[]);

  /* SUBTOPICS */
  useEffect(()=>{
    const unsub = onSnapshot(
      collection(db,"subtopics"),
      (snapshot)=>{
        setSubTopics(snapshot.docs.map((doc)=>({
          id:doc.id,
          ...doc.data()
        })));
      }
    );
    return ()=>unsub();
  },[]);

  /* QUESTIONS */
  useEffect(()=>{
    async function loadQuestions(){
      const snapshot = await getDocs(collection(db,"questions"));

      setQuestions(
        snapshot.docs.map((doc)=>({
          id:doc.id,
          ...doc.data()
        }))
      );
    }

    loadQuestions();
  },[]);

  /* EXAMS */
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

    return ()=>unsub();
  },[]);

  /* FILTERS */
  const filteredTopics =
    topics.filter(
      (t)=> String(t.subjectId) === String(subjectId)
    );

  const filteredSubTopics =
    subTopics.filter(
      (st)=>
        String(st.subjectId) === String(subjectId) &&
        String(st.topicId)   === String(topic)
    );

  const selectedSubject =
    subjects.find(
      (s)=> String(s.id) === String(subjectId)
    );

  const selectedTopic =
    filteredTopics.find(
      (t)=> String(t.id) === String(topic)
    );

  const selectedSubTopic =
    filteredSubTopics.find(
      (st)=> String(st.id) === String(subTopic)
    );

  /* FILTERED QUESTIONS */
  const filteredQuestions = useMemo(()=>{

    return questions.filter((q)=>{

      const subjectMatch = subjectId
        ? String(q.subjectId || "").trim() === String(subjectId).trim()
        : true;

      const topicMatch = topic
        ? String(q.topicId || "").trim() === String(topic).trim()
        : true;

      const subTopicMatch = subTopic
        ? String(q.subTopicId || "").trim() === String(subTopic).trim()
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
    subTopic
  ]);

  const totalQuestions = filteredQuestions.length;

  useEffect(()=>{

    const val =
      totalQuestions > 0
      ? totalQuestions
      : 0;

    setQuantity(val);
    setQuantityInput(String(val));
    setQuantityError("");

  },[totalQuestions]);

  const totalMocks =
    quantity > 0
    ? Math.floor(totalQuestions / quantity)
    : 0;

  const remainder =
    quantity > 0
    ? totalQuestions % quantity
    : 0;

  const calculatedMinutes =
    Math.ceil((quantity * secondsPerQuestion) / 60);

  const recommendedStrategy =
    remainder > 0
    ? "balanced"
    : "extra";

  useEffect(()=>{
    if(calculatedMinutes > 0){
      setDuration(calculatedMinutes);
    }
  },[calculatedMinutes]);

  /* DISTRIBUTION */
  useEffect(()=>{

    if(
      !includeAllQuestions ||
      totalQuestions <= 0 ||
      quantity <= 0
    ){
      setDistributionPreview([]);
      return;
    }

    if(distributionMode === "balanced"){

      const totalCount =
        Math.ceil(totalQuestions / quantity);

      const base =
        Math.floor(totalQuestions / totalCount);

      const extra =
        totalQuestions % totalCount;

      const arr = [];

      for(let i=0; i<totalCount; i++){
        arr.push(base + (i < extra ? 1 : 0));
      }

      setDistributionPreview(arr);
    }

    if(distributionMode === "extra"){

      const arr = [];

      const full =
        Math.floor(totalQuestions / quantity);

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
    totalQuestions,
    quantity,
    remainder
  ]);

  function handleQuantityChange(raw){

    setQuantityInput(raw);
    setQuantityError("");

    const value = Number(raw);

    if(!raw || isNaN(value) || value <= 0){
      return;
    }

    if(value > totalQuestions){

      setQuantityError(
        `Max allowed: ${totalQuestions} questions`
      );

      return;
    }

    setQuantity(value);
  }

  function getNextMockNumber(baseName){

    if(!baseName) return 1;

    const cleanBase =
      baseName.trim().toLowerCase();

    let max = 0;

    exams.forEach((exam)=>{

      const examName =
        String(exam.name || "")
          .trim()
          .toLowerCase();

      if(!examName.startsWith(cleanBase)) return;

      const remaining =
        examName
          .replace(cleanBase,"")
          .trim();

      const match =
        remaining.match(/^(\d+)$/);

      if(match){

        const num =
          parseInt(match[1],10);

        if(num > max){
          max = num;
        }

      }

    });

    return max + 1;
  }

  function getUsedQuestionIds(baseName){

    const usedIds = new Set();

    if(!baseName) return usedIds;

    exams.forEach((exam)=>{

      const examName =
        String(exam.name || "")
          .trim()
          .toLowerCase();

      const cleanBase =
        baseName.trim().toLowerCase();

      if(!examName.startsWith(cleanBase)) return;

      if(Array.isArray(exam.questionIds)){
        exam.questionIds.forEach((id)=>{
          usedIds.add(id);
        });
      }

      if(Array.isArray(exam.questions)){
        exam.questions.forEach((q)=>{
          usedIds.add(q.id);
        });
      }

    });

    return usedIds;
  }

  async function handleGenerate(){

    if(!mockName.trim()){
      alert("Enter mock name");
      return;
    }

    if(!subjectId){
      alert("Select subject");
      return;
    }

    if(totalQuestions === 0){
      alert("No questions available");
      return;
    }

    if(quantity <= 0 || quantity > totalQuestions){
      alert(`Questions must be between 1 and ${totalQuestions}`);
      return;
    }

    const trimmedName =
      mockName.trim();

    const exactMatch =
      exams.find(
        (e)=>
          e.name
            .trim()
            .toLowerCase() ===
          trimmedName.toLowerCase()
      );

    if(exactMatch){

      alert(
        `A mock named "${trimmedName}" already exists`
      );

      return;
    }

    const sameQuestionMock =
      exams.find((exam)=>{

        if(!Array.isArray(exam.questionIds)){
          return false;
        }

        const existingIds =
          [...exam.questionIds]
            .sort()
            .join(",");

        const currentIds =
          filteredQuestions
            .map((q)=> q.id)
            .sort()
            .join(",");

        return existingIds === currentIds;

      });

    if(sameQuestionMock){

      alert(
        `A mock with same questions already exists: "${sameQuestionMock.name}"`
      );

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

      const startNumber =
        getNextMockNumber(trimmedName);

      const usedIds =
        getUsedQuestionIds(trimmedName);

      let availablePool =
        filteredQuestions
          .filter((q)=> !usedIds.has(q.id))
          .sort(()=> Math.random() - 0.5);

      if(availablePool.length === 0){

        alert(
          `All questions already used for "${trimmedName}". No unique mock can be generated.`
        );

        setLoading(false);
        return;
      }

      let poolIndex = 0;

      for(let i=0; i<finalDistribution.length; i++){

        if(poolIndex >= availablePool.length){

          alert(
            `No unique questions left for ${trimmedName}`
          );

          break;
        }

        const currentNumber =
          startNumber + i;

        const currentName =
          `${trimmedName} ${currentNumber}`;

        const nameConflict =
          exams.find(
            (e)=>
              e.name
                .trim()
                .toLowerCase() ===
              currentName.toLowerCase()
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

        if(questionsForThisMock.length < count){

          alert(
            `Only ${questionsForThisMock.length} unique questions left`
          );

          break;
        }

        poolIndex += count;

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

          distribution: [
            questionsForThisMock.length
          ],

          questions:
            questionsForThisMock,

        });

        generated.push(currentName);

        setGenerationProgress(
          Math.floor(
            ((i + 1) / finalDistribution.length) * 100
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

  const nextNumber =
    getNextMockNumber(mockName.trim());

  return (
    <AdminLayout>

      <div className="page mock-generator-page">

        <button
          className="generate-btn"
          onClick={handleGenerate}
          disabled={
            loading ||
            !!quantityError ||
            !!desiredMockError
          }
        >
          {loading
            ? `Generating ${generationProgress}%...`
            : "🚀 Generate Mocks"}
        </button>

      </div>

    </AdminLayout>
  );

}
