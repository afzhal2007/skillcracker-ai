import {
  signOut
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

import { auth } from "./firebase-config.js";

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", async (event) => {
    event.preventDefault();

    await signOut(auth);

    localStorage.removeItem("skillcracker_user");
    localStorage.removeItem("skillcracker_rounds");
    localStorage.removeItem("skillcracker_practice_time");
    localStorage.removeItem("skillcracker_reports");

    window.location.href = "login.html";
  });
}