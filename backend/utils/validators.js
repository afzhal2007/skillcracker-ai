const SYSTEM_TEXTS = [
  "listening...",
  "mic error",
  "no speech detected",
  "voice not detected",
  "please retry",
  "microphone blocked",
  "speech recognition is not supported",
  "you did not answer",
];

function isString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function containsSystemText(value) {
  if (!isString(value)) return false;

  const lower = value.toLowerCase();
  return SYSTEM_TEXTS.some((phrase) => lower.includes(phrase));
}

function validateEvaluateAnswerPayload(body) {
  if (!body || typeof body !== "object") {
    return { isValid: false, message: "Invalid request payload." };
  }

  const { uid, roundKey, question, answer } = body;

  if (!isString(uid)) {
    return { isValid: false, message: "User id is required." };
  }

  if (!isString(roundKey)) {
    return { isValid: false, message: "Round key is required." };
  }

  if (!isString(question)) {
    return { isValid: false, message: "Question is required." };
  }

  if (!isString(answer)) {
    return { isValid: false, message: "Please provide an answer before submitting." };
  }

  if (containsSystemText(answer)) {
    return { isValid: false, message: "Please provide a valid answer." };
  }

  return { isValid: true };
}

function validateGenerateQuestionPayload(body) {
  if (!body || typeof body !== "object") {
    return { isValid: false, message: "Invalid request payload." };
  }

  const { roundKey, roundTitle, department, difficulty } = body;

  if (!isString(roundKey)) {
    return { isValid: false, message: "Round key is required." };
  }

  if (!isString(roundTitle)) {
    return { isValid: false, message: "Round title is required." };
  }

  if (!isString(department)) {
    return { isValid: false, message: "Department is required." };
  }

  if (!isString(difficulty)) {
    return { isValid: false, message: "Difficulty is required." };
  }

  return { isValid: true };
}

function validateSaveReportPayload(body) {
  if (!body || typeof body !== "object") {
    return { isValid: false, message: "Invalid request payload." };
  }

  const { uid, roundKey, report } = body;

  if (!isString(uid)) {
    return { isValid: false, message: "User id is required." };
  }

  if (!isString(roundKey)) {
    return { isValid: false, message: "Round key is required." };
  }

  if (!report || typeof report !== "object") {
    return { isValid: false, message: "Report object is required." };
  }

  if (!isString(report.title) || !isString(report.question) || !isString(report.answer)) {
    return { isValid: false, message: "Report title, question, and answer are required." };
  }

  if (!Number.isFinite(report.score)) {
    return { isValid: false, message: "Report score must be a number." };
  }

  return { isValid: true };
}

function validateResetProgressPayload(body) {
  if (!body || typeof body !== "object") {
    return { isValid: false, message: "Invalid request payload." };
  }

  const { uid } = body;

  if (!isString(uid)) {
    return { isValid: false, message: "User id is required." };
  }

  return { isValid: true };
}

function parseJsonResponse(raw) {
  if (!isString(raw)) {
    return null;
  }

  const stringValue = raw.trim();
  const match = stringValue.match(/\{[\s\S]*\}/);
  if (!match) {
    return null;
  }

  try {
    return JSON.parse(match[0]);
  } catch (error) {
    return null;
  }
}

module.exports = {
  validateEvaluateAnswerPayload,
  validateGenerateQuestionPayload,
  validateSaveReportPayload,
  validateResetProgressPayload,
  parseJsonResponse,
  containsSystemText,
};
