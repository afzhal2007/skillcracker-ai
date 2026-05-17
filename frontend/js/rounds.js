document.addEventListener("DOMContentLoaded", () => {
  initRound();
});

let currentQuestion = "";
let currentScore = 0;
let recognition = null;
let isListening = false;
let finalTranscript = "";
let interimTranscript = "";
let silenceTimer = null;
let countdownTimer = null;
let hasUserSpoken = false;
let isAutoFinishing = false;

function initRound() {
  const startBtn = document.getElementById("startBtn");
  const retryBtn = document.getElementById("retryBtn");
  const finishBtn = document.getElementById("finishBtn");

  if (startBtn) startBtn.addEventListener("click", startRound);
  if (retryBtn) retryBtn.addEventListener("click", startRound);
  if (finishBtn) finishBtn.addEventListener("click", finishRound);

  createFallbackControls();
  setupSpeechRecognition();
  checkRoundAccess();
}

function startRound() {
  const config = window.roundConfig;
  const questionText = document.getElementById("questionText");
  const answerText = document.getElementById("answerText");
  const countdown = document.getElementById("countdown");

  if (!config || !config.questions || !questionText || !answerText || !countdown) return;

  stopListening();
  clearTimers();

  if ("speechSynthesis" in window) {
    speechSynthesis.cancel();
  }

  finalTranscript = "";
  interimTranscript = "";
  hasUserSpoken = false;
  isAutoFinishing = false;
  currentScore = 0;
  updateLiveScore(0);

  const randomIndex = Math.floor(Math.random() * config.questions.length);
  currentQuestion = config.questions[randomIndex];

  questionText.textContent = currentQuestion;
  answerText.value = "";
  answerText.readOnly = true;
  answerText.placeholder = "Your spoken answer will appear here...";
  countdown.textContent = "--";

  hideVoiceFallback();
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
  utterance.rate = 0.95;
  utterance.pitch = 1;

  let countdownStarted = false;

  function safeStartCountdown() {
    if (countdownStarted) return;
    countdownStarted = true;
    startCountdown();
  }

  utterance.onend = safeStartCountdown;
  utterance.onerror = safeStartCountdown;

  speechSynthesis.speak(utterance);

  setTimeout(() => {
    if (!countdownStarted && !speechSynthesis.speaking) {
      safeStartCountdown();
    }
  }, 4000);
}

function startCountdown() {
  const countdown = document.getElementById("countdown");
  if (!countdown) return;

  clearTimers();

  let count = 3;
  countdown.textContent = count;

  countdownTimer = setInterval(() => {
    count--;

    if (count > 0) {
      countdown.textContent = count;
    } else {
      clearInterval(countdownTimer);
      countdownTimer = null;
      countdown.textContent = "🎙️ Listening...";
      startListening();
    }
  }, 1000);
}

function clearTimers() {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }

  clearSilenceTimer();
}

function setupSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const answerText = document.getElementById("answerText");

  if (!SpeechRecognition) {
    if (answerText) {
      answerText.value = "Speech recognition is not supported. Please use Google Chrome.";
    }
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    isListening = true;
    hasUserSpoken = false;
    finalTranscript = "";
    interimTranscript = "";

    const answerText = document.getElementById("answerText");
    const countdown = document.getElementById("countdown");

    if (answerText) {
      answerText.readOnly = true;
      answerText.value = "Listening... Please speak naturally.";
    }

    if (countdown) {
      countdown.textContent = "Listening...";
    }

    clearSilenceTimer();
  };

  recognition.onresult = (event) => {
    const answerText = document.getElementById("answerText");
    if (!answerText) return;

    interimTranscript = "";

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;

      if (event.results[i].isFinal) {
        finalTranscript += transcript + " ";
      } else {
        interimTranscript += transcript + " ";
      }
    }

    const fullAnswer = (finalTranscript + interimTranscript).trim();
    const cleanAnswer = getCleanAnswer(fullAnswer);

    if (fullAnswer.length > 0 && cleanAnswer.length > 0) {
      hasUserSpoken = true;
      answerText.value = fullAnswer;
      currentScore = calculateScore(fullAnswer);
      updateLiveScore(currentScore);
      resetSilenceTimer();
    }
  };

  recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);

    const answerText = document.getElementById("answerText");
    if (!answerText) return;

    if (event.error === "no-speech") {
      answerText.value = "No speech was detected. Please speak clearly.";
    } else if (event.error === "audio-capture") {
      answerText.value = "Microphone not detected. Please check your mic settings.";
    } else if (event.error === "not-allowed") {
      answerText.value = "Mic permission blocked. Allow microphone access in browser settings.";
    } else {
      answerText.value = "Speech recognition issue. Please retry.";
    }

    showVoiceFallback("Your answer is too short or not clear. Please retry this question.");
  };

  recognition.onend = () => {
    isListening = false;
    if (isAutoFinishing) {
      return;
    }

    if (hasUserSpoken) {
      resetSilenceTimer();
    }
  };
}

