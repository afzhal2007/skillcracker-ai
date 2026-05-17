document.addEventListener("DOMContentLoaded", () => {
  initInstructionChecks();
});

function initInstructionChecks() {
  const checks = document.querySelectorAll(".agree-check");
  const startBtn = document.getElementById("startBtn");

  if (!checks.length || !startBtn) return;

  checks.forEach(check => {
    check.addEventListener("change", () => {
      const allChecked = [...checks].every(item => item.checked);
      startBtn.disabled = !allChecked;
    });
  });

  startBtn.addEventListener("click", () => {
    const allChecked = [...checks].every(item => item.checked);

    if (!allChecked) {
      showToast("Please complete all checkboxes first ⚠️");
      return;
    }

    SkillStorage.set("skillcracker_instructions_done", true);
    showToast("All set! Starting interview 🚀");

    setTimeout(() => {
      window.location.href = "rounds/self-intro.html";
    }, 900);
  });
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