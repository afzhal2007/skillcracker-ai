document.addEventListener("DOMContentLoaded", () => {
  loadDashboard();
  initSidebarToggle();
});

function initSidebarToggle() {
  const menuBtn = document.getElementById("mobileMenuBtn");
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");
  const sideLinks = document.querySelectorAll(".side-menu a");

  function updateMenuButton(isOpen) {
    if (!menuBtn) return;
    menuBtn.textContent = isOpen ? "✕" : "☰";
    menuBtn.classList.toggle("open", isOpen);
    menuBtn.setAttribute("aria-label", isOpen ? "Close sidebar menu" : "Open sidebar menu");
  }

  function openSidebar() {
    sidebar?.classList.add("open");
    overlay?.classList.add("visible");
    document.body.classList.add("no-scroll");
    updateMenuButton(true);
  }

  function closeSidebar() {
    sidebar?.classList.remove("open");
    overlay?.classList.remove("visible");
    document.body.classList.remove("no-scroll");
    updateMenuButton(false);
  }

  menuBtn?.addEventListener("click", () => {
    if (sidebar?.classList.contains("open")) {
      closeSidebar();
    } else {
      openSidebar();
    }
  });

  overlay?.addEventListener("click", closeSidebar);
  sideLinks.forEach(link => link.addEventListener("click", closeSidebar));

  if (window.innerWidth <= 900) {
    closeSidebar();
  }

  window.addEventListener("resize", () => {
    if (window.innerWidth > 900) {
      closeSidebar();
    }
  });
}

function loadDashboard() {
  const user = getUser();
  const rounds = getRounds();
  const completedRounds = getCompletedRounds();
  const completedCount = getCompletedCount();
  const progress = getOverallProgress();
  const averageScore = getAverageScore();
  const practiceTime = getPracticeTime();

  setText("sideUserName", user.name || "User");
  setText("topUserName", user.name || "User");
  setText("welcomeName", user.name || "User");
  setText("topUserCourse", user.course || "AI & Data Science");

  setText("overallProgress", `${progress}%`);
  setText("averageScore", `${averageScore}%`);
  setText("roundsCompleted", completedCount);
  setText("completedText", `${completedCount} of 5`);
  setText("practiceTime", practiceTime);

  setWidth("overallProgressLine", progress);
  setWidth("averageScoreLine", averageScore);
  setWidth("roundsLine", progress);
  setWidth("timeLine", completedCount > 0 ? 40 : 0);

  setText("donutScore", `${averageScore}%`);
  updateDonut(averageScore);

  updateRoundUI("round1", rounds.round1, "legend1");
  updateRoundUI("round2", rounds.round2, "legend2");
  updateRoundUI("round3", rounds.round3, "legend3");
  updateRoundUI("round4", rounds.round4, "legend4");
  updateRoundUI("round5", rounds.round5, "legend5");

  updateActivity(completedRounds);
  updateStrengthFocus(completedRounds, averageScore);
  updateMotivation(completedCount, progress, averageScore);
}

function updateRoundUI(roundKey, round, legendId) {
  const statusEl = document.getElementById(`${roundKey}Status`);
  const scoreEl = document.getElementById(`${roundKey}Score`);
  const legendEl = document.getElementById(legendId);

  if (!statusEl || !scoreEl || !legendEl) return;

  if (round.completed) {
    statusEl.textContent = "Completed";
    statusEl.classList.remove("pending");
    statusEl.classList.add("completed");
    scoreEl.textContent = `${round.score}%`;
    legendEl.textContent = `${round.score}%`;
  } else {
    statusEl.textContent = "Pending";
    statusEl.classList.remove("completed");
    statusEl.classList.add("pending");
    scoreEl.textContent = "-";
    legendEl.textContent = "-";
  }
}

function updateDonut(score) {
  const scoreDonut = document.getElementById("scoreDonut");
  if (!scoreDonut) return;
  const degree = Math.round((score / 100) * 360);
  scoreDonut.style.background = `
    radial-gradient(circle, #061225 56%, transparent 57%),
    conic-gradient(
      #2f80ff 0deg,
      #9147ff ${degree}deg,
      rgba(148,163,184,0.15) ${degree}deg
    )
  `;
}

