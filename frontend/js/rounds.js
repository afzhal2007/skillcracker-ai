document.addEventListener("DOMContentLoaded", () => {
  initRound();
});

let currentQuestion = "";
let currentScore = 0;
let recognition = null;
let isListening = false;

function initRound() {
  const startBtn = document.getElementById("startBtn");
  const retryBtn = document.getElementById("retryBtn");
  const finishBtn = document.getElementById("finishBtn");

  if (startBtn) {
    startBtn.addEventListener("click", startRound);
  }

  if (retryBtn) {
    retryBtn.addEventListener("click", startRound);
  }

  if (finishBtn) {
    finishBtn.addEventListener("click", finishRound);
  }

    setupSpeechRecognition();
    checkRoundAccess();
}

function startRound() {
  const config = window.roundConfig;
  const questionText = document.getElementById("questionText");
  const answerText = document.getElementById("answerText");
  const countdown = document.getElementById("countdown");

  if (!config || !config.questions) return;

  stopListening();
  speechSynthesis.cancel();

  const randomIndex = Math.floor(Math.random() * config.questions.length);
  currentQuestion = config.questions[randomIndex];

  questionText.textContent = currentQuestion;
  answerText.value = "";
  countdown.textContent = "--";
  currentScore = 0;
  updateLiveScore(0);

  speakQuestion(currentQuestion);
}

function speakQuestion(text) {
  if (!("speechSynthesis" in window)) {
    startCountdown();
    return;
  }

  speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.9;
  utterance.pitch = 1;

  utterance.onend = () => {
    startCountdown();
  };

  utterance.onerror = () => {
    startCountdown();
  };

  speechSynthesis.speak(utterance);
}

  function checkRoundAccess() {
    const config = window.roundConfig;
    if (!config || !config.roundKey) return;

    const order = ["round1", "round2", "round3", "round4", "round5"];
    const idx = order.indexOf(config.roundKey);
    if (idx <= 0) return; // round1 always allowed

    const rounds = getRounds();
    const prevKey = order[idx - 1];

    if (!rounds[prevKey] || !rounds[prevKey].completed) {
      const questionText = document.getElementById("questionText");
      const countdown = document.getElementById("countdown");

      if (questionText) questionText.textContent = "Please complete the previous round first.";

      let t = 5;
      if (countdown) countdown.textContent = `Redirecting in ${t} seconds...`;

      const timer = setInterval(() => {
        t--;
        if (countdown) countdown.textContent = `Redirecting in ${t} seconds...`;
        if (t <= 0) {
          clearInterval(timer);
          const map = {
            round1: "self-intro.html",
            round2: "resume-round.html",
            round3: "project-website-round.html",
            round4: "code-task-round.html",
            round5: "course-interview-round.html"
          };

          const target = map[prevKey] || "../dashboard.html";
          window.location.href = target;
        }
      }, 1000);
    }
  }

function startCountdown() {
  const countdown = document.getElementById("countdown");
  let count = 3;

  countdown.textContent = count;

  const timer = setInterval(() => {
    count--;

    if (count > 0) {
      countdown.textContent = count;
    } else {
      clearInterval(timer);
      countdown.textContent = "🎙️";
      startListening();
    }
  }, 1000);
}

function setupSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    isListening = true;
    const answerText = document.getElementById("answerText");
    answerText.value = "Listening... Speak clearly now.";
  };

  recognition.onresult = (event) => {
    const answerText = document.getElementById("answerText");
    let finalTranscript = "";
    let interimTranscript = "";

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;

      if (event.results[i].isFinal) {
        finalTranscript += transcript + " ";
      } else {
        interimTranscript += transcript;
      }
    }

    answerText.value = finalTranscript || interimTranscript || "Listening... Speak clearly now.";

    if (finalTranscript.length > 5) {
      currentScore = calculateScore(finalTranscript);
      updateLiveScore(currentScore);
    }
  };

  recognition.onerror = (event) => {
    const answerText = document.getElementById("answerText");
    const errorMessage = getErrorMessage(event.error);
    answerText.value = errorMessage;
  };

  recognition.onend = () => {
    isListening = false;
    const answerText = document.getElementById("answerText");
    const countdown = document.getElementById("countdown");

    if (!answerText.value || answerText.value === "Listening... Speak clearly now.") {
      answerText.value = "Mic stopped. Please retry.";
      countdown.textContent = "--";
    } else {
      countdown.textContent = "Done";
    }
  };
}

