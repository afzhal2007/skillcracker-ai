document.addEventListener("DOMContentLoaded", () => {
  loadResultPage();
  initFeedback();
});

function loadResultPage() {
  const user = getUser();
  const rounds = getRounds();
  const reports = SkillStorage.get("skillcracker_reports", {});
  const completedCount = getCompletedCount();
  const average = getAverageScore();
  const practiceTime = getPracticeTime();

  const currentPage = window.location.pathname.split("/").pop();

  /*
    Final score page mattum protect pannum.
    Round score, mistake analysis, improvement tips, motivation pages open aagalam.
  */
  if (currentPage === "final-score.html" && completedCount < 5) {
    protectFinalScore(rounds);
    return;
  }

  setText("userName", user.name || "User");
  setText("finalScore", `${average}%`);
  setText("completedRounds", `${completedCount}/5`);
  setText("practiceTime", practiceTime);

  updateFinalMessage(average, completedCount);
  renderRoundCards(rounds);
  renderScoreTable(rounds);
  renderMistakes(rounds, reports);
  renderTips(rounds, reports);
  renderMotivation(user, average);
}

function protectFinalScore(rounds) {
  const message =
    "Please complete all interview rounds before viewing final report.";

  const finalMessage = document.getElementById("finalMessage");
  const heroTitle = document.querySelector(".hero-result h1");
  const heroPara = document.querySelector(".hero-result p");

  if (heroTitle) {
    heroTitle.textContent = "Final report is locked 🔒";
  }

  if (heroPara) {
    heroPara.textContent = message;
  }

  const target = getNextPendingRoundUrl(rounds);

  let timeLeft = 5;

  if (finalMessage) {
    finalMessage.textContent = `${message} Redirecting in ${timeLeft} seconds...`;
  }

  const timer = setInterval(() => {
    timeLeft--;

    if (finalMessage) {
      finalMessage.textContent = `${message} Redirecting in ${timeLeft} seconds...`;
    }

    if (timeLeft <= 0) {
      clearInterval(timer);
      window.location.href = target;
    }
  }, 1000);
}

function getNextPendingRoundUrl(rounds) {
  const map = {
    round1: "../rounds/self-intro.html",
    round2: "../rounds/resume-round.html",
    round3: "../rounds/project-website-round.html",
    round4: "../rounds/code-task-round.html",
    round5: "../rounds/course-interview-round.html"
  };

  const order = ["round1", "round2", "round3", "round4", "round5"];

  for (const key of order) {
    if (!rounds[key] || !rounds[key].completed) {
      return map[key];
    }
  }

  return "../dashboard.html";
}

function updateFinalMessage(score, completedCount) {
  const finalMessage = document.getElementById("finalMessage");

  if (!finalMessage) return;

  if (completedCount === 0) {
    finalMessage.textContent =
      "Complete all interview rounds patiently to unlock your final score.";
    return;
  }

  if (completedCount < 5) {
    finalMessage.textContent =
      "Complete all 5 rounds patiently to unlock your final report.";
    return;
  }

  if (score >= 80) {
    finalMessage.textContent =
      "Excellent! You are becoming interview-ready. Keep practicing with deeper answers.";
  } else if (score >= 60) {
    finalMessage.textContent =
      "Good start! Improve grammar, confidence, and answer structure.";
  } else {
    finalMessage.textContent =
      "Do not worry. Practice daily and improve one round at a time.";
  }
}

function renderRoundCards(rounds) {
  const grid = document.getElementById("roundScoreGrid");

  if (!grid) return;

  const icons = ["👤", "📄", "🌐", "⌨️", "🎓"];

  grid.innerHTML = Object.entries(rounds)
    .map(([key, round], index) => {
      const score = round.completed ? `${round.score}%` : "-";
      const status = round.completed ? "Completed" : "Pending";

      return `
        <div class="round-card">
          <span>${icons[index]}</span>
          <h3>${round.name}</h3>
          <b>${score}</b>
          <p>${status}</p>
        </div>
      `;
    })
    .join("");
}

function renderScoreTable(rounds) {
  const table = document.getElementById("scoreTable");

  if (!table) return;

  table.innerHTML = Object.entries(rounds)
    .map(([key, round], index) => {
      const no = String(index + 1).padStart(2, "0");
      const score = round.completed ? `${round.score}%` : "-";
      const statusClass = round.completed ? "done" : "pending";
      const statusText = round.completed ? "Completed" : "Pending";

      return `
        <div class="score-row">
          <div class="round-no">${no}</div>

          <div>
            <h3>${round.name}</h3>
            <p>${round.completed ? "Round finished successfully." : "Not completed yet."}</p>
          </div>

          <b>${score}</b>

          <span class="status-pill ${statusClass}">
            ${statusText}
          </span>
        </div>
      `;
    })
    .join("");
}

