// backend/models/Submission.js
const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema({
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true },
  userId: { type: String, required: true },
  userEmail: { type: String },
  answers: [
    {
      questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Question" },
      selectedIndex: { type: Number }, // or null if unanswered
    },
  ],
  score: { type: Number, default: 0 }, // total correct answers
  submittedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Submission", submissionSchema);
