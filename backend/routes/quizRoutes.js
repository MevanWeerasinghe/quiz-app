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
  updateQuiz,
  deleteQuiz,
} = require("../controllers/quizController");

// Order matters: specific routes first
router.get("/user/:userId", getUserQuizzes);

// Question update (no conflict with quizId routes)
router.put("/questions/:id", updateQuestion);

// AI routes
router.post("/generate-ai", generateAIQuiz);
router.post("/save-ai", createAIQuizWithQuestions);

// Quiz CRUD
router.post("/", createQuiz);
router.get("/:quizId", getQuizById);
router.put("/:quizId", updateQuiz); // update quiz metadata
router.delete("/:quizId", deleteQuiz); // delete quiz
module.exports = router;

createAIQuizWithQuestions;