function startListening() {
  const answerText = document.getElementById("answerText");

  if (!recognition) {
    if (answerText) {
      answerText.value = "Speech recognition is not supported. Please use Google Chrome.";
    }
    return;
  }

  if (isListening) return;

  try {
    finalTranscript = "";
    interimTranscript = "";
    hasUserSpoken = false;
    isAutoFinishing = false;
    recognition.start();
  } catch (error) {
    console.error("Recognition start error:", error);
    if (answerText) {
      answerText.value = "Mic already active or blocked. Please wait or retry.";
    }
  }
}

function stopListening() {
  clearSilenceTimer();

  if (recognition && isListening) {
    try {
      recognition.stop();
    } catch (error) {
      console.log("Recognition already stopped.");
    }
  }

  isListening = false;
}

async function finishRound() {
  stopListening();

  if ("speechSynthesis" in window) {
    speechSynthesis.cancel();
  }

  await autoFinishRound(true);
}

async function autoFinishRound(isManual = false) {
  if (isAutoFinishing) return;
  if (!isManual && !hasUserSpoken) return;

  isAutoFinishing = true;
  stopListening();

  if ("speechSynthesis" in window) {
    speechSynthesis.cancel();
  }

  const answerTextEl = document.getElementById("answerText");
  const countdown = document.getElementById("countdown");
  const answer = getCleanAnswer(answerTextEl ? answerTextEl.value : "");

  if (!answer || !isValidAnswer(answer)) {
    if (answerTextEl) {
      answerTextEl.value = "Your answer is too short or not clear. Please retry this question.";
      answerTextEl.readOnly = true;
    }
    if (countdown) {
      countdown.textContent = "Please retry this question.";
    }
    showVoiceFallback("Your answer is too short or not clear. Please retry this question.");
    isAutoFinishing = false;
    return;
  }

  try {
    const backendResult = await evaluateAnswerBackend(answer);

    if (!backendResult.ok) {
      showBackendError(countdown, answerTextEl, backendResult.message);
      isAutoFinishing = false;
      return;
    }

    const config = window.roundConfig;
    const score = Number.isFinite(backendResult.score) ? backendResult.score : calculateScore(answer);

    if (config && config.roundKey) {
      completeRound(config.roundKey, score);
      saveRoundReport(config.roundKey, {
        title: config.title,
        question: currentQuestion,
        answer: answer,
        score,
        mistakes: backendResult.mistakes || [],
        correctedAnswer: backendResult.correctedAnswer || "",
        improvementTips: backendResult.improvementTips || [],
        motivation: backendResult.motivation || "",
      });
      window.location.href = config.nextPage;
      return;
    }

    isAutoFinishing = false;
  } catch (error) {
    console.error("Auto finish error:", error);
    showBackendError(countdown, answerTextEl, "AI evaluation is unavailable. Please start backend and try again.");
    isAutoFinishing = false;
  }
}

function getLoggedInUserForRound() {
  try {
    return JSON.parse(localStorage.getItem("skillcracker_user")) || {};
  } catch (error) {
    console.error("Failed to parse logged-in user:", error);
    return {};
  }
}

async function evaluateAnswerBackend(answer) {
  const config = window.roundConfig || {};
  const user = getLoggedInUserForRound();
  const payload = {
    uid: user.uid,
    roundKey: config.roundKey || "",
    roundTitle: config.title || "",
    question: currentQuestion,
    answer,
    department: user.department || "General Fresher",
  };

  console.log("Evaluate payload:", payload);

  if (!payload.uid) {
    return { ok: false, message: "User session not found. Please logout and login again.", sessionMissing: true };
  }

  const url = "https://skillcracker-ai.vercel.app/api/evaluate-answer";

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      return { ok: false, message: (body && body.message) || "AI evaluation is unavailable. Please start backend and try again." };
    }

    const data = await response.json();
    return { ok: true, ...data };
  } catch (error) {
    console.error("Backend evaluation request failed:", error);
    return { ok: false, message: "AI evaluation is unavailable. Please start backend and try again." };
  }
}

