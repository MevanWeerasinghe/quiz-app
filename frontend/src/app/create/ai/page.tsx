"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Popup from "@/components/Popup";
import { API_URL } from "@/lib/api";

type Question = {
  text: string;
  options: string[];
  correctIndex: number;
  questionTime?: number;
};

export default function AIGeneratePage() {
  const { user } = useUser();
  const router = useRouter();

  const [topic, setTopic] = useState("");
  const [numQuestions, setNumQuestions] = useState(5);
  const [numOptions, setNumOptions] = useState(4);
  const [promptInstructions, setPromptInstructions] = useState("");
  const [loading, setLoading] = useState(false);

  const [quizTitle, setQuizTitle] = useState("");
  const [timingMode, setTimingMode] = useState<"whole-quiz" | "per-question">(
    "whole-quiz"
  );
  const [timeLimit, setTimeLimit] = useState(5); // minutes (whole-quiz)
  const [perQuestionTimeSec, setPerQuestionTimeSec] = useState(60); // seconds (per-question)
  const [allowBack, setAllowBack] = useState(true);
  const [showResult, setShowResult] = useState(true);

  const [questions, setQuestions] = useState<Question[]>([]);

  // Popup states
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupMessage, setPopupMessage] = useState<string | React.ReactNode>(
    ""
  );
  const [successOpen, setSuccessOpen] = useState(false);

  useEffect(() => {
    if (timingMode === "per-question") {
      setAllowBack(false);
    } else if (timingMode === "whole-quiz") {
      setAllowBack(true);
    }
  }, [timingMode, setAllowBack]);

  const handleGenerate = async () => {
    if (!topic || !user) return alert("Please enter a topic and login");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/quizzes/generate-ai`, {
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
    if (!user) {
      setPopupMessage("Please sign in first");
      setPopupOpen(true);
      return;
    }
    if (!quizTitle) {
      setPopupMessage("Title is required");
      setPopupOpen(true);
      return;
    }
    if (questions.length === 1) {
      setPopupMessage("Add at least two question");
      setPopupOpen(true);
      return;
    }

    const payload = {
      title: quizTitle,
      creatorId: user.id,
      timingMode,
      timeLimit: timingMode === "whole-quiz" ? timeLimit : 0,
      perQuestionTimeSec:
        timingMode === "per-question" ? perQuestionTimeSec : undefined,
      allowBack,
      showResult,
      questions: questions.map((q) => ({
        ...q,
        questionTime:
          timingMode === "per-question" ? perQuestionTimeSec : undefined,
      })),
    };

    try {
      const res = await fetch(`${API_URL}/api/quizzes/save-ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save quiz");
      setSuccessOpen(true);
    } catch (err) {
      console.error(err);
      alert("Failed to save quiz");
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 bg-[#000000] min-h-[calc(100vh-64px)]">
      <h1 className="text-2xl font-bold mb-6 text-white">
        Generate Quiz with AI
      </h1>

      {/* Generator controls */}
      <div className="grid gap-4 mb-8 border border-[#169976] rounded-lg p-4 bg-[#222222]">
        <label className="block">
          <span className="block font-medium mb-1 text-white">Topic</span>
          <input
            className="border border-[#169976] bg-[#000000] text-white placeholder-white/50 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-[#1DCD9F]"
            placeholder="e.g. World War II, JavaScript"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="block font-medium mb-1 text-white">
              Number of Questions
            </span>
            <input
              type="number"
              className="border border-[#169976] bg-[#000000] text-white placeholder-white/50 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-[#1DCD9F]"
              value={numQuestions}
              onChange={(e) =>
                setNumQuestions(parseInt(e.target.value || "0", 10))
              }
              min={1}
            />
          </label>
          <label className="block">
            <span className="block font-medium mb-1 text-white">
              Options per Question
            </span>
            <input
              type="number"
              className="border border-[#169976] bg-[#000000] text-white placeholder-white/50 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-[#1DCD9F]"
              value={numOptions}
              onChange={(e) =>
                setNumOptions(parseInt(e.target.value || "0", 10))
              }
              min={2}
            />
          </label>
        </div>

        <label className="block">
          <span className="block font-medium mb-1 text-white">
            Prompt Instructions (optional)
          </span>
          <textarea
            className="border border-[#169976] bg-[#000000] text-white placeholder-white/50 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-[#1DCD9F]"
            rows={3}
            placeholder="e.g. Include mix of biology, physics, chemistry"
            value={promptInstructions}
            onChange={(e) => setPromptInstructions(e.target.value)}
          />
        </label>

        {/* Timing Mode */}
        <div className="border border-[#169976] rounded-lg p-4 bg-[#222222]">
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

        <button
          onClick={handleGenerate}
          className="bg-[#1DCD9F] text-[#000000] px-6 py-2 rounded font-medium hover:bg-[#169976] transition disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? "Generating..." : "Generate with AI"}
        </button>
      </div>

      {questions.length > 0 && (
        <>
          <h2 className="text-xl font-semibold mb-2 text-white">
            Preview &amp; Save
          </h2>

          <div className="mb-4 border border-[#169976] rounded-lg p-4 bg-[#222222]">
            <label className="block font-medium text-white mb-1">
              Quiz Title
            </label>
            <input
              type="text"
              className="border border-[#169976] bg-[#000000] text-white placeholder-white/50 p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-[#1DCD9F]"
              placeholder="Enter quiz title"
              value={quizTitle}
              onChange={(e) => setQuizTitle(e.target.value)}
            />
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

          <ul className="space-y-4 mb-6">
            {questions.map((q, idx) => (
              <li
                key={idx}
                className="border border-[#169976] p-4 rounded bg-[#222222]"
              >
                <p className="font-medium mb-2 text-white">
                  {idx + 1}. {q.text}
                </p>
                <ul className="list-disc ml-6 text-sm">
                  {q.options.map((opt: string, i: number) => (
                    <li
                      key={i}
                      className={
                        q.correctIndex === i
                          ? "text-[#1DCD9F]"
                          : "text-white/70"
                      }
                    >
                      {opt} {q.correctIndex === i && " (✔️ correct)"}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>

          <button
            onClick={handleSave}
            className="bg-[#1DCD9F] text-[#000000] px-6 py-3 rounded text-lg font-medium hover:bg-[#169976] transition"
          >
            Save Quiz
          </button>
        </>
      )}
      <Popup
        open={popupOpen}
        onClose={() => setPopupOpen(false)}
        title="Notice"
        message={popupMessage}
        buttons={[
          {
            label: "OK",
            color: "primary",
            onClick: () => {},
            autoClose: true,
          },
        ]}
      />
      <Popup
        open={successOpen}
        onClose={() => {
          setSuccessOpen(false);
          router.push("/my-quizzes");
        }}
        title="Success"
        message="Quiz created successfully!"
        buttons={[
          {
            label: "OK",
            color: "primary",
            onClick: () => {},
            autoClose: true,
          },
        ]}
      />
    </div>
  );
}
