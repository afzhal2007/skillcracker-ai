import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

import {
  doc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

import { auth, db } from "./firebase-config.js";

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    window.location.href = "signup.html";
    return;
  }

  const data = userSnap.data();

  const fullName = data.fullName || user.displayName || "User";
  const department = data.department || "";

  localStorage.setItem("skillcracker_user", JSON.stringify({
    uid: user.uid,
    name: fullName,
    email: user.email || data.email || "",
    department: department,
    isLoggedIn: true
  }));

  initializeZeroDashboardData();
  updateDashboardUser(fullName, department);
  updateAuthButtons();
  initDepartmentPopup(user.uid, department);
});

function updateDashboardUser(fullName, department) {
  setText("sideUserName", fullName);
  setText("topUserName", fullName);
  setText("welcomeName", fullName);
  setText("topUserCourse", department || "Select Department");
}

function updateAuthButtons() {
  const loginBtn = document.getElementById("loginTopBtn");
  const signupBtn = document.getElementById("signupTopBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  if (loginBtn) loginBtn.style.display = "none";
  if (signupBtn) signupBtn.style.display = "none";
  if (logoutBtn) logoutBtn.style.display = "flex";
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

function initDepartmentPopup(uid, currentDepartment) {
  const modal = document.getElementById("departmentModal");
  const select = document.getElementById("departmentSelect");
  const saveBtn = document.getElementById("saveDepartmentBtn");

  if (!modal || !select || !saveBtn) {
    return;
  }

  if (!currentDepartment) {
    modal.classList.add("show");
  } else {
    select.value = currentDepartment;
    modal.classList.remove("show");
  }

  saveBtn.addEventListener("click", async () => {
    const selectedDepartment = select.value.trim();

    if (!selectedDepartment) {
      alert("Please select your department");
      return;
    }

    saveBtn.textContent = "Saving...";
    saveBtn.disabled = true;

    try {
      await updateDoc(doc(db, "users", uid), {
        department: selectedDepartment
      });

      const userData = JSON.parse(localStorage.getItem("skillcracker_user")) || {};
      userData.department = selectedDepartment;
      localStorage.setItem("skillcracker_user", JSON.stringify(userData));

      setText("topUserCourse", selectedDepartment);
      modal.classList.remove("show");
    } catch (error) {
      console.error(error);
      alert("Department save failed. Check Firestore rules.");
    } finally {
      saveBtn.textContent = "Save Department →";
      saveBtn.disabled = false;
    }
  });
}

function setText(id, value) {
  const element = document.getElementById(id);

  if (element) {
    element.textContent = value;
  }
}