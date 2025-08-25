// backend/src/models/Quiz.js
const mongoose = require("mongoose");

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  creator: {
    type: String,
    ref: "User",
    required: true,
  },
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],

  // If timingMode === 'whole-quiz' => timeLimit (in minutes) applies to entire quiz
  // If timingMode === 'per-question' => each Question.questionTime (in seconds) applies to that question
  timingMode: {
    type: String,
    enum: ["whole-quiz", "per-question"],
    default: "whole-quiz",
  },

  timeLimit: { type: Number, required: true }, // in minutes (only relevant for whole-quiz)
  allowBack: { type: Boolean, required: true },
  showResult: { type: Boolean, required: true },
  createdWithAI: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Quiz", quizSchema);
