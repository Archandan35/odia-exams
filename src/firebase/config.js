import {
  initializeApp,
} from "firebase/app";

import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";

import {
  getFirestore,
} from "firebase/firestore";

const firebaseConfig = {

  apiKey:
    "AIzaSyD_RiRoqFccROtU1zgvNXWFAO4rTYDMt24",

  authDomain:
    "mock-test-platform-4295d.firebaseapp.com",

  projectId:
    "mock-test-platform-4295d",

  storageBucket:
    "mock-test-platform-4295d.firebasestorage.app",

  messagingSenderId:
    "472963857360",

  appId:
    "1:472963857360:web:dde2bcef807d1de828d7d5",

};

const app =
  initializeApp(
    firebaseConfig
  );

export const auth =
  getAuth(app);

export const db =
  getFirestore(app);

// Keep user logged in after refresh
setPersistence(
  auth,
  browserLocalPersistence
);
