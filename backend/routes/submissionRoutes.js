// backend/routes/submissionRoutes.js
const express = require("express");
const router = express.Router();
const {
  submitQuiz,
  getQuizSubmissions,
  getQuizSummary,
  hasUserSubmitted,
  deleteSubmission,
} = require("../controllers/submissionController");

router.post("/", submitQuiz);
router.get("/quiz/:quizId", getQuizSubmissions);
router.get("/quiz/:quizId/summary", getQuizSummary);
router.get("/quiz/:quizId/has-submitted", hasUserSubmitted);
router.delete("/:id", deleteSubmission);

module.exports = router;
