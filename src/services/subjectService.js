import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";

import {
  db,
} from "../firebase/config";

const subjectsRef =
  collection(db, "subjects");

export async function addSubject(subject) {

  await addDoc(
    subjectsRef,
    subject
  );
}

export async function deleteSubject(id) {

  await deleteDoc(
    doc(db, "subjects", id)
  );
}

export async function updateSubject(
  id,
  data
) {

  await updateDoc(
    doc(db, "subjects", id),
    data
  );
}

export function listenSubjects(callback) {

  return onSnapshot(
    subjectsRef,
    (snapshot) => {

      const data =
        snapshot.docs.map((d) => ({
          id:d.id,
          ...d.data(),
        }));

      callback(data);

    }
  );
}
