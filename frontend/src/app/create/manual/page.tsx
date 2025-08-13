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
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">Manual Quiz Creator</h1>

      <div className="mb-4">
        <label className="block font-medium">Quiz Title</label>
        <input
          type="text"
          className="border p-2 w-full rounded"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="mb-4 grid grid-cols-2 gap-4">
        <div>
          <label className="block font-medium">Time Limit (min)</label>
          <input
            type="number"
            className="border p-2 w-full rounded"
            value={timeLimit}
            onChange={(e) => setTimeLimit(parseInt(e.target.value))}
          />
        </div>
        <div className="flex gap-4 items-center mt-6">
          <label className="flex gap-2 items-center">
            <input
              type="checkbox"
              checked={allowBack}
              onChange={(e) => setAllowBack(e.target.checked)}
            />
            Allow Back
          </label>
          <label className="flex gap-2 items-center">
            <input
              type="checkbox"
              checked={showResult}
              onChange={(e) => setShowResult(e.target.checked)}
            />
            Show Result
          </label>
        </div>
      </div>

      <h2 className="text-xl font-semibold mt-8 mb-2">Questions</h2>
      {questions.map((q, idx) => (
        <div key={idx} className="mb-6 border rounded p-4">
          <label className="block font-medium mb-1">Question {idx + 1}</label>
          <input
            type="text"
            className="border p-2 w-full rounded mb-2"
            placeholder="Question text"
            value={q.text}
            onChange={(e) => handleQuestionChange(idx, "text", e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4 mb-2">
            {q.options.map((opt, i) => (
              <input
                key={i}
                type="text"
                className="border p-2 rounded"
                placeholder={`Option ${i + 1}`}
                value={opt}
                onChange={(e) =>
                  handleQuestionChange(idx, `option${i}`, e.target.value)
                }
              />
            ))}
          </div>

          <label className="block font-medium">Correct Option</label>
          <select
            className="border p-2 rounded"
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
        className="mb-6 bg-green-500 text-white py-2 px-4 rounded"
        onClick={addQuestion}
      >
        + Add Question
      </button>

      <div>
        <button
          className="bg-purple-600 text-white py-3 px-6 rounded text-lg"
          onClick={handleSubmit}
        >
          Save Quiz
        </button>
      </div>
    </div>
  );
}
