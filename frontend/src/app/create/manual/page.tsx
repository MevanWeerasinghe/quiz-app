"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function ManualCreatePage() {
  const { user } = useUser();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [timingMode, setTimingMode] = useState<"whole-quiz" | "per-question">(
    "whole-quiz"
  );
  const [timeLimit, setTimeLimit] = useState(5); // minutes for whole-quiz
  const [perQuestionTimeSec, setPerQuestionTimeSec] = useState(60); // seconds for per-question

  const [allowBack, setAllowBack] = useState(true);
  const [showResult, setShowResult] = useState(true);

  const [questions, setQuestions] = useState([
    { text: "", options: ["", "", "", ""], correctIndex: 0 },
  ]);

  useEffect(() => {
    if (timingMode === "per-question") {
      setAllowBack(false);
    } else if (timingMode === "whole-quiz") {
      setAllowBack(true);
    }
  }, [timingMode, setAllowBack]);

  const handleQuestionChange = (index: number, field: string, value: any) => {
    const newQuestions = [...questions];
    if (field === "text") newQuestions[index].text = value;
    else if (field.startsWith("option")) {
      const optionIndex = parseInt(field.slice(-1));
      newQuestions[index].options[optionIndex] = value;
    } else if (field === "correctIndex") {
      newQuestions[index].correctIndex = parseInt(value, 10);
    }
    setQuestions(newQuestions);
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { text: "", options: ["", "", "", ""], correctIndex: 0 },
    ]);
  };

  const handleSubmit = async () => {
    if (!user) return alert("Please sign in first");

    // When timingMode is per-question, we attach a uniform questionTime to each question
    const payload = {
      title,
      creatorId: user.id,
      timingMode,
      timeLimit: timingMode === "whole-quiz" ? timeLimit : 0,
      perQuestionTimeSec:
        timingMode === "per-question" ? perQuestionTimeSec : undefined,
      allowBack,
      showResult,
      questions: questions.map((q) => ({
        ...q,
        // backend will fill questionTime from perQuestionTimeSec; included here if you want explicit
        questionTime:
          timingMode === "per-question" ? perQuestionTimeSec : undefined,
      })),
    };

    try {
      const res = await fetch("http://localhost:5000/api/quizzes/save-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Quiz save failed");

      await res.json();
      alert("Quiz created!");
      router.push("/create");
    } catch (err) {
      console.error(err);
      alert("Failed to create quiz");
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 bg-[#000000] min-h-[calc(100vh-64px)]">
      <h1 className="text-2xl font-bold mb-6 text-white">
        Manual Quiz Creator
      </h1>

      {/* Quiz meta */}
      <div className="mb-4">
        <label className="block font-medium text-white mb-1">Quiz Title</label>
        <input
          type="text"
          className="border border-[#169976] bg-[#000000] text-white placeholder-white/50 p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-[#1DCD9F]"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter a descriptive title…"
        />
      </div>

      {/* Timing Mode */}
      <div className="mb-4 border border-[#169976] rounded-lg p-4 bg-[#222222]">
        <span className="block font-medium text-white mb-2">Timing Mode</span>
        <div className="flex flex-col sm:flex-row gap-4">
          <label className="inline-flex items-center gap-2 text-white">
            <input
              type="radio"
              name="timingMode"
              value="whole-quiz"
              checked={timingMode === "whole-quiz"}
              onChange={() => setTimingMode("whole-quiz")}
              className="accent-[#1DCD9F]"
            />
            Whole quiz time limit
          </label>
          <label className="inline-flex items-center gap-2 text-white">
            <input
              type="radio"
              name="timingMode"
              value="per-question"
              checked={timingMode === "per-question"}
              onChange={() => setTimingMode("per-question")}
              className="accent-[#1DCD9F]"
            />
            Time per question
          </label>
        </div>

        {timingMode === "whole-quiz" ? (
          <div className="mt-4">
            <label className="block font-medium text-white mb-1">
              Time Limit (minutes)
            </label>
            <input
              type="number"
              min={0}
              className="border border-[#169976] bg-[#000000] text-white placeholder-white/50 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-[#1DCD9F]"
              value={timeLimit}
              onChange={(e) =>
                setTimeLimit(parseInt(e.target.value || "0", 10))
              }
            />
          </div>
        ) : (
          <div className="mt-4">
            <label className="block font-medium text-white mb-1">
              Time per Question (seconds)
            </label>
            <input
              type="number"
              min={5}
              className="border border-[#169976] bg-[#000000] text-white placeholder-white/50 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-[#1DCD9F]"
              value={perQuestionTimeSec}
              onChange={(e) =>
                setPerQuestionTimeSec(parseInt(e.target.value || "0", 10))
              }
            />
          </div>
        )}
      </div>

      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-[#169976] rounded-lg p-4 bg-[#222222]">
          <label className="block font-medium text-white mb-1">
            Allow Back
          </label>
          {timingMode === "per-question" ? (
            <span className="text-s text-white/50 leading-tight">
              Allow Back is not allowed in this time mode
            </span>
          ) : (
            <label className="inline-flex gap-2 items-center text-white">
              <input
                type="checkbox"
                checked={allowBack}
                onChange={(e) => setAllowBack(e.target.checked)}
                className="accent-[#1DCD9F]"
              />
              Enable back navigation between questions
            </label>
          )}
        </div>

        <div className="border border-[#169976] rounded-lg p-4 bg-[#222222]">
          <label className="block font-medium text-white mb-1">
            Show Result
          </label>
          <label className="inline-flex gap-2 items-center text-white">
            <input
              type="checkbox"
              checked={showResult}
              onChange={(e) => setShowResult(e.target.checked)}
              className="accent-[#1DCD9F]"
            />
            Show score after submission
          </label>
        </div>
      </div>

      <h2 className="text-xl font-semibold mt-8 mb-2 text-white">Questions</h2>

      {questions.map((q, idx) => (
        <div
          key={idx}
          className="mb-6 border border-[#169976] rounded p-4 bg-[#222222]"
        >
          <label className="block font-medium mb-2 text-white">
            Question {idx + 1}
          </label>
          <input
            type="text"
            className="border border-[#169976] bg-[#000000] text-white placeholder-white/50 p-2 w-full rounded mb-3 focus:outline-none focus:ring-2 focus:ring-[#1DCD9F]"
            placeholder="Question text"
            value={q.text}
            onChange={(e) => handleQuestionChange(idx, "text", e.target.value)}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
            {q.options.map((opt, i) => (
              <input
                key={i}
                type="text"
                className="border border-[#169976] bg-[#000000] text-white placeholder-white/50 p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#1DCD9F]"
                placeholder={`Option ${i + 1}`}
                value={opt}
                onChange={(e) =>
                  handleQuestionChange(idx, `option${i}`, e.target.value)
                }
              />
            ))}
          </div>

          <label className="block font-medium text-white mb-1">
            Correct Option
          </label>
          <select
            className="border border-[#169976] bg-[#000000] text-white p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#1DCD9F]"
            value={q.correctIndex}
            onChange={(e) =>
              handleQuestionChange(idx, "correctIndex", e.target.value)
            }
          >
            {q.options.map((_, i) => (
              <option key={i} value={i}>
                Option {i + 1}
              </option>
            ))}
          </select>
        </div>
      ))}

      <button
        className="mb-6 px-4 py-2 rounded border border-[#1DCD9F] text-[#1DCD9F] hover:bg-[#000000] transition"
        onClick={addQuestion}
      >
        + Add Question
      </button>

      <div>
        <button
          className="bg-[#1DCD9F] text-[#000000] py-3 px-6 rounded text-lg hover:bg-[#169976] transition"
          onClick={handleSubmit}
        >
          Save Quiz
        </button>
      </div>
    </div>
  );
}
