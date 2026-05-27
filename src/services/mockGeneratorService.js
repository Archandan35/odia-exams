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

  for (let i = arr.length - 1; i > 0; i--) {

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
  subjectId,
  topicId,
  subTopicId,
}) {

  const ref =
    collection(db, "questions");

  const conditions = [];

  if (subjectId) {

    conditions.push(
      where(
        "subjectId",
        "==",
        subjectId
      )
    );
  }

  if (topicId) {

    conditions.push(
      where(
        "topicId",
        "==",
        topicId
      )
    );
  }

  if (subTopicId) {

    conditions.push(
      where(
        "subTopicId",
        "==",
        subTopicId
      )
    );
  }

  const q =
    query(ref, ...conditions);

  const snapshot =
    await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

// ========================================
// GENERATE MOCKS
// ========================================

export async function generateMocks({

  mockName,
  mockType,

  subjectId,
  subjectName,

  topicId,
  topicName,

  subTopicId,
  subTopicName,

  duration,

  distribution,

}) {

  try {

    // ====================================
    // FETCH QUESTIONS
    // ====================================

    const questions =
      await getFilteredQuestions({

        subjectId,
        topicId,
        subTopicId,

      });

    if (!questions.length) {

      throw new Error(
        "No questions found"
      );
    }

    // ====================================
    // SHUFFLE QUESTIONS
    // ====================================

    const shuffledQuestions =
      shuffleArray(questions);

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

      // ================================
      // SAVE EXAM
      // ================================

      await addDoc(
        collection(db, "exams"),
        {

          name:
            `${mockName} ${i + 1}`,

          mockType,

          // IDs

          subjectId:
            subjectId || "",

          topicId:
            topicId || "",

          subTopicId:
            subTopicId || "",

          // Names

          subjectName:
            subjectName || "",

          topicName:
            topicName || "",

          subTopicName:
            subTopicName || "",

          // Questions

          totalQuestions:
            questionCount,

          questionIds:
            selectedQuestions.map(
              (q) => q.id
            ),

          duration,

          createdAt:
            serverTimestamp(),

        }
      );
    }

    return {

      success: true,

      totalMocks:
        distribution.length,

      totalQuestions:
        shuffledQuestions.length,

    };

  } catch (error) {

    console.error(
      "MOCK GENERATION ERROR:",
      error
    );

    throw error;
  }
}
