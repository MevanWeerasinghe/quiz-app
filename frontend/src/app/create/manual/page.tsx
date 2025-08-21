"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function ManualCreatePage() {
  const { user } = useUser();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [timeLimit, setTimeLimit] = useState(5);
  const [allowBack, setAllowBack] = useState(true);
  const [showResult, setShowResult] = useState(true);

  const [questions, setQuestions] = useState([
    { text: "", options: ["", "", "", ""], correctIndex: 0 },
  ]);

  const handleQuestionChange = (index: number, field: string, value: any) => {
    const newQuestions = [...questions];
    if (field === "text") newQuestions[index].text = value;
    else if (field.startsWith("option")) {
      const optionIndex = parseInt(field.slice(-1));
      newQuestions[index].options[optionIndex] = value;
    } else if (field === "correctIndex") {
      newQuestions[index].correctIndex = parseInt(value);
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

    const payload = {
      title,
      creatorId: user.id,
      timeLimit,
      allowBack,
      showResult,
      questions,
    };

    try {
      const res = await fetch("http://localhost:5000/api/quizzes/save-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Quiz save failed");

      const data = await res.json();
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

      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block font-medium text-white mb-1">
            Time Limit (min)
          </label>
          <input
            type="number"
            className="border border-[#169976] bg-[#000000] text-white placeholder-white/50 p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-[#1DCD9F]"
            value={timeLimit}
            onChange={(e) => setTimeLimit(parseInt(e.target.value || "0", 10))}
            min={0}
          />
        </div>

        <div className="flex gap-6 items-center md:mt-7">
          <label className="flex gap-2 items-center text-white">
            <input
              type="checkbox"
              checked={allowBack}
              onChange={(e) => setAllowBack(e.target.checked)}
              className="accent-[#1DCD9F]"
            />
            Allow Back
          </label>
          <label className="flex gap-2 items-center text-white">
            <input
              type="checkbox"
              checked={showResult}
              onChange={(e) => setShowResult(e.target.checked)}
              className="accent-[#1DCD9F]"
            />
            Show Result
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
