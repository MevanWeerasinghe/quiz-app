"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function AIGeneratePage() {
  const { user } = useUser();
  const router = useRouter();

  const [topic, setTopic] = useState("");
  const [numQuestions, setNumQuestions] = useState(5);
  const [numOptions, setNumOptions] = useState(4);
  const [promptInstructions, setPromptInstructions] = useState("");
  const [loading, setLoading] = useState(false);

  const [quizTitle, setQuizTitle] = useState("");
  const [timeLimit, setTimeLimit] = useState(5);
  const [allowBack, setAllowBack] = useState(true);
  const [showResult, setShowResult] = useState(true);

  const [questions, setQuestions] = useState<any[]>([]);

  const handleGenerate = async () => {
    if (!topic || !user) return alert("Please enter a topic and login");

    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/quizzes/generate-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          numQuestions,
          numOptions,
          promptInstructions,
        }),
      });

      const data = await res.json();
      if (!Array.isArray(data)) throw new Error("Invalid response");

      setQuestions(data);
    } catch (err) {
      console.error(err);
      alert("AI generation failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!quizTitle || questions.length === 0 || !user) return;

    const payload = {
      title: quizTitle,
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

      if (!res.ok) throw new Error("Failed to save quiz");
      alert("Quiz saved!");
      router.push("/create");
    } catch (err) {
      console.error(err);
      alert("Failed to save quiz");
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">Generate Quiz with AI</h1>

      <div className="grid gap-4 mb-8">
        <label className="block">
          <span className="block font-medium mb-1">Topic</span>
          <input
            className="border p-2 rounded w-full"
            placeholder="e.g. World War II, JavaScript"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label>
            <span className="block font-medium mb-1">Number of Questions</span>
            <input
              type="number"
              className="border p-2 rounded w-full"
              value={numQuestions}
              onChange={(e) => setNumQuestions(parseInt(e.target.value))}
            />
          </label>
          <label>
            <span className="block font-medium mb-1">Options per Question</span>
            <input
              type="number"
              className="border p-2 rounded w-full"
              value={numOptions}
              onChange={(e) => setNumOptions(parseInt(e.target.value))}
            />
          </label>
        </div>

        <label className="block">
          <span className="block font-medium mb-1">
            Prompt Instructions (optional)
          </span>
          <textarea
            className="border p-2 rounded w-full"
            rows={3}
            placeholder="e.g. Include mix of biology, physics, chemistry"
            value={promptInstructions}
            onChange={(e) => setPromptInstructions(e.target.value)}
          />
        </label>

        <button
          onClick={handleGenerate}
          className="bg-blue-600 text-white px-6 py-2 rounded"
          disabled={loading}
        >
          {loading ? "Generating..." : "Generate with AI"}
        </button>
      </div>

      {questions.length > 0 && (
        <>
          <h2 className="text-xl font-semibold mb-2">Preview & Save</h2>

          <div className="mb-4">
            <label className="block font-medium">Quiz Title</label>
            <input
              type="text"
              className="border p-2 w-full rounded"
              placeholder="Enter quiz title"
              value={quizTitle}
              onChange={(e) => setQuizTitle(e.target.value)}
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

          <ul className="space-y-4 mb-6">
            {questions.map((q, idx) => (
              <li key={idx} className="border p-4 rounded">
                <p className="font-medium mb-1">
                  {idx + 1}. {q.text}
                </p>
                <ul className="list-disc ml-6 text-sm text-gray-600">
                  {q.options.map((opt: string, i: number) => (
                    <li key={i}>
                      {opt} {q.correctIndex === i && "(✔️ correct)"}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>

          <button
            onClick={handleSave}
            className="bg-green-600 text-white px-6 py-3 rounded text-lg"
          >
            Save Quiz
          </button>
        </>
      )}
    </div>
  );
}
