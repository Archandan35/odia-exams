import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate }
from "react-router-dom";

import {
  collection,
  getDocs,
  onSnapshot,
} from "firebase/firestore";

import { db }
from "../firebase/config";

import AdminLayout
from "./AdminLayout";

import {
  listenSubjects,
} from "../services/subjectService";

import {
  generateMocks,
} from "../services/mockGeneratorService";

export default function MockGeneratorPage(){

  const navigate =
    useNavigate();

  /* =========================================
     STATES
  ========================================= */

  const [subjects,setSubjects] =
    useState([]);

  const [topics,setTopics] =
    useState([]);

  const [subTopics,setSubTopics] =
    useState([]);

  const [questions,setQuestions] =
    useState([]);

  const [mockName,setMockName] =
    useState("");

  const [mockType,setMockType] =
    useState("sectional");

  const [subjectId,setSubjectId] =
    useState("");

  const [topic,setTopic] =
    useState("");

  const [subTopic,setSubTopic] =
    useState("");

  const [quantity,setQuantity] =
    useState(100);

  const [duration,setDuration] =
    useState(60);

  const [
    secondsPerQuestion,
    setSecondsPerQuestion,
  ] = useState(30);

  const [
    desiredMocks,
    setDesiredMocks,
  ] = useState(1);

  const [
    includeAllQuestions,
    setIncludeAllQuestions,
  ] = useState(true);

  const [
    distributionMode,
    setDistributionMode,
  ] = useState("balanced");

  const [
    manualDistribution,
    setManualDistribution,
  ] = useState("");

  const [
    distributionPreview,
    setDistributionPreview,
  ] = useState([]);

  const [loading,setLoading] =
    useState(false);

  const [
    generationProgress,
    setGenerationProgress,
  ] = useState(0);

  const [
    generatedMocks,
    setGeneratedMocks,
  ] = useState([]);

  const [toast,setToast] =
    useState({
      show:false,
      message:"",
      type:"success",
    });

  /* =========================================
     TOAST
  ========================================= */

  function showToast(
    message,
    type="success"
  ){

    setToast({
      show:true,
      message,
      type,
    });

    setTimeout(()=>{

      setToast({
        show:false,
        message:"",
        type:"success",
      });

    },3000);

  }

  /* =========================================
     LOAD SUBJECTS
  ========================================= */

  useEffect(()=>{

    const unsubscribe =
      listenSubjects(
        setSubjects
      );

    return ()=>unsubscribe();

  },[]);

  /* =========================================
     LOAD TOPICS
  ========================================= */

  useEffect(()=>{

    const unsub =
      onSnapshot(

        collection(
          db,
          "topics"
        ),

        (snapshot)=>{

          const data =
            snapshot.docs.map(
              (doc)=>({
                id:doc.id,
                ...doc.data(),
              })
            );

          setTopics(data);

        }

      );

    return ()=>unsub();

  },[]);

  /* =========================================
     LOAD SUBTOPICS
  ========================================= */

  useEffect(()=>{

    const unsub =
      onSnapshot(

        collection(
          db,
          "subtopics"
        ),

        (snapshot)=>{

          const data =
            snapshot.docs.map(
              (doc)=>({
                id:doc.id,
                ...doc.data(),
              })
            );

          setSubTopics(data);

        }

      );

    return ()=>unsub();

  },[]);

  /* =========================================
     LOAD QUESTIONS
  ========================================= */

  useEffect(()=>{

    async function loadQuestions(){

      const snapshot =
        await getDocs(
          collection(
            db,
            "questions"
          )
        );

      const data =
        snapshot.docs.map(
          (doc)=>({
            id:doc.id,
            ...doc.data(),
          })
        );

      setQuestions(data);

    }

    loadQuestions();

  },[]);

  /* =========================================
     FILTER TOPICS
  ========================================= */

  const filteredTopics =
    topics.filter(
      (item)=>

        String(
          item.subjectId
        ) ===
        String(subjectId)
    );

  /* =========================================
     FILTER SUBTOPICS
  ========================================= */

  const filteredSubTopics =
    subTopics.filter(
      (item)=>

        String(
          item.subjectId
        ) ===
        String(subjectId)

        &&

        String(
          item.topicId
        ) ===
        String(topic)

    );

  /* =========================================
     FILTER QUESTIONS
  ========================================= */

  const filteredQuestions =
    useMemo(()=>{

      return questions.filter(
        (q)=>{

          const subjectMatch =
            subjectId

              ?

              String(
                q.subjectId
              ) ===
              String(subjectId)

              :

              true;

          const topicMatch =
            topic

              ?

              String(
                q.topicId
              ) ===
              String(topic)

              :

              true;

          const subTopicMatch =
            subTopic

              ?

              String(
                q.subTopicId
              ) ===
              String(subTopic)

              :

              true;

          return (
            subjectMatch &&
            topicMatch &&
            subTopicMatch
          );

        }
      );

    },[
      questions,
      subjectId,
      topic,
      subTopic,
    ]);

  /* =========================================
     STATS
  ========================================= */

  const totalQuestions =
    filteredQuestions.length;

  const maximumMocks =
    Math.floor(
      totalQuestions /
      quantity
    );

  const remainder =
    totalQuestions %
    quantity;

  const calculatedMinutes =
    Math.ceil(
      (
        totalQuestions *
        secondsPerQuestion
      ) / 60
    );

  const recommendedStrategy =
    remainder > 0
      ? "balanced"
      : "extra";

  /* =========================================
     AUTO DURATION
  ========================================= */

  useEffect(()=>{

    if(
      calculatedMinutes > 0
    ){

      setDuration(
        calculatedMinutes
      );

    }

  },[
    calculatedMinutes
  ]);

  /* =========================================
     DISTRIBUTION
  ========================================= */

  useEffect(()=>{

    if(
      !includeAllQuestions
    ){

      setDistributionPreview([]);

      return;

    }

    if(
      totalQuestions <= 0
    ){

      setDistributionPreview([]);

      return;

    }

    /* BALANCED */

    if(
      distributionMode ===
      "balanced"
    ){

      const totalCount =
        Math.ceil(
          totalQuestions /
          quantity
        );

      const base =
        Math.floor(
          totalQuestions /
          totalCount
        );

      const extra =
        totalQuestions %
        totalCount;

      const arr = [];

      for(
        let i=0;
        i<totalCount;
        i++
      ){

        arr.push(

          base +

          (
            i < extra
              ? 1
              : 0
          )

        );

      }

      setDistributionPreview(
        arr
      );

    }

    /* EXTRA */

    if(
      distributionMode ===
      "extra"
    ){

      const arr = [];

      const full =
        Math.floor(
          totalQuestions /
          quantity
        );

      for(
        let i=0;
        i<full;
        i++
      ){

        arr.push(
          quantity
        );

      }

      if(
        remainder > 0
      ){

        arr.push(
          remainder
        );

      }

      setDistributionPreview(
        arr
      );

    }

    /* MANUAL */

    if(
      distributionMode ===
      "manual"
    ){

      const arr =
        manualDistribution
          .split(",")

          .map((n)=>
            Number(
              n.trim()
            )
          )

          .filter(Boolean);

      setDistributionPreview(
        arr
      );

    }

  },[
    includeAllQuestions,
    distributionMode,
    manualDistribution,
    totalQuestions,
    quantity,
    remainder,
  ]);

  /* =========================================
     GENERATE
  ========================================= */

  async function handleGenerate(){

    try{

      if(!mockName){

        showToast(
          "Enter mock name",
          "error"
        );

        return;

      }

      if(!subjectId){

        showToast(
          "Select subject",
          "error"
        );

        return;

      }

      if(
        Number(quantity) >
        Number(totalQuestions)
      ){

        showToast(
          `Only ${totalQuestions} questions available`,
          "error"
        );

        return;

      }

      if(
        Number(desiredMocks) >
        Number(maximumMocks)
      ){

        showToast(
          `Maximum ${maximumMocks} mocks possible`,
          "error"
        );

        return;

      }

      setLoading(true);

      setGenerationProgress(0);

      const generated = [];

      const finalDistribution =

        includeAllQuestions

          ?

          distributionPreview

          :

          Array(
            desiredMocks
          ).fill(quantity);

      for(
        let i=0;
        i<
        finalDistribution.length;
        i++
      ){

        const currentName =
          `${mockName} ${i + 1}`;

        const result =
          await generateMocks({

            mockName:
              currentName,

            mockType,

            subject:

              filteredQuestions[0]?.subject ||

              subjects.find(
                (s)=>
                  s.id === subjectId
              )?.name ||

              subjects.find(
                (s)=>
                  s.id === subjectId
              )?.title ||

              "",

            topic:

              filteredQuestions[0]?.topic ||

              filteredTopics.find(
                (item)=>
                  item.id === topic
              )?.name ||

              filteredTopics.find(
                (item)=>
                  item.id === topic
              )?.title ||

              "",

            subTopic:

              filteredQuestions[0]?.subTopic ||

              filteredSubTopics.find(
                (item)=>
                  item.id === subTopic
              )?.name ||

              filteredSubTopics.find(
                (item)=>
                  item.id === subTopic
              )?.title ||

              "",

            duration:
              Number(duration),

            distribution:[
              finalDistribution[i]
            ],

            questions:
              filteredQuestions,

          });

        generated.push(
          ...result.generatedMocks
        );

        setGenerationProgress(

          Math.floor(

            (
              (i + 1) /
              finalDistribution.length
            ) * 100

          )

        );

      }

      setGeneratedMocks(
        generated
      );

      showToast(
        `${generated.length} mocks generated successfully`
      );

    }catch(error){

      console.error(error);

      showToast(
        error.message ||
        "Failed to generate mocks",
        "error"
      );

    }finally{

      setLoading(false);

    }

  }

  return(

    <AdminLayout>

      <div className="page mock-generator-page">

        {/* TOAST */}

        {
          toast.show && (

            <div
              className={`toast-box ${toast.type}`}
            >

              {toast.message}

            </div>

          )
        }

        {/* HEADER */}

        <div className="page-header">

          <div>

            <h2>
              Mock Generator
            </h2>

            <p>
              Generate intelligent mock tests automatically
            </p>

          </div>

        </div>

        {/* STATS */}

        <div className="mock-top-stats">

          <div className="mock-stat-card">

            <div className="mock-stat-icon">
              📄
            </div>

            <div className="mock-stat-content">

              <span>
                Total Questions
              </span>

              <h2>
                {totalQuestions}
              </h2>

            </div>

          </div>

          <div className="mock-stat-card">

            <div className="mock-stat-icon green">
              📋
            </div>

            <div className="mock-stat-content">

              <span>
                Maximum Mocks
              </span>

              <h2>
                {maximumMocks}
              </h2>

            </div>

          </div>

        </div>

      </div>

    </AdminLayout>

  );

}
