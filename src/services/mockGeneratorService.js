import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

import { db }
from "../firebase/config";

/* =========================================
   SHUFFLE ARRAY
========================================= */

function shuffleArray(array){

  const arr = [...array];

  for(
    let i = arr.length - 1;
    i > 0;
    i--
  ){

    const j =
      Math.floor(
        Math.random() * (i + 1)
      );

    [arr[i],arr[j]] =
    [arr[j],arr[i]];

  }

  return arr;

}

/* =========================================
   GENERATE SINGLE MOCK
========================================= */

export async function generateMocks({

  mockName,
  mockType,

  subject,
  topic,
  subTopic,

  subjectId,
  topicId,
  subTopicId,

  duration,

  questions,

}){

  try{

    /* VALIDATION */

    if(
      !questions ||
      questions.length === 0
    ){

      throw new Error(
        "No questions found"
      );

    }

    /* SHUFFLE QUESTIONS */

    const shuffledQuestions =
      shuffleArray(questions);

    /* EXAM DATA */

    const examData = {

      /* =====================================
         IMPORTANT FIX:
         DO NOT APPEND:
         ${mockName} ${i + 1}

         Frontend already generates:
         ବେଣୁଧର ରାଉତ 1
         ବେଣୁଧର ରାଉତ 2
         etc.

         So save EXACT name only.
      ===================================== */

      name:
        mockName,

      mockType:

        mockType || "sectional",

      subject:

        subject || "",

      subjectId:

        subjectId || "",

      topicName:

        topic || "",

      topicId:

        topicId || "",

      subTopicName:

        subTopic || "",

      subTopicId:

        subTopicId || "",

      duration:

        Number(duration) || 0,

      quantity:

        shuffledQuestions.length,

      totalQuestions:

        shuffledQuestions.length,

      questionIds:

        shuffledQuestions.map(
          (q)=> q.id
        ),

      questions:

        shuffledQuestions,

      createdAt:

        serverTimestamp(),

    };

    /* SAVE TO FIRESTORE */

    const docRef =

      await addDoc(
        collection(db,"exams"),
        examData
      );

    /* RETURN RESULT */

    return {

      success:true,

      generatedMocks:[
        {
          id:docRef.id,
          ...examData,
        }
      ],

    };

  }catch(error){

    console.error(
      "MOCK GENERATION ERROR:",
      error
    );

    throw error;

  }

}