function showBackendError(countdown, answerTextEl, message) {
  if (answerTextEl) {
    answerTextEl.value = message;
    answerTextEl.readOnly = true;
  }
  if (countdown) {
    countdown.textContent = message;
  }
  showVoiceFallback(message);
}

function resetSilenceTimer() {
  clearSilenceTimer();
  silenceTimer = setTimeout(() => {
    autoFinishRound(false);
  }, 3000);
}

function clearSilenceTimer() {
  if (silenceTimer) {
    clearTimeout(silenceTimer);
    silenceTimer = null;
  }
}

function createFallbackControls() {
  if (document.getElementById("voiceFallbackContainer")) return;

  const controls = document.querySelector(".controls");
  if (!controls) return;

  const container = document.createElement("div");
  container.id = "voiceFallbackContainer";
  container.style.display = "none";
  container.style.marginTop = "16px";
  container.style.padding = "14px";
  container.style.border = "1px solid #d1d5db";
  container.style.borderRadius = "12px";
  container.style.background = "#f9fafb";
  container.style.display = "flex";
  container.style.flexDirection = "column";
  container.style.gap = "10px";

  const message = document.createElement("div");
  message.id = "voiceFallbackMessage";
  message.style.color = "#1f2937";
  message.style.fontSize = "0.95rem";
  message.style.lineHeight = "1.5";
  message.textContent = "";

  const buttonRow = document.createElement("div");
  buttonRow.style.display = "flex";
  buttonRow.style.gap = "10px";
  buttonRow.style.flexWrap = "wrap";

  const retryButton = document.createElement("button");
  retryButton.type = "button";
  retryButton.textContent = "🎙️ Retry Voice";
  retryButton.style.padding = "10px 14px";
  retryButton.style.border = "1px solid #2563eb";
  retryButton.style.background = "#2563eb";
  retryButton.style.color = "#ffffff";
  retryButton.style.borderRadius = "8px";
  retryButton.style.cursor = "pointer";
  retryButton.addEventListener("click", retryVoice);

  const typeButton = document.createElement("button");
  typeButton.type = "button";
  typeButton.textContent = "⌨️ Type Answer Instead";
  typeButton.style.padding = "10px 14px";
  typeButton.style.border = "1px solid #374151";
  typeButton.style.background = "#ffffff";
  typeButton.style.color = "#111827";
  typeButton.style.borderRadius = "8px";
  typeButton.style.cursor = "pointer";
  typeButton.addEventListener("click", enableTypeAnswer);

  buttonRow.appendChild(retryButton);
  buttonRow.appendChild(typeButton);
  container.appendChild(message);
  container.appendChild(buttonRow);

  controls.parentNode.insertBefore(container, controls.nextSibling);
}

function showVoiceFallback(message) {
  const container = document.getElementById("voiceFallbackContainer");
  const messageEl = document.getElementById("voiceFallbackMessage");
  const answerText = document.getElementById("answerText");

  if (messageEl) {
    messageEl.textContent = message || "Your answer is too short or not clear. Please retry this question.";
  }

  if (container) {
    container.style.display = "flex";
  }

  if (answerText) {
    answerText.readOnly = true;
  }
}

function hideVoiceFallback() {
  const container = document.getElementById("voiceFallbackContainer");
  const messageEl = document.getElementById("voiceFallbackMessage");

  if (container) {
    container.style.display = "none";
  }

  if (messageEl) {
    messageEl.textContent = "";
  }
}

function retryVoice() {
  stopListening();
  if ("speechSynthesis" in window) {
    speechSynthesis.cancel();
  }

  finalTranscript = "";
  interimTranscript = "";
  hasUserSpoken = false;
  isAutoFinishing = false;

  const answerText = document.getElementById("answerText");
  const countdown = document.getElementById("countdown");

  if (answerText) {
    answerText.readOnly = true;
    answerText.value = "";
    answerText.placeholder = "Your spoken answer will appear here...";
  }

  if (countdown) {
    countdown.textContent = "🎙️ Listening...";
  }

  hideVoiceFallback();
  startListening();
}

