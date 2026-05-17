import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { auth, db } from "./firebase-config.js";

const loginBtn = document.getElementById("loginTopBtn");
const signupBtn = document.getElementById("signupTopBtn");
const logoutTopBtn = document.getElementById("logoutTopBtn");
const logoutNavBtn = document.getElementById("logoutBtn");
const sideName = document.getElementById("sideUserName");
const topName = document.getElementById("topUserName");
const welcomeName = document.getElementById("welcomeName");
const topCourse = document.getElementById("topUserCourse");

const GUEST_USER = {
  uid: "guest",
  name: "Guest User",
  email: "",
  course: "AI & Data Science",
  isLoggedIn: false
};

function parseLocalUser() {
  const stored = localStorage.getItem("skillcracker_user");
  if (!stored) return { ...GUEST_USER };
  try {
    return JSON.parse(stored);
  } catch {
    return { ...GUEST_USER };
  }
}

function setLocalUser(userData) {
  localStorage.setItem("skillcracker_user", JSON.stringify(userData));
}

function updateAuthUI() {
  const user = parseLocalUser();
  const loggedIn = user?.isLoggedIn === true;

  if (sideName) sideName.textContent = user.name || "Guest User";
  if (topName) topName.textContent = user.name || "Guest User";
  if (welcomeName) welcomeName.textContent = user.name || "Guest User";
  if (topCourse) topCourse.textContent = user.course || "AI & Data Science";

  if (loginBtn) loginBtn.style.display = loggedIn ? "none" : "inline-flex";
  if (signupBtn) signupBtn.style.display = loggedIn ? "none" : "inline-flex";
  if (logoutTopBtn) logoutTopBtn.style.display = loggedIn ? "inline-flex" : "none";
  if (logoutNavBtn) logoutNavBtn.style.display = loggedIn ? "flex" : "none";
}

function isAuthPage() {
  const page = window.location.pathname.split("/").pop();
  return page === "login.html" || page === "signup.html";
}

function redirectIfOnAuthPage() {
  if (!isAuthPage()) return;
  const destination = localStorage.getItem("skillcracker_redirect_after_login") || "dashboard.html";
  window.location.href = destination;
}

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.exists() ? userSnap.data() : {};

    const name = userData.fullName || user.displayName || "User";
    const course = userData.course || "AI & Data Science";

    setLocalUser({
      uid: user.uid,
      name,
      email: user.email || "",
      course,
      isLoggedIn: true
    });

    updateAuthUI();
    redirectIfOnAuthPage();
    return;
  }

  setLocalUser({ ...GUEST_USER });
  updateAuthUI();
});

window.addEventListener("DOMContentLoaded", updateAuthUI);
