// backend/routes/submissionRoutes.js
const express = require("express");
const router = express.Router();
const {
  submitQuiz,
  getQuizSubmissions,
  getQuizSummary,
} = require("../controllers/submissionController");

router.post("/", submitQuiz);
router.get("/quiz/:quizId", getQuizSubmissions);
router.get("/quiz/:quizId/summary", getQuizSummary);

module.exports = router;
