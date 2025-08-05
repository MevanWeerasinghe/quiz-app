const Submission = require("../models/Submission");

const submitQuiz = async (req, res) => {
  try {
    const { quizId, userId, answers, score } = req.body;
    const existing = await Submission.findOne({ quizId, userId });
    if (existing) {
      return res
        .status(400)
        .json({ message: "User has already submitted this quiz." });
    }
    const submission = new Submission({ quizId, userId, answers, score });
    await submission.save();
    res.status(201).json(submission);
  } catch (err) {
    res.status(500).json({ message: "Submission failed", error: err.message });
  }
};

const getQuizSubmissions = async (req, res) => {
  try {
    const { quizId } = req.params;
    const submissions = await Submission.find({ quizId })
      .populate("userId")
      .populate("answers.questionId");
    res.status(200).json(submissions);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Fetching submissions failed", error: err.message });
  }
};

module.exports = { submitQuiz, getQuizSubmissions };
