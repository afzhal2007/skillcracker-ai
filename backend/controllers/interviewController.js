const { evaluateWithGroq, generateQuestionWithGroq } = require("../services/groqService");
const firebaseService = require("../services/firebaseService");
const validators = require("../utils/validators");
const promptBuilder = require("../utils/promptBuilder");

async function healthCheck(req, res) {
  res.json({
    ok: true,
    service: "SkillCracker AI Backend",
    ai: "Groq",
    timestamp: new Date().toISOString(),
  });
}

async function evaluateAnswer(req, res, next) {
  try {
    console.log("========== EVALUATE ANSWER REQUEST ==========");
    console.log("Body:", req.body);
    console.log("GROQ_MODEL:", process.env.GROQ_MODEL);
    console.log("GROQ_API_KEY exists:", !!process.env.GROQ_API_KEY);
    console.log("============================================");

    const validation = validators.validateEvaluateAnswerPayload(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        ok: false,
        isValid: false,
        completed: false,
        score: 0,
        message: validation.message,
      });
    }

    console.log("Validation passed, calling Groq...");

    const { uid, roundKey, roundTitle, question, answer, department } = req.body;
    const prompt = promptBuilder.buildEvaluatePrompt(question, answer, roundKey, roundTitle, department);
    const rawResponse = await evaluateWithGroq(prompt);
    console.log("Groq result:", rawResponse);

    let parsed;
    if (typeof rawResponse === "object" && rawResponse !== null) {
      parsed = rawResponse;
    } else if (typeof rawResponse === "string") {
      parsed = validators.parseJsonResponse(rawResponse);
    } else {
      parsed = null;
    }

    if (!parsed || typeof parsed !== "object") {
      return res.status(503).json({
        ok: false,
        message: "AI evaluation temporarily unavailable. Please try again.",
      });
    }

    let score = Number(parsed.score) || 0;
    let isRelevant = Boolean(parsed.isRelevant);
    let isValid = Boolean(parsed.isValid);
    let completed = Boolean(parsed.completed);
    const normalizedScore = normalizeScore(score, isRelevant);

    if (completed === false && answer && !validators.containsSystemText(answer)) {
      completed = true;
      score = Math.max(normalizedScore || 15, 10);
      parsed.message = "Your answer was short. Try to add more details next time.";
    }

    const responsePayload = {
      ok: true,
      isValid,
      isRelevant,
      completed,
      score: score,
      relevanceScore: Number(parsed.relevanceScore) || 0,
      clarityScore: Number(parsed.clarityScore) || 0,
      grammarScore: Number(parsed.grammarScore) || 0,
      confidenceScore: Number(parsed.confidenceScore) || 0,
      technicalScore: Number(parsed.technicalScore) || 0,
      summary: String(parsed.summary || "").trim(),
      mistakes: Array.isArray(parsed.mistakes) ? parsed.mistakes : [],
      correctedAnswer: String(parsed.correctedAnswer || "").trim(),
      improvementTips: Array.isArray(parsed.improvementTips) ? parsed.improvementTips : [],
      motivation: String(parsed.motivation || "").trim(),
      message: String(parsed.message || "Round completed successfully.").trim(),
    };

    return res.json(responsePayload);
  } catch (error) {
    next(error);
  }
}

async function generateQuestion(req, res, next) {
  try {
    const validation = validators.validateGenerateQuestionPayload(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ ok: false, message: validation.message });
    }

    const { roundKey, roundTitle, department, difficulty } = req.body;
    const prompt = promptBuilder.buildGenerateQuestionPrompt(roundKey, roundTitle, department, difficulty);
    const rawResponse = await generateQuestionWithGroq(prompt);
    const parsed = validators.parseJsonResponse(rawResponse);

    if (!parsed || !parsed.question) {
      return res.status(503).json({
        ok: false,
        message: "AI evaluation temporarily unavailable. Please try again.",
      });
    }

    return res.json({
      ok: true,
      question: String(parsed.question).trim(),
      followUps: Array.isArray(parsed.followUps) ? parsed.followUps : [],
    });
  } catch (error) {
    console.error("========== CONTROLLER ERROR ==========");
    console.error(error);
    console.error("Message:", error.message);
    console.error("Stack:", error.stack);
    console.error("=====================================");
    next(error);
  }
}

async function saveReport(req, res, next) {
  try {
    const validation = validators.validateSaveReportPayload(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ ok: false, message: validation.message });
    }

    const { uid, roundKey, report } = req.body;
    const completed = Boolean(report.score >= 40);
    const score = Number(report.score) || 0;

    await firebaseService.saveReport(uid, roundKey, {
      ...report,
      completed,
      score,
      updatedAt: new Date().toISOString(),
    });
    await firebaseService.updateRoundStatus(uid, roundKey, completed, score);

    return res.json({ ok: true, message: "Report saved successfully" });
  } catch (error) {
    next(error);
  }
}

async function getUserReport(req, res, next) {
  try {
    const { uid } = req.params;
    if (!uid || typeof uid !== "string") {
      return res.status(400).json({ ok: false, message: "Invalid user id." });
    }

    const reports = await firebaseService.getUserReports(uid);
    return res.json({ ok: true, reports });
  } catch (error) {
    next(error);
  }
}

async function resetProgress(req, res, next) {
  try {
    const validation = validators.validateResetProgressPayload(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ ok: false, message: validation.message });
    }

    const { uid } = req.body;
    await firebaseService.resetUserProgress(uid);
    return res.json({ ok: true, message: "Progress reset successfully" });
  } catch (error) {
    next(error);
  }
}

function normalizeScore(score, isRelevant) {
  if (!Number.isFinite(score) || score <= 0) {
    return 0;
  }

  let finalScore = Math.round(score);

  if (!isRelevant) {
    finalScore = Math.max(10, Math.min(30, finalScore));
  } else {
    finalScore = Math.max(10, Math.min(95, finalScore));
  }

  return finalScore;
}

module.exports = {
  healthCheck,
  evaluateAnswer,
  generateQuestion,
  saveReport,
  getUserReport,
  resetProgress,
};
