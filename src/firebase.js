import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAKhz-4zJvoHdNiOQW0qWP_jsGCYx7ONTY",
  authDomain: "mindcare-ner-f7904.firebaseapp.com",
  projectId: "mindcare-ner-f7904",
  storageBucket: "mindcare-ner-f7904.firebasestorage.app",
  messagingSenderId: "29266520527",
  appId: "1:29266520527:web:a552edea271b6677284aba",
  measurementId: "G-VSET9FQC0C"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;
