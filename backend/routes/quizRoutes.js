// backend/routes/quizRoutes.js
const express = require("express");
const router = express.Router();
const {
  createQuiz,
  getUserQuizzes,
  generateAIQuiz,
  createAIQuizWithQuestions,
  getQuizById,
  updateQuestion,
} = require("../controllers/quizController");

router.post("/", createQuiz);
router.get("/user/:userId", getUserQuizzes);
router.get("/:quizId", getQuizById);
router.post("/generate-ai", generateAIQuiz);
router.post("/save-ai", createAIQuizWithQuestions);
router.put("/:id", updateQuestion);
module.exports = router;

createAIQuizWithQuestions;
