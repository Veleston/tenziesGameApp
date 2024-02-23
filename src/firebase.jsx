// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore,collection } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDAtz1Yeqv2Xyss0PB2liFHxHqQKO5wjGA",
  authDomain: "tenziesgame-e7e0e.firebaseapp.com",
  projectId: "tenziesgame-e7e0e",
  storageBucket: "tenziesgame-e7e0e.appspot.com",
  messagingSenderId: "1059227477199",
  appId: "1:1059227477199:web:1fb9643ac3d79753bbc3ba"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app)
export const gameScoresCollection = collection(db, "game-scores")