function enableTypeAnswer() {
  stopListening();
  hideVoiceFallback();
  clearSilenceTimer();
  hasUserSpoken = false;

  const answerText = document.getElementById("answerText");
  const countdown = document.getElementById("countdown");

  if (answerText) {
    answerText.readOnly = false;
    answerText.value = "";
    answerText.placeholder = "Type your answer here...";
    answerText.focus();
  }

  if (countdown) {
    countdown.textContent = "Typing mode";
  }
}

function getCleanAnswer(rawValue) {
  const answerText = document.getElementById("answerText");
  const raw = typeof rawValue === "string" ? rawValue : answerText ? answerText.value : "";
  const trimmed = raw.trim();

  const systemMessages = [
    "Listening... Speak now. You have 15 seconds.",
    "Listening... Speak clearly now.",
    "Listening... Please speak naturally.",
    "I could not hear you clearly. Please speak louder or click Retry Question.",
    "No clear speech detected. Please click Retry Question and speak again.",
    "No speech detected. Please click Retry Question and speak louder.",
    "Microphone not detected. Please check your mic settings.",
    "Microphone blocked. Please allow microphone access in browser settings.",
    "Speech recognition is not supported. Please use Google Chrome.",
    "Mic stopped. Click Retry Question.",
    "Mic already active. Please wait or click Retry Question.",
    "Voice not detected.",
    "Please complete this round properly before moving to the next round.",
    "Your answer is too short or not clear. Please retry this question.",
    "Your answer is not related to the question. Please retry this question."
  ];

  if (systemMessages.includes(trimmed)) {
    return "";
  }

  return trimmed;
}

function isValidAnswer(text) {
  if (!text || typeof text !== "string") return false;

  const trimmed = text.trim();
  if (!trimmed) return false;

  const lower = trimmed.toLowerCase();
  const invalidPhrases = [
    "listening",
    "mic error",
    "no speech detected",
    "no clear speech detected",
    "voice not detected",
    "microphone blocked",
    "microphone not detected",
    "speech recognition is not supported",
    "please retry",
    "mic stopped",
    "network issue",
    "could not hear",
    "speech input did not register",
    "voice input did not register"
  ];

  return !invalidPhrases.some((phrase) => lower.includes(phrase));
}

function checkRoundAccess() {
  const config = window.roundConfig;
  if (!config || !config.roundKey) return;

  const order = ["round1", "round2", "round3", "round4", "round5"];
  const index = order.indexOf(config.roundKey);

  if (index <= 0) return;

  const rounds = getRounds();
  const previousRoundKey = order[index - 1];

  if (rounds[previousRoundKey] && rounds[previousRoundKey].completed) {
    return;
  }

  const questionText = document.getElementById("questionText");
  const countdown = document.getElementById("countdown");

  if (questionText) {
    questionText.textContent = "Please complete the previous round first.";
  }

  let t = 5;
  if (countdown) {
    countdown.textContent = `Redirecting in ${t} seconds...`;
  }

  const pages = {
    round1: "self-intro.html",
    round2: "resume-round.html",
    round3: "project-website-round.html",
    round4: "code-task-round.html",
    round5: "course-interview-round.html"
  };

  const timer = setInterval(() => {
    t--;

    if (countdown) {
      countdown.textContent = `Redirecting in ${t} seconds...`;
    }

    if (t <= 0) {
      clearInterval(timer);
      window.location.href = pages[previousRoundKey] || "self-intro.html";
    }
  }, 1000);
}

function calculateScore(answer) {
  return Math.round(calculateRelevanceScore(currentQuestion, answer, window.roundConfig ? window.roundConfig.roundKey : ""));
}

