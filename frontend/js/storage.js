const SkillStorage = {
  get(key, fallback = null) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch (error) {
      return fallback;
    }
  },

  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },

  remove(key) {
    localStorage.removeItem(key);
  }
};

function getUser() {
  return SkillStorage.get("skillcracker_user", {
    name: "User",
    course: "AI & Data Science"
  });
}

function saveUser(user) {
  SkillStorage.set("skillcracker_user", user);
}

function getRounds() {
  return SkillStorage.get("skillcracker_rounds", {
    round1: { name: "Self Introduction Round", completed: false, score: 0 },
    round2: { name: "Resume-Based Round", completed: false, score: 0 },
    round3: { name: "Project / Website Round", completed: false, score: 0 },
    round4: { name: "AI Code / Task Round", completed: false, score: 0 },
    round5: { name: "Course-Based Interview", completed: false, score: 0 }
  });
}

function saveRounds(rounds) {
  SkillStorage.set("skillcracker_rounds", rounds);
}

function getCompletedRounds() {
  const rounds = getRounds();
  return Object.values(rounds).filter(round => round.completed);
}

function getCompletedCount() {
  return getCompletedRounds().length;
}

function getOverallProgress() {
  return Math.round((getCompletedCount() / 5) * 100);
}

function getAverageScore() {
  const completed = getCompletedRounds();

  if (completed.length === 0) {
    return 0;
  }

  const total = completed.reduce((sum, round) => {
    return sum + Number(round.score || 0);
  }, 0);

  return Math.round(total / completed.length);
}

function getPracticeTime() {
  return SkillStorage.get("skillcracker_practice_time", "00:00:00");
}

function savePracticeTime(time) {
  SkillStorage.set("skillcracker_practice_time", time);
}

function completeRound(roundKey, score) {
  const rounds = getRounds();

  if (!rounds[roundKey]) {
    return;
  }

  rounds[roundKey].completed = true;
  rounds[roundKey].score = Number(score);
  // record completion timestamp
  try {
    rounds[roundKey].completedAt = new Date().toISOString();
  } catch (e) {
    // ignore
  }

  saveRounds(rounds);
}

function resetDashboard() {
  SkillStorage.remove("skillcracker_rounds");
  SkillStorage.remove("skillcracker_practice_time");
}