function renderMistakes(rounds, reports) {
  const mistakeList = document.getElementById("mistakeList");

  if (!mistakeList) return;

  const completedReports = Object.entries(rounds).filter(
    ([key, round]) => round.completed
  );

  if (completedReports.length === 0) {
    mistakeList.innerHTML = emptyCard(
      "No mistakes yet",
      "Complete any interview round to generate mistake analysis."
    );
    return;
  }

  mistakeList.innerHTML = completedReports
    .map(([key, round]) => {
      const report = reports[key] || {};
      const mistake = report.mistake || getDefaultMistake(round.score);

      return `
        <div class="analysis-card">
          <div class="analysis-icon">⚠️</div>

          <div>
            <h3>${round.name}</h3>
            <p>${mistake}</p>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderTips(rounds, reports) {
  const tipsGrid = document.getElementById("tipsGrid");

  if (!tipsGrid) return;

  const completedReports = Object.entries(rounds).filter(
    ([key, round]) => round.completed
  );

  if (completedReports.length === 0) {
    tipsGrid.innerHTML = emptyTip(
      "No tips yet",
      "Complete interview rounds to unlock personal improvement tips."
    );
    return;
  }

  tipsGrid.innerHTML = completedReports
    .map(([key, round]) => {
      const report = reports[key] || {};
      const improvement =
        report.improvement || getDefaultImprovement(round.score);

      return `
        <div class="tip-card">
          <div class="tip-icon">🚀</div>

          <div>
            <h3>${round.name}</h3>
            <p>${improvement}</p>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderMotivation(user, average) {
  const heading = document.getElementById("motivationHeading");
  const para = document.getElementById("motivationPara");

  if (!heading || !para) return;

  const name = user.name || "User";
  const completedCount = getCompletedCount();

  if (completedCount < 5) {
    heading.textContent = `Keep going, ${name}!`;
    para.textContent =
      "Complete all interview rounds patiently. Your final report will unlock after all 5 rounds.";
    return;
  }

  if (average >= 80) {
    heading.textContent = `Excellent work, ${name}!`;
    para.textContent =
      "You are close to interview-ready. Keep improving technical depth and real-time examples.";
  } else if (average >= 60) {
    heading.textContent = `Good progress, ${name}!`;
    para.textContent =
      "You have started well. Focus on confidence, pronunciation, and structured answers.";
  } else {
    heading.textContent = `Keep going, ${name}!`;
    para.textContent =
      "Do not worry about low scores. Every practice round makes you stronger and more confident.";
  }
}

function getDefaultMistake(score) {
  if (score >= 80) {
    return "Minor improvement needed in examples and technical depth.";
  }

  if (score >= 60) {
    return "Grammar, confidence, and answer structure need improvement.";
  }

  return "Answer is too short. Speak clearly and explain step by step.";
}

function getDefaultImprovement(score) {
  if (score >= 80) {
    return "Use real company-level examples and explain your contribution clearly.";
  }

  if (score >= 60) {
    return "Use this format: introduction, point, example, and conclusion.";
  }

  return "Practice simple English daily. Start with short sentences and speak slowly.";
}

function emptyCard(title, message) {
  return `
    <div class="analysis-card">
      <div class="analysis-icon">ℹ️</div>

      <div>
        <h3>${title}</h3>
        <p>${message}</p>
      </div>
    </div>
  `;
}

function emptyTip(title, message) {
  return `
    <div class="tip-card">
      <div class="tip-icon">ℹ️</div>

      <div>
        <h3>${title}</h3>
        <p>${message}</p>
      </div>
    </div>
  `;
}

function initFeedback() {
  const form = document.getElementById("feedbackForm");
  const rateButtons = document.querySelectorAll(".rate-btn");
  const ratingInput = document.getElementById("rating");

  if (rateButtons.length) {
    rateButtons.forEach((button) => {
      button.addEventListener("click", () => {
        rateButtons.forEach((btn) => btn.classList.remove("active"));
        button.classList.add("active");

        if (ratingInput) {
          ratingInput.value = button.dataset.rate;
        }
      });
    });
  }

  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const feedback = {
      name: document.getElementById("feedbackName").value || "User",
      rating: ratingInput ? ratingInput.value : "0",
      message: document.getElementById("feedbackMessage").value,
      date: new Date().toLocaleString()
    };

    SkillStorage.set("skillcracker_feedback", feedback);
    showToast("Feedback submitted successfully ✅");

    setTimeout(() => {
      window.location.href = "../dashboard.html";
    }, 1000);
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

function setText(id, value) {
  const element = document.getElementById(id);

  if (element) {
    element.textContent = value;
  }
}