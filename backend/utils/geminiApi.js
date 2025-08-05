// backend/utils/geminiApi.js
const axios = require("axios");

const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

const generateQuizWithGemini = async (prompt) => {
  const requestBody = {
    contents: [{ parts: [{ text: prompt }] }],
  };

  const headers = {
    "Content-Type": "application/json",
  };

  try {
    const response = await axios.post(GEMINI_API_URL, requestBody, { headers });
    const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
    return text || null;
  } catch (err) {
    console.error("Gemini API error:", err.message);
    return null;
  }
};

module.exports = { generateQuizWithGemini };
