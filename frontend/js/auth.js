import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  signOut
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

import { auth, db, googleProvider } from "./firebase-config.js";

const signupForm = document.getElementById("signupForm");
const loginForm = document.getElementById("loginForm");
const googleSignupBtn = document.getElementById("googleSignupBtn");
const googleLoginBtn = document.getElementById("googleLoginBtn");
const messageBox = document.getElementById("authMessage");

/* Signup with Email */
if (signupForm) {
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const fullName = document.getElementById("signupName").value.trim();
    const email = document.getElementById("signupEmail").value.trim();
    const password = document.getElementById("signupPassword").value.trim();

    if (!fullName || !email || !password) {
      showMessage("Please fill all fields.", "error");
      return;
    }

    if (password.length < 6) {
      showMessage("Password must be minimum 6 characters.", "error");
      return;
    }

    try {
      showMessage("Creating account...", "success");

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: fullName
      });

      await setDoc(doc(db, "users", user.uid), {
        fullName: fullName,
        email: email,
        provider: "email",
        department: "",
        createdAt: serverTimestamp()
      });

      saveUserToLocal(user.uid, fullName, email);
      initializeZeroDashboardData();

      showMessage("Signup successful! Redirecting...", "success");

      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 900);
    } catch (error) {
      handleAuthError(error);
    }
  });
}

/* Login with Email */
if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value.trim();

    if (!email || !password) {
      showMessage("Please enter email and password.", "error");
      return;
    }

    try {
      showMessage("Logging in...", "success");

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (!userDoc.exists()) {
        await signOut(auth);
        showMessage("This email is not registered. Please signup first.", "error");
        return;
      }

      const data = userDoc.data();

      saveUserToLocal(
        user.uid,
        data.fullName || user.displayName || "User",
        user.email
      );

      initializeZeroDashboardData();

      showMessage("Login successful! Redirecting...", "success");

      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 900);
    } catch (error) {
      handleAuthError(error);
    }
  });
}

/* Signup with Google */
if (googleSignupBtn) {
  googleSignupBtn.addEventListener("click", async () => {
    try {
      showMessage("Opening Google signup...", "success");

      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const fullName = user.displayName || "Google User";
      const email = user.email || "";

      await setDoc(doc(db, "users", user.uid), {
        fullName: fullName,
        email: email,
        provider: "google",
        department: "",
        createdAt: serverTimestamp()
      }, { merge: true });

      saveUserToLocal(user.uid, fullName, email);
      initializeZeroDashboardData();

      showMessage("Google signup successful! Redirecting...", "success");

      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 900);
    } catch (error) {
      handleAuthError(error);
    }
  });
}

/* Google Login - Registered users only */
if (googleLoginBtn) {
  googleLoginBtn.addEventListener("click", async () => {
    try {
      showMessage("Checking Google account...", "success");

      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (!userDoc.exists()) {
        await signOut(auth);
        showMessage("Not registered. Please signup first.", "error");
        return;
      }

      const data = userDoc.data();

      saveUserToLocal(
        user.uid,
        data.fullName || user.displayName || "User",
        user.email
      );

      initializeZeroDashboardData();

      showMessage("Google login successful! Redirecting...", "success");

      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 900);
    } catch (error) {
      handleAuthError(error);
    }
  });
}

/* Helpers */
function saveUserToLocal(uid, fullName, email) {
  localStorage.setItem("skillcracker_user", JSON.stringify({
    uid: uid,
    name: fullName,
    email: email,
    department: "",
    isLoggedIn: true
  }));
}

function initializeZeroDashboardData() {
  if (!localStorage.getItem("skillcracker_rounds")) {
    localStorage.setItem("skillcracker_rounds", JSON.stringify({
      round1: { name: "Self Introduction Round", completed: false, score: 0 },
      round2: { name: "Resume-Based Round", completed: false, score: 0 },
      round3: { name: "Project / Website Round", completed: false, score: 0 },
      round4: { name: "AI Code / Task Round", completed: false, score: 0 },
      round5: { name: "Course-Based Interview", completed: false, score: 0 }
    }));
  }

  if (!localStorage.getItem("skillcracker_practice_time")) {
    localStorage.setItem("skillcracker_practice_time", JSON.stringify("00:00:00"));
  }
}

function showMessage(message, type) {
  if (!messageBox) return;

  messageBox.textContent = message;
  messageBox.className = `message ${type}`;
}

function handleAuthError(error) {
  console.error("Firebase Auth Error:", error);

  const code = error.code;

  if (code === "auth/email-already-in-use") {
    showMessage("This email is already registered. Please login.", "error");
    return;
  }

  if (code === "auth/weak-password") {
    showMessage("Password is too weak. Use minimum 6 characters.", "error");
    return;
  }

  if (code === "auth/invalid-email") {
    showMessage("Invalid email address.", "error");
    return;
  }

  if (code === "auth/invalid-credential") {
    showMessage("Invalid email or password.", "error");
    return;
  }

  if (code === "auth/user-not-found") {
    showMessage("This email is not registered. Please signup first.", "error");
    return;
  }

  if (code === "auth/wrong-password") {
    showMessage("Wrong password.", "error");
    return;
  }

  if (code === "auth/popup-closed-by-user") {
    showMessage("Google popup closed. Please try again.", "error");
    return;
  }

  if (code === "auth/cancelled-popup-request") {
    showMessage("Popup cancelled. Try again.", "error");
    return;
  }

  if (code === "auth/popup-blocked") {
    showMessage("Popup blocked. Allow popup in browser.", "error");
    return;
  }

  if (code === "auth/unauthorized-domain") {
    showMessage("Unauthorized domain. Add 127.0.0.1 in Firebase authorized domains.", "error");
    return;
  }

  if (code === "permission-denied") {
    showMessage("Firestore permission denied. Check Firestore rules.", "error");
    return;
  }

  showMessage(error.message || "Something went wrong. Please try again.", "error");
}