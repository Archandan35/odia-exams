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
// Fisher-Yates Shuffle
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
// Fetch Questions
// ========================================

export async function getFilteredQuestions({
  subjectId,
  topicId,
  subTopicId,
}) {

  let q =
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

  const finalQuery =
    query(q, ...conditions);

  const snapshot =
    await getDocs(finalQuery);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

// ========================================
// Generate Mocks
// ========================================

export async function generateMocks({

  mockType,
  subjectId,
  topicId,
  subTopicId,
  quantity,
  duration,

}) {

  // Fetch all matching questions

  const questions =
    await getFilteredQuestions({

      subjectId,
      topicId,
      subTopicId,

    });

  // Shuffle ONCE

  const shuffledQuestions =
    shuffleArray(questions);

  // Calculate total mocks

  const totalMocks =
    Math.floor(
      shuffledQuestions.length /
      quantity
    );

  // Create all mocks

  for (
    let i = 0;
    i < totalMocks;
    i++
  ) {

    const start =
      i * quantity;

    const end =
      start + quantity;

    const mockQuestions =
      shuffledQuestions.slice(
        start,
        end
      );

    await addDoc(
      collection(db, "exams"),
      {

        name:
          `${mockType === "full"
            ? "Full Mock"
            : "Sectional Mock"
          } ${i + 1}`,

        mockType,

        subjectId,

        topicId,

        subTopicId,

        totalQuestions:
          quantity,

        duration,

        questionIds:
          mockQuestions.map(
            (q) => q.id
          ),

        createdAt:
          serverTimestamp(),

      }
    );
  }

  return {
    totalQuestions:
      shuffledQuestions.length,

    totalMocks,
  };
}
