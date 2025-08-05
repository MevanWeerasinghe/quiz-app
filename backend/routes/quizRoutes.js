// backend/routes/quizRoutes.js
const express = require("express");
const router = express.Router();
const {
  createQuiz,
  getUserQuizzes,
  generateAIQuiz,
  createAIQuizWithQuestions,
} = require("../controllers/quizController");

router.post("/", createQuiz);
router.get("/user/:userId", getUserQuizzes);
router.post("/generate-ai", generateAIQuiz);
router.post("/save-ai", createAIQuizWithQuestions);
module.exports = router;

createAIQuizWithQuestions;
