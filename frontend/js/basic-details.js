document.addEventListener("DOMContentLoaded", () => {
  loadBasicDetails();
  handleBasicForm();
});

function loadBasicDetails() {
  const user = getUser();

  setValue("fullName", user.name || "User");
  setValue("course", user.course || "AI & Data Science");
  setValue("email", user.email || "");
  setValue("phone", user.phone || "");
  setValue("location", user.location || "");
  setValue("year", user.year || "");
  setValue("college", user.college || "");
  setValue("score", user.score || "");
  setValue("skills", user.skills || "");
  setValue("targetRole", user.targetRole || "");
  setValue("goal", user.goal || "");
  setValue("projectLink", user.projectLink || "");
  setValue("projectDescription", user.projectDescription || "");
}

function handleBasicForm() {
  const form = document.getElementById("basicDetailsForm");

  if (!form) return;

  form.addEventListener("submit", event => {
    event.preventDefault();

    const user = {
      name: getValue("fullName") || "User",
      course: getValue("course") || "AI & Data Science",
      email: getValue("email"),
      phone: getValue("phone"),
      location: getValue("location"),
      year: getValue("year"),
      college: getValue("college"),
      score: getValue("score"),
      skills: getValue("skills"),
      targetRole: getValue("targetRole"),
      goal: getValue("goal"),
      projectLink: getValue("projectLink"),
      projectDescription: getValue("projectDescription")
    };

    saveUser(user);
    showToast("Details saved successfully ✅");

    setTimeout(() => {
      window.location.href = "instructions.html";
    }, 900);
  });
}

function getValue(id) {
  const element = document.getElementById(id);
  return element ? element.value.trim() : "";
}

function setValue(id, value) {
  const element = document.getElementById(id);
  if (element) element.value = value;
}

function showToast(message) {
  const toast = document.getElementById("toast");

  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2000);
}