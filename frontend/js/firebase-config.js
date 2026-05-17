import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAhHaN5YXMbKtaY__5HwRVFZcNgAZxXZQY",
  authDomain: "skillcracker-ai.firebaseapp.com",
  projectId: "skillcracker-ai",
  storageBucket: "skillcracker-ai.firebasestorage.app",
  messagingSenderId: "167945020882",
  appId: "1:167945020882:web:fe7847346ab66e9977d40b",
  measurementId: "G-3Q743KLF51"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();