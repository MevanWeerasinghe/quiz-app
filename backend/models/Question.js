// backend/models/Question.js
const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true },
  text: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctIndex: { type: Number, required: true }, // index of correct option

  // NEW: time allowed for this question in SECONDS (only used when quiz.timingMode === 'per-question')
  questionTime: { type: Number, default: 60 }, // default 60 seconds
});

module.exports = mongoose.model("Question", questionSchema);
