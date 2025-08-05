// backend/app.js
const express = require("express");
const cors = require("cors");
const { connectDB } = require("./config/database");

const userRoutes = require("./routes/userRoutes");
const quizRoutes = require("./routes/quizRoutes");
const submissionRoutes = require("./routes/submissionRoutes");

const app = express();

// Middlewares
app.use(
  cors({
    origin: "http://localhost:3000", // allow only your frontend
    credentials: true,
  })
);
app.use(express.json());

// Connect to MongoDB
connectDB();

// Register routes
app.use("/api/users", userRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/submissions", submissionRoutes);

// Example route
app.get("/", (req, res) => {
  res.send("Quiz Web API running...");
});

module.exports = app;

// const allowedOrigins = ["http://localhost:3000", "https://quiz-app.com"];

// app.use(cors({
//   origin: function (origin, callback) {
//     if (!origin || allowedOrigins.includes(origin)) {
//       callback(null, true);
//     } else {
//       callback(new Error("Not allowed by CORS"));
//     }
//   },
//   credentials: true,
// }));
