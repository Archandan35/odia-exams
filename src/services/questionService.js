import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
  getDocs,
} from "firebase/firestore";

import {
  db,
} from "../firebase/config";

const questionsRef =
  collection(db, "questions");

export async function addQuestion(
  question
) {

  await addDoc(
    questionsRef,
    question
  );
}

export async function deleteQuestion(
  id
) {

  await deleteDoc(
    doc(
      db,
      "questions",
      id
    )
  );
}

export function listenQuestions(
  callback
) {

  return onSnapshot(
    questionsRef,
    (snapshot) => {

      const data =
        snapshot.docs.map((d)=>({
          id:d.id,
          ...d.data(),
        }));

      callback(data);

    }
  );
}

export async function getQuestionsBySubject(
  subject
) {

  const q =
    query(
      questionsRef,
      where(
        "subject",
        "==",
        subject
      )
    );

  const snapshot =
    await getDocs(q);

  return snapshot.docs.map((d)=>({
    id:d.id,
    ...d.data(),
  }));
}
