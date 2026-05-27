import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase/config";

/* =========================================
   SHUFFLE ARRAY
========================================= */

function shuffleArray(array){

  const arr = [...array];

  for(let i = arr.length - 1; i > 0; i--){

    const j = Math.floor(Math.random() * (i + 1));

    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
}

/* =========================================
   GENERATE MOCKS
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

    if(!questions || questions.length === 0){
      throw new Error("No questions found");
    }

    const shuffledQuestions = shuffleArray(questions);

    const examData = {

      name: mockName,

      /* IMPORTANT */
      mockType: mockType || "sectional",

      /* SUBJECT */
      subject: subject || "",
      subjectId: subjectId || "",

      /* TOPIC */
      topicName: topic || "",
      topicId: topicId || "",

      /* SUBTOPIC */
      subTopicName:

        mockType === "sectional"
          ? subTopic || ""
          : "",

      subTopicId:

        mockType === "sectional"
          ? subTopicId || ""
          : "",

      duration: Number(duration) || 0,

      quantity: shuffledQuestions.length,

      totalQuestions: shuffledQuestions.length,

      questionIds:
        shuffledQuestions.map((q)=> q.id),

      questions: shuffledQuestions,

      createdAt: serverTimestamp(),

    };

    const docRef = await addDoc(
      collection(db,"exams"),
      examData
    );

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
