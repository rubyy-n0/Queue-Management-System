// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, getDoc, updateDoc, onSnapshot, runTransaction } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDGYCLGJzmtGuqYgsPnm2X_BXIr1fdSQ3o",
  authDomain: "cloudq-2b553.firebaseapp.com",
  projectId: "cloudq-2b553",
  storageBucket: "cloudq-2b553.firebasestorage.app",
  messagingSenderId: "217233241908",
  appId: "1:217233241908:web:3235c4f79fddd4e2501761"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Export instances and core methods for use in app.js and admin.js
export { db, doc, getDoc, updateDoc, onSnapshot, runTransaction };