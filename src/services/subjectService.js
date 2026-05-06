import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";

import {
  db,
} from "../firebase/config";

const subjectsRef =
  collection(db, "subjects");

export async function addSubject(
  subject
) {

  await addDoc(
    subjectsRef,
    subject
  );
}

export async function deleteSubject(
  id
) {

  await deleteDoc(
    doc(db, "subjects", id)
  );
}

export function listenSubjects(
  callback
) {

  return onSnapshot(
    subjectsRef,
    (snapshot) => {

      const data =
        snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

      callback(data);

    }
  );
}
