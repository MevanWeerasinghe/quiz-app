"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Popup from "@/components/Popup";
import { API_URL } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Minus, Save } from "lucide-react";

type Question = {
  text: string;
  options: string[];
  correctIndex: number;
};

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

  const [questions, setQuestions] = useState<Question[]>([
    { text: "", options: ["", "", "", ""], correctIndex: 0 },
  ]);

  // Popup states
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupMessage, setPopupMessage] = useState<string | React.ReactNode>(
    ""
  );
  const [successOpen, setSuccessOpen] = useState(false);

  // Effect to manage back navigation based on timing mode
  useEffect(() => {
    if (timingMode === "per-question") {
      setAllowBack(false);
    } else if (timingMode === "whole-quiz") {
      setAllowBack(true);
    }
  }, [timingMode, setAllowBack]);

  // Handle question changes
  const handleQuestionChange = (
    index: number,
    field: string,
    value: string
  ) => {
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

  // Add a new question
  const addQuestion = () => {
    setQuestions([
      ...questions,
      { text: "", options: ["", "", "", ""], correctIndex: 0 },
    ]);
  };

  // Remove a question
  const removeQuestion = () => {
    if (questions.length > 1) {
      setQuestions(questions.slice(0, -1));
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!user) {
      setPopupMessage("Please sign in first");
      setPopupOpen(true);
      return;
    }
    if (!title) {
      setPopupMessage("Title is required");
      setPopupOpen(true);
      return;
    }
    if (questions.length === 1) {
      setPopupMessage("Add at least two question");
      setPopupOpen(true);
      return;
    }

    const hasEmpty = questions.some(
      (q) => !q.text.trim() || q.options.some((opt) => !opt.trim())
    );
    if (hasEmpty) {
      setPopupMessage(
        "Please fill all question texts and options, or remove empty slots before saving."
      );
      setPopupOpen(true);
      return;
    }

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
      const res = await fetch(`${API_URL}/api/quizzes/save-ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Quiz save failed");

      await res.json();
      setSuccessOpen(true);
    } catch (err) {
      console.error(err);
      setPopupMessage("Failed to create quiz");
      setPopupOpen(true);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 bg-[#000000] min-h-[calc(100vh-64px)]">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-white">
          Manual Quiz Creator
        </h1>
        <p className="text-white/70">
          Build your quiz question by question with full control
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Quiz Settings</CardTitle>
          <CardDescription>
            Configure your quiz details and timing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Quiz Title */}
          <div className="space-y-2">
            <label className="block font-medium text-white">Quiz Title</label>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a descriptive title…"
            />
          </div>

          {/* Timing Mode */}
          <div className="space-y-4">
            <label className="block font-medium text-white">Timing Mode</label>
            <div className="flex flex-col sm:flex-row gap-4">
              <label className="inline-flex items-center gap-2 text-white cursor-pointer">
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
              <label className="inline-flex items-center gap-2 text-white cursor-pointer">
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
              <div className="space-y-2">
                <label className="block text-sm font-medium text-white">
                  Time Limit (minutes)
                </label>
                <Input
                  type="number"
                  min={0}
                  value={timeLimit}
                  onChange={(e) =>
                    setTimeLimit(parseInt(e.target.value || "0", 10))
                  }
                />
              </div>
            ) : (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-white">
                  Time per Question (seconds)
                </label>
                <Input
                  type="number"
                  min={5}
                  value={perQuestionTimeSec}
                  onChange={(e) =>
                    setPerQuestionTimeSec(parseInt(e.target.value || "0", 10))
                  }
                />
              </div>
            )}
          </div>

          <Separator />

          {/* Allow Back and Show Result */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block font-medium text-white">Allow Back</label>
              {timingMode === "per-question" ? (
                <p className="text-sm text-white/50">
                  Not allowed in per-question timing mode
                </p>
              ) : (
                <label className="inline-flex gap-2 items-center text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowBack}
                    onChange={(e) => setAllowBack(e.target.checked)}
                    className="accent-[#1DCD9F]"
                  />
                  <span className="text-sm">
                    Enable back navigation between questions
                  </span>
                </label>
              )}
            </div>

            <div className="space-y-2">
              <label className="block font-medium text-white">
                Show Result
              </label>
              <label className="inline-flex gap-2 items-center text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={showResult}
                  onChange={(e) => setShowResult(e.target.checked)}
                  className="accent-[#1DCD9F]"
                />
                <span className="text-sm">Show score after submission</span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-semibold text-white">Questions</h2>
            <p className="text-sm text-white/70 mt-1">
              Add and configure your quiz questions
            </p>
          </div>
          <Badge variant="secondary" className="text-lg px-3 py-1">
            {questions.length}{" "}
            {questions.length === 1 ? "Question" : "Questions"}
          </Badge>
        </div>

        <div className="space-y-4">
          {questions.map((q, idx) => (
            <Card key={idx}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#1DCD9F]/10 text-[#1DCD9F] text-sm font-bold">
                    {idx + 1}
                  </span>
                  Question {idx + 1}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  type="text"
                  placeholder="Enter question text"
                  value={q.text}
                  onChange={(e) =>
                    handleQuestionChange(idx, "text", e.target.value)
                  }
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {q.options.map((opt, i) => (
                    <Input
                      key={i}
                      type="text"
                      placeholder={`Option ${i + 1}`}
                      value={opt}
                      onChange={(e) =>
                        handleQuestionChange(idx, `option${i}`, e.target.value)
                      }
                    />
                  ))}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white">
                    Correct Option
                  </label>
                  <select
                    className="flex h-10 w-full rounded-md border border-[#169976] bg-[#000000] px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#1DCD9F]"
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
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Button onClick={addQuestion} variant="outline" className="gap-2">
          <Plus className="w-4 h-4" />
          Add Question
        </Button>
        <Button
          onClick={removeQuestion}
          disabled={questions.length <= 1}
          variant="destructive"
          className="gap-2"
        >
          <Minus className="w-4 h-4" />
          Remove Question
        </Button>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSubmit} size="lg" className="gap-2">
          <Save className="w-5 h-5" />
          Save Quiz
        </Button>
      </div>

      {/* Popups */}
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
