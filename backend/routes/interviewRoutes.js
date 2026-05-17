const express = require("express");
const {
  healthCheck,
  evaluateAnswer,
  generateQuestion,
  saveReport,
  getUserReport,
  resetProgress,
} = require("../controllers/interviewController");

const router = express.Router();

router.get("/health", healthCheck);
router.post("/evaluate-answer", evaluateAnswer);
router.post("/generate-question", generateQuestion);
router.post("/save-report", saveReport);
router.get("/user-report/:uid", getUserReport);
router.post("/reset-progress", resetProgress);

module.exports = router;
