const Quiz = require("../models/Quiz");
const Question = require("../models/Question");
const { generateQuizWithGemini } = require("../utils/geminiApi");

// Create a quiz (manual or AI)
const createQuiz = async (req, res) => {
  try {
    const {
      title,
      creatorId,
      timeLimit,
      allowBack,
      showResult,
      createdWithAI,
    } = req.body;

    const quiz = new Quiz({
      title,
      creator: creatorId,
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

// Get all quizzes created by a user
const getUserQuizzes = async (req, res) => {
  try {
    const { userId } = req.params;
    const quizzes = await Quiz.find({ creator: userId }).populate("questions");
    res.status(200).json(quizzes);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Fetching quizzes failed", error: err.message });
  }
};

// Generate a quiz using Gemini
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
    const parsed = JSON.parse(result);
    res.status(200).json(parsed);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to parse Gemini response", raw: result });
  }
};

const createAIQuizWithQuestions = async (req, res) => {
  try {
    const {
      title,
      creatorId,
      timeLimit,
      allowBack,
      showResult,
      questions, // full array from Gemini
    } = req.body;

    // Step 1: Create quiz
    const quiz = new Quiz({
      title,
      creator: creatorId,
      timeLimit,
      allowBack,
      showResult,
      createdWithAI: true,
    });
    await quiz.save();

    // Step 2: Create questions
    const questionDocs = await Promise.all(
      questions.map(async (q) => {
        const newQ = new Question({
          quizId: quiz._id,
          text: q.text,
          options: q.options,
          correctIndex: q.correctIndex,
        });
        await newQ.save();
        return newQ._id;
      })
    );

    // Step 3: Update quiz with question IDs
    quiz.questions = questionDocs;
    await quiz.save();

    res.status(201).json({ quizId: quiz._id });
  } catch (err) {
    res
      .status(500)
      .json({ message: "AI Quiz save failed", error: err.message });
  }
};

// Export all controller functions
module.exports = {
  createQuiz,
  getUserQuizzes,
  generateAIQuiz,
  createAIQuizWithQuestions,
};