function updateActivity(completedRounds) {
  const activityList = document.getElementById("activityList");
  if (!activityList) return;

  if (completedRounds.length === 0) {
    activityList.innerHTML = `
      <div class="empty-state">
        <h3>No activity yet</h3>
        <p>Complete any round to see your activity here.</p>
      </div>
    `;
    return;
  }

  activityList.innerHTML = completedRounds.map(round => {
    const when = formatActivityDate(round.completedAt);
    return `
      <div class="activity-item">
        <div class="activity-dot">✓</div>
        <div>
          <h3>Completed ${round.name}</h3>
          <p>You scored ${round.score}%</p>
        </div>
        <time>${when}</time>
      </div>
    `;
  }).join("");
}

function formatActivityDate(dateString) {
  if (!dateString) return "Recently";

  const completedDate = new Date(dateString);
  if (isNaN(completedDate.getTime())) return "Recently";

  const now = new Date();

  const completedDay = new Date(
    completedDate.getFullYear(),
    completedDate.getMonth(),
    completedDate.getDate()
  );

  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  const diffMs = today - completedDay;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays > 1 && diffDays < 7) return `${diffDays} days ago`;

  return completedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function updateStrengthFocus(completedRounds, averageScore) {
  const strengthList = document.getElementById("strengthList");
  const focusList = document.getElementById("focusList");
  const suggestion = document.getElementById("aiSuggestion");
  if (!strengthList || !focusList || !suggestion) return;

  if (completedRounds.length === 0) {
    strengthList.innerHTML = `<span>No strengths yet</span>`;
    focusList.innerHTML = `<span>Complete rounds to get focus areas</span>`;
    suggestion.textContent = "Start your first interview round to get personalized AI suggestions.";
    return;
  }

  if (averageScore >= 80) {
    strengthList.innerHTML = `
      <span>Communication</span>
      <span>Confidence</span>
      <span>Answer Clarity</span>
    `;
    focusList.innerHTML = `
      <span>Advanced Examples</span>
      <span>Technical Depth</span>
    `;
    suggestion.textContent = "Excellent progress! Now focus on giving deeper answers with real examples.";
    return;
  }

  if (averageScore >= 60) {
    strengthList.innerHTML = `
      <span>Basic Understanding</span>
      <span>Good Attempt</span>
      <span>Learning Mindset</span>
    `;
    focusList.innerHTML = `
      <span>Grammar</span>
      <span>Pronunciation</span>
      <span>Answer Structure</span>
    `;
    suggestion.textContent = "You are improving. Speak slowly, use simple English, and explain answers step by step.";
    return;
  }

  strengthList.innerHTML = `<span>Started Practice</span>`;
  focusList.innerHTML = `
    <span>Confidence</span>
    <span>English Fluency</span>
    <span>Technical Explanation</span>
  `;
  suggestion.textContent = "Do not worry. Practice daily. Start with short answers and improve one round at a time.";
}

function updateMotivation(completedCount, progress, averageScore) {
  const title = document.getElementById("motivationTitle");
  const text = document.getElementById("motivationText");
  if (!title || !text) return;

  if (completedCount === 0) {
    title.textContent = "Start Your Interview Journey!";
    text.textContent = "Complete your first round to unlock progress, scores, mistake analysis, and improvement tips.";
    return;
  }

  if (completedCount < 5) {
    title.textContent = "Keep Going! You're Doing Great! 🚀";
    text.textContent = `You completed ${completedCount} round(s). Your progress is ${progress}%. Continue practicing to improve your score.`;
    return;
  }

  title.textContent = "Interview Completed! Great Work! 🏆";
  text.textContent = `You completed all rounds with an average score of ${averageScore}%. Check your final score and mistake analysis.`;
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value;
  }
}

function setWidth(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.style.width = `${value}%`;
  }
}