function calculateRelevanceScore(question, answer, roundKey) {
  if (!answer || !answer.trim()) return 0;

  const normalized = answer.trim().toLowerCase();
  const cleanedWords = normalized.replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
  const wordCount = cleanedWords.length;

  const badPhrases = [
    "listening",
    "mic error",
    "no speech detected",
    "no clear speech detected",
    "microphone blocked",
    "microphone not detected",
    "speech recognition is not supported",
    "please retry",
    "mic stopped",
    "network issue",
    "could not hear",
    "speech input did not register",
    "voice input did not register"
  ];

  for (const phrase of badPhrases) {
    if (normalized.includes(phrase)) {
      return 0;
    }
  }

  if (wordCount < 10 || answer.trim().length < 60) {
    return Math.max(0, Math.min(20, wordCount * 2));
  }

  const roundKeywords = {
    round1: ["name", "course", "skills", "goal", "interest", "education", "studying", "learning", "future", "aspiration", "self"],
    round2: ["resume", "skills", "project", "experience", "education", "achievement", "career", "worked", "internship", "strength", "qualification"],
    round3: ["project", "problem", "solution", "technology", "feature", "role", "improvement", "built", "developed", "user", "goal"],
    round4: ["code", "function", "input", "output", "logic", "condition", "return", "optimization", "bug", "algorithm", "debug"],
    round5: ["subject", "concept", "course", "real-world", "technical", "skill", "learning", "understand", "practice", "application", "concepts"]
  };

  const targetKeywords = roundKeywords[roundKey] || [];
  const uniqueKeywords = new Set(targetKeywords.concat([
    "project",
    "experience",
    "technology",
    "skills",
    "education",
    "goal",
    "solution",
    "problem",
    "feature",
    "role",
    "learned",
    "built",
    "developed",
    "application",
    "performance",
    "objective",
    "improve",
    "example",
    "career",
    "result",
    "impact"
  ]));

  let roundHitCount = 0;
  for (const keyword of targetKeywords) {
    if (normalized.includes(keyword)) {
      roundHitCount += 1;
    }
  }

  let generalHitCount = 0;
  for (const keyword of uniqueKeywords) {
    if (normalized.includes(keyword)) {
      generalHitCount += 1;
    }
  }

  const questionTokens = (question || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
  const questionOverlap = questionTokens.reduce((count, token) => {
    if (token.length > 3 && normalized.includes(token)) {
      return count + 1;
    }
    return count;
  }, 0);

  let score = 0;
  score += Math.min(10, Math.floor(wordCount / 10) * 2);
  score += Math.min(45, roundHitCount * 14);
  score += Math.min(20, generalHitCount * 3);
  score += Math.min(10, questionOverlap * 3);

  const structurePatterns = [
    /because/,
    /for example/,
    /as a result/,
    /in addition/,
    /first/,
    /next/,
    /then/,
    /finally/,
    /my role/,
    /i built/,
    /i developed/,
    /i worked/,
    /i learned/,
    /my experience/,
    /the problem/,
    /the solution/,
    /this project/,
    /in this course/,
    /the code/,
    /the result/
  ];

  for (const pattern of structurePatterns) {
    if (pattern.test(normalized)) {
      score += 5;
    }
  }

  const fillerWords = ["just", "very", "really", "basically", "actually", "literally", "um", "uh", "you know", "kind of", "sort of", "maybe", "perhaps", "stuff", "thing"];
  let fillerCount = 0;
  for (const filler of fillerWords) {
    if (normalized.includes(filler)) fillerCount += 1;
  }

  if (fillerCount > 1) {
    score -= Math.min(10, fillerCount * 2);
  }

  const frequency = cleanedWords.reduce((map, word) => {
    map[word] = (map[word] || 0) + 1;
    return map;
  }, {});

  const repeatedWordPenalty = Object.values(frequency).reduce((penalty, count) => {
    if (count > 6) return penalty + 8;
    if (count > 4) return penalty + 5;
    return penalty;
  }, 0);

  score -= repeatedWordPenalty;

  if (roundHitCount === 0 && questionOverlap === 0) {
    return Math.max(10, Math.min(25, 10 + Math.floor(wordCount / 10) * 2 - repeatedWordPenalty));
  }

  score = Math.max(0, score);
  score = Math.min(95, score);

  return score;
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

  return "Answer is too short or not clear. Please retry this round with a better response.";
}

function generateImprovement(score) {
  if (score >= 80) {
    return "Use stronger real-time examples and explain your contribution clearly.";
  }

  if (score >= 60) {
    return "Use this format: introduction, skill/project point, example, and conclusion.";
  }

  return "Speak clearly, add more details, and make sure you answer the question directly.";
}
