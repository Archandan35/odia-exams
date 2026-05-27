import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase/config";

// ========================================
// SHUFFLE
// ========================================

function shuffleArray(array) {

  const arr = [...array];

  for (
    let i = arr.length - 1;
    i > 0;
    i--
  ) {

    const j =
      Math.floor(
        Math.random() * (i + 1)
      );

    [arr[i], arr[j]] =
      [arr[j], arr[i]];
  }

  return arr;
}

// ========================================
// GET FILTERED QUESTIONS
// ========================================

export async function getFilteredQuestions({

  subject,
  topic,
  subTopic,

}) {

  const ref =
    collection(db, "questions");

  const conditions = [];

  // SUBJECT

  if (
    subject &&
    subject !== ""
  ) {

    conditions.push(
      where(
        "subject",
        "==",
        subject
      )
    );
  }

  // TOPIC

  if (
    topic &&
    topic !== ""
  ) {

    conditions.push(
      where(
        "topic",
        "==",
        topic
      )
    );
  }

  // SUBTOPIC

  if (
    subTopic &&
    subTopic !== ""
  ) {

    conditions.push(
      where(
        "subTopic",
        "==",
        subTopic
      )
    );
  }

  const q =
    query(ref, ...conditions);

  const snapshot =
    await getDocs(q);

  return snapshot.docs.map(
    (doc)=>({

      id:doc.id,
      ...doc.data(),

    })
  );
}

// ========================================
// GENERATE MOCKS
// ========================================

export async function generateMocks({

  mockName,
  mockType,

  subject,
  topic,
  subTopic,

  duration,

  distribution,

}) {

  try {

    // ====================================
    // FETCH QUESTIONS
    // ====================================

    const questions =
      await getFilteredQuestions({

        subject,
        topic,
        subTopic,

      });

    if (
      !questions.length
    ) {

      throw new Error(
        "No questions found"
      );
    }

    // ====================================
    // SHUFFLE
    // ====================================

    const shuffledQuestions =
      shuffleArray(
        questions
      );

    let currentIndex = 0;

    // ====================================
    // CREATE MOCKS
    // ====================================

    for (
      let i = 0;
      i < distribution.length;
      i++
    ) {

      const questionCount =
        distribution[i];

      const selectedQuestions =
        shuffledQuestions.slice(

          currentIndex,

          currentIndex +
          questionCount

        );

      currentIndex +=
        questionCount;

      // =================================
      // SAVE EXAM
      // =================================

      await addDoc(
        collection(db, "exams"),
        {

          // BASIC

          name:
            `${mockName} ${i + 1}`,

          mockType,

          // SUBJECTS

          subject:
            subject || "",

          topic:
            topic || "",

          subTopic:
            subTopic || "",

          // QUESTIONS

          totalQuestions:
            questionCount,

          questionIds:
            selectedQuestions.map(
              (q)=>q.id
            ),

          questions:
            selectedQuestions,

          duration,

          createdAt:
            serverTimestamp(),

        }
      );
    }

    return {

      success:true,

      totalMocks:
        distribution.length,

    };

  } catch(error) {

    console.error(
      "MOCK GENERATION ERROR:",
      error
    );

    throw error;
  }
}
