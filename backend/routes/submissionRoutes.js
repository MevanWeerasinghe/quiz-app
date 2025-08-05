// backend/routes/submissionRoutes.js
const express = require("express");
const router = express.Router();
const {
  submitQuiz,
  getQuizSubmissions,
} = require("../controllers/submissionController");

router.post("/", submitQuiz);
router.get("/quiz/:quizId", getQuizSubmissions);

module.exports = router;
