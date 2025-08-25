const Quiz = require("../models/Quiz");
const Question = require("../models/Question");
const { generateQuizWithGemini } = require("../utils/geminiApi");

// Create a quiz (manual or AI) - (kept for completeness if used anywhere else)
const createQuiz = async (req, res) => {
  try {
    const {
      title,
      creatorId,
      timingMode = "whole-quiz", // NEW
      timeLimit = 0, // minutes
      allowBack,
      showResult,
      createdWithAI,
    } = req.body;

    const quiz = new Quiz({
      title,
      creator: creatorId,
      timingMode,
      timeLimit,
      allowBack,
      showResult,
      createdWithAI,
    });

    await quiz.save();
    res.status(201).json(quiz);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Quiz creation failed", error: err.message });
  }
};

// Get all quizzes created by a user, with optional search
const getUserQuizzes = async (req, res) => {
  try {
    const { userId } = req.params;
    const { search } = req.query;

    const query = { creator: userId };
    if (search) {
      query.title = { $regex: search, $options: "i" };
    }

    const quizzes = await Quiz.find(query)
      .sort({ createdAt: -1 })
      .populate("questions");

    res.status(200).json(quizzes);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Fetching quizzes failed", error: err.message });
  }
};

// Delete quiz by id
const deleteQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;

    // Delete related questions
    await Question.deleteMany({ quizId });

    // Delete the quiz
    const deleted = await Quiz.findByIdAndDelete(quizId);
    if (!deleted) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    res.json({ message: "Quiz deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Quiz deletion failed", error: err.message });
  }
};

// Update quiz metadata
const updateQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const {
      title,
      timingMode, // NEW (optional)
      timeLimit, // minutes (only for whole-quiz)
      allowBack,
      showResult,
    } = req.body;

    const update = { title, allowBack, showResult };
    if (timingMode) update.timingMode = timingMode;
    if (typeof timeLimit === "number") update.timeLimit = timeLimit;

    const updated = await Quiz.findByIdAndUpdate(quizId, update, { new: true });

    if (!updated) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    await updated.populate("questions");
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Quiz update failed", error: err.message });
  }
};

// Generate a quiz using Gemini (unchanged)
const generateAIQuiz = async (req, res) => {
  const { topic, numQuestions, numOptions, promptInstructions } = req.body;

  const prompt = `
Generate a multiple-choice quiz on the topic: "${topic}".
- Include ${numQuestions} questions.
- Each question should have ${numOptions} answer options.
- Format the output as JSON like this:

[
  {
    "text": "What is the capital of France?",
    "options": ["Paris", "London", "Rome", "Berlin"],
    "correctIndex": 0
  },
  ...
]

Instructions: ${
    promptInstructions || "Use general knowledge. Keep questions clear."
  }
`;

  const result = await generateQuizWithGemini(prompt);

  try {
    const cleanResult = result
      .replace(/^```json\s*/i, "")
      .replace(/```$/, "")
      .trim();

    const parsed = JSON.parse(cleanResult);
    res.status(200).json(parsed);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to parse Gemini response", raw: result });
  }
};

// Save a quiz with provided questions (used by both Manual and AI flows)
const createAIQuizWithQuestions = async (req, res) => {
  try {
    const {
      title,
      creatorId,
      timingMode = "whole-quiz", // NEW
      perQuestionTimeSec = 60, // NEW (used when timingMode === 'per-question')
      timeLimit = 0, // minutes (used when whole-quiz)
      allowBack,
      showResult,
      questions, // array of { text, options, correctIndex }
    } = req.body;

    // Step 1: Create quiz
    const quiz = new Quiz({
      title,
      creator: creatorId,
      timingMode,
      timeLimit,
      allowBack,
      showResult,
      createdWithAI: true,
    });
    await quiz.save();

    // Step 2: Create questions with optional per-question time
    const questionDocs = await Promise.all(
      questions.map(async (q) => {
        const newQ = new Question({
          quizId: quiz._id,
          text: q.text,
          options: q.options,
          correctIndex: q.correctIndex,
          questionTime:
            timingMode === "per-question"
              ? Number(q.questionTime ?? perQuestionTimeSec)
              : undefined,
        });
        await newQ.save();
        return newQ._id;
      })
    );

    // Step 3: attach question ids
    quiz.questions = questionDocs;
    await quiz.save();

    res.status(201).json({ quizId: quiz._id });
  } catch (err) {
    res
      .status(500)
      .json({ message: "AI/Manual Quiz save failed", error: err.message });
  }
};

const getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId).populate("questions");
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });
    res.json(quiz);
  } catch (err) {
    res.status(500).json({ message: "Quiz fetch failed", error: err.message });
  }
};

const updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { text, options, correctIndex, questionTime } = req.body; // NEW: allow updating questionTime

    if (!Array.isArray(options) || options.length < 2 || options.length > 5) {
      return res.status(400).json({ message: "Options must be 2–5 items." });
    }
    if (correctIndex < 0 || correctIndex >= options.length) {
      return res.status(400).json({ message: "correctIndex out of range." });
    }

    const update = { text, options, correctIndex };
    if (typeof questionTime === "number") {
      update.questionTime = questionTime;
    }

    const updated = await Question.findByIdAndUpdate(id, update, { new: true });
    if (!updated) {
      return res.status(404).json({ message: "Question not found" });
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Update failed", error: err.message });
  }
};

module.exports = {
  createQuiz,
  getUserQuizzes,
  deleteQuiz,
  updateQuiz,
  generateAIQuiz,
  createAIQuizWithQuestions,
  getQuizById,
  updateQuestion,
};
