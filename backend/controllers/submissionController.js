// backend/controllers/submissionController.js
const Submission = require("../models/Submission");
const Question = require("../models/Question"); // <-- required

const submitQuiz = async (req, res) => {
  try {
    const { quizId, userId, userEmail, answers } = req.body;

    // one attempt per user
    const existing = await Submission.findOne({ quizId, userId });
    if (existing) {
      return res
        .status(400)
        .json({ message: "User has already submitted this quiz." });
    }

    // compute score server-side
    const questions = await Question.find({ quizId }).sort({ _id: 1 });

    // Build map: qId -> correctIndex
    const correctById = new Map(
      questions.map((q) => [String(q._id), q.correctIndex])
    );

    let score = 0;
    for (const ans of answers || []) {
      const qid = String(ans.questionId);
      const correctIndex = correctById.get(qid);
      if (
        typeof ans.selectedIndex === "number" &&
        typeof correctIndex === "number" &&
        ans.selectedIndex === correctIndex
      ) {
        score += 1;
      }
    }

    const submission = new Submission({
      quizId,
      userId, // Clerk id string
      userEmail, // for display
      answers,
      score,
    });

    await submission.save();
    return res.status(201).json(submission);
  } catch (err) {
    console.error("submitQuiz error:", err);
    return res
      .status(500)
      .json({ message: "Submission failed", error: err.message });
  }
};

const getQuizSubmissions = async (req, res) => {
  try {
    const { quizId } = req.params;
    const submissions = await Submission.find({ quizId }).populate(
      "answers.questionId"
    );
    return res.status(200).json(submissions);
  } catch (err) {
    console.error("getQuizSubmissions error:", err);
    return res
      .status(500)
      .json({ message: "Fetching submissions failed", error: err.message });
  }
};

const getQuizSummary = async (req, res) => {
  try {
    const { quizId } = req.params;
    const submissions = await Submission.find({ quizId });
    const questions = await Question.find({ quizId }).sort({ _id: 1 });

    const correctCounts = Array(questions.length).fill(0);

    submissions.forEach((sub) => {
      sub.answers.forEach((ans) => {
        const qIdx = questions.findIndex(
          (q) => String(q._id) === String(ans.questionId)
        );
        if (qIdx !== -1 && typeof ans.selectedIndex === "number") {
          if (ans.selectedIndex === questions[qIdx].correctIndex) {
            correctCounts[qIdx] += 1;
          }
        }
      });
    });

    // handle empty questions safely
    if (questions.length === 0) {
      return res.json({
        totalSubmissions: submissions.length,
        correctCounts: [],
        mostCorrect: null,
        leastCorrect: null,
      });
    }

    let mostIdx = 0;
    let leastIdx = 0;
    for (let i = 1; i < correctCounts.length; i++) {
      if (correctCounts[i] > correctCounts[mostIdx]) mostIdx = i;
      if (correctCounts[i] < correctCounts[leastIdx]) leastIdx = i;
    }

    return res.json({
      totalSubmissions: submissions.length,
      correctCounts,
      mostCorrect: questions[mostIdx]
        ? { index: mostIdx, questionId: questions[mostIdx]._id }
        : null,
      leastCorrect: questions[leastIdx]
        ? { index: leastIdx, questionId: questions[leastIdx]._id }
        : null,
    });
  } catch (err) {
    console.error("getQuizSummary error:", err);
    return res
      .status(500)
      .json({ message: "Summary failed", error: err.message });
  }
};

module.exports = { submitQuiz, getQuizSubmissions, getQuizSummary };