function getErrorMessage(errorType) {
  const messages = {
    "no-speech": "No speech detected. Please click Retry Question and speak louder.",
    "audio-capture": "Microphone not detected. Check your mic settings.",
    "not-allowed": "Microphone blocked. Allow microphone permission in browser.",
    "network": "Network issue. Speech recognition needs internet connection.",
    "aborted": "Mic stopped. Click Retry Question."
  };

  return messages[errorType] || `Mic error: ${errorType}. Please retry the question.`;
}

  function isValidAnswer(text) {
    if (!text) return false;
    const trimmed = text.trim();
    if (trimmed.length < 45) return false;
    const words = trimmed.split(/\s+/).filter(Boolean).length;
    if (words < 10) return false;

    const lower = trimmed.toLowerCase();
    const invalidPhrases = [
      "listening...",
      "mic error",
      "no speech detected",
      "microphone blocked",
      "speech recognition is not supported",
      "please retry",
      "mic stopped",
      "speech recognition setup failed",
      "mic already active"
    ];

    for (const p of invalidPhrases) {
      if (lower.includes(p)) return false;
    }

    return true;
  }

function startListening() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    const answerText = document.getElementById("answerText");
    answerText.value = "Speech recognition is not supported. Please use Google Chrome.";
    return;
  }

  if (!recognition) {
    const answerText = document.getElementById("answerText");
    answerText.value = "Speech recognition setup failed. Please retry.";
    return;
  }

  if (isListening) {
    return;
  }

  try {
    recognition.start();
  } catch (error) {
    const answerText = document.getElementById("answerText");
    answerText.value = "Mic already active. Please wait or click Retry Question.";
  }
}

function stopListening() {
  if (recognition && isListening) {
    try {
      recognition.stop();
    } catch (error) {
      // Silently handle stop errors
    }
    isListening = false;
  }
}

function calculateScore(answer) {
  if (!answer || answer.trim().length < 5) {
    return 35;
  }

  let score = 50;
  const words = answer.trim().split(/\s+/).length;

  if (words >= 15) score += 10;
  if (words >= 30) score += 10;
  if (
    answer.toLowerCase().includes("project") ||
    answer.toLowerCase().includes("skills") ||
    answer.toLowerCase().includes("experience")
  ) {
    score += 10;
  }
  if (answer.toLowerCase().includes("because") || answer.toLowerCase().includes("example")) {
    score += 10;
  }
  if (answer.length > 120) score += 10;

  return Math.min(score, 95);
}

function updateLiveScore(score) {
  const liveScore = document.getElementById("liveScore");
  const scoreCircle = document.querySelector(".score-circle");

  if (liveScore) {
    liveScore.textContent = `${score}%`;
  }

  if (scoreCircle) {
    const degree = Math.round((score / 100) * 360);

    scoreCircle.style.background = `
      radial-gradient(circle, #071225 55%, transparent 56%),
      conic-gradient(#2f80ff 0deg, #9147ff ${degree}deg, rgba(148, 163, 184, 0.18) ${degree}deg)
    `;
  }
}

function finishRound() {
  const config = window.roundConfig;

  if (!config) return;


    const answerTextEl = document.getElementById("answerText");
    const countdown = document.getElementById("countdown");
    const answerText = answerTextEl ? answerTextEl.value : "";

    // Validate answer
    if (!isValidAnswer(answerText)) {
      // show warning and stay on round
      if (answerTextEl) answerTextEl.value = "Please complete this round properly before moving to the next round.";

      let t = 5;
      if (countdown) countdown.textContent = `Staying on this round in ${t} seconds...`;

      const stayTimer = setInterval(() => {
        t--;
        if (countdown) countdown.textContent = `Staying on this round in ${t} seconds...`;
        if (t <= 0) {
          clearInterval(stayTimer);
          if (countdown) countdown.textContent = "--";
          if (answerTextEl) answerTextEl.value = "";
        }
      }, 1000);

      return;
    }

    // Valid answer: save and proceed
    stopListening();
    speechSynthesis.cancel();

    const finalScore = calculateScore(answerText);

    completeRound(config.roundKey, finalScore);

    saveRoundReport(config.roundKey, {
      title: config.title,
      question: currentQuestion,
      answer: answerText,
      score: finalScore,
      mistake: generateMistake(finalScore),
      improvement: generateImprovement(finalScore)
    });

    window.location.href = config.nextPage;
}

function saveRoundReport(roundKey, report) {
  const reports = SkillStorage.get("skillcracker_reports", {});
  reports[roundKey] = report;
  SkillStorage.set("skillcracker_reports", reports);
}

function generateMistake(score) {
  if (score >= 80) {
    return "Good answer. Minor improvement needed in examples and technical depth.";
  }

  if (score >= 60) {
    return "Answer is understandable, but grammar, confidence, and structure need improvement.";
  }

  return "Answer is too short. Speak clearly, add examples, and explain step by step.";
}

function generateImprovement(score) {
  if (score >= 80) {
    return "Use stronger real-time examples and explain your contribution clearly.";
  }

  if (score >= 60) {
    return "Use this format: introduction, skill/project point, example, and conclusion.";
  }

  return "Practice simple English daily. Start with short sentences and speak slowly.";
}