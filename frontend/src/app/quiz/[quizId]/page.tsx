"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth, useClerk, useUser } from "@clerk/nextjs";

type Question = {
  _id: string;
  text: string;
  options: string[];
  correctIndex: number;
};

type Quiz = {
  _id: string;
  title: string;
  questions: Question[];
  timeLimit: number; // minutes
  allowBack: boolean;
  showResult: boolean;
};

export default function QuizAnswerPage() {
  const { quizId } = useParams<{ quizId: string }>();
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const { redirectToSignIn } = useClerk();
  const { user } = useUser();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState<number>(0);
  const [submitErr, setSubmitErr] = useState<string | null>(null);

  // Redirect loop fix: wait for Clerk to load
  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      redirectToSignIn({ redirectUrl: `/quiz/${quizId}` });
    }
  }, [isLoaded, isSignedIn, quizId, redirectToSignIn]);

  // Fetch quiz after authenticated
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/quizzes/${quizId}`);
        const data = await res.json();
        setQuiz(data);
        setAnswers(Array(data.questions.length).fill(null));
        const seconds = (data.timeLimit || 0) * 60;
        setTimeLeft(seconds);
      } catch (err) {
        console.error("Failed to fetch quiz:", err);
      }
    };
    if (isLoaded && isSignedIn) fetchQuiz();
  }, [quizId, isLoaded, isSignedIn]);

  // Timer runs only after "Start"
  useEffect(() => {
    if (!started || !quiz || timeLeft <= 0 || isSubmitted) return;
    const t = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(t);
          handleSubmit(); // auto submit
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [started, quiz, timeLeft, isSubmitted]);

  const question = quiz?.questions[currentIndex];

  const handleOptionSelect = (idx: number) => {
    const updated = [...answers];
    updated[currentIndex] = idx;
    setAnswers(updated);
  };

  const handlePrev = () => {
    if (!quiz) return;
    if (!quiz.allowBack) return;
    if (currentIndex > 0) setCurrentIndex((p) => p - 1);
  };

  const handleNext = () => {
    if (!quiz) return;
    if (currentIndex < quiz.questions.length - 1) setCurrentIndex((p) => p + 1);
  };

  const handleSubmit = async () => {
    if (!quiz || !user || isSubmitted) return;
    setSubmitErr(null);
    try {
      const payload = {
        quizId: quiz._id,
        userId: user.id, // Clerk id string
        userEmail: user.emailAddresses?.[0]?.emailAddress,
        answers: quiz.questions.map((q, idx) => ({
          questionId: q._id,
          selectedIndex: answers[idx], // number | null
        })),
      };
      const res = await fetch("http://localhost:5000/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Submission failed");
      }

      setScore(data.score ?? 0);
      setIsSubmitted(true);
    } catch (err: any) {
      console.error(err);
      setSubmitErr(err.message || "Failed to submit quiz.");
      setIsSubmitted(true); // still move to completion screen to avoid being stuck
    }
  };

  if (!isLoaded)
    return (
      <div className="p-6 text-white bg-[#000000] min-h-[calc(100vh-64px)]">
        Loading...
      </div>
    );
  if (!isSignedIn) return null; // redirecting
  if (!quiz)
    return (
      <div className="p-6 text-white bg-[#000000] min-h-[calc(100vh-64px)]">
        Loading quiz...
      </div>
    );

  // Start modal (shown before answering)
  if (!started && !isSubmitted) {
    return (
      <div className="max-w-2xl mx-auto py-10 px-4 bg-[#000000] min-h-[calc(100vh-64px)]">
        <div className="border border-[#169976] bg-[#222222] rounded-lg p-6">
          <h1 className="text-3xl font-bold mb-2 text-white">{quiz.title}</h1>
          <ul className="text-white/80 mb-6">
            <li>Questions: {quiz.questions.length}</li>
            <li>Time limit: {quiz.timeLimit} min</li>
            <li>{quiz.allowBack ? "Back allowed" : "Back not allowed"}</li>
            <li>
              {quiz.showResult ? "Result shown after submit" : "Result hidden"}
            </li>
          </ul>
          <button
            onClick={() => setStarted(true)}
            className="bg-[#1DCD9F] text-[#000000] px-6 py-3 rounded font-medium hover:bg-[#169976] transition"
          >
            Start Quiz
          </button>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center bg-[#000000] min-h-[calc(100vh-64px)]">
        <div className="border border-[#169976] bg-[#222222] rounded-lg p-8">
          <h1 className="text-3xl font-bold mb-4 text-white">Quiz Completed</h1>
          {quiz.showResult ? (
            <p className="text-lg mb-2 text-white">
              Your score:{" "}
              <span className="font-bold text-[#1DCD9F]">{score}</span> /{" "}
              {quiz.questions.length}
            </p>
          ) : (
            <p className="text-lg mb-2 text-white">
              Your submission has been recorded.
            </p>
          )}
          {submitErr && (
            <p className="mt-3 text-white/90 border border-[#169976] rounded px-3 py-2 inline-block">
              {submitErr}
            </p>
          )}

          {/* Only navigate to Home for respondents. Dashboard is creator-only. */}
          <div className="mt-6">
            <button
              onClick={() => router.push(`/`)}
              className="bg-[#1DCD9F] text-[#000000] px-6 py-3 rounded-md font-medium hover:bg-[#169976] transition"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 bg-[#000000] min-h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-white">{quiz.title}</h1>
        {quiz.timeLimit > 0 && (
          <div className="text-lg font-semibold text-white">
            Time Left:{" "}
            <span className="text-[#1DCD9F]">
              {Math.floor(timeLeft / 60)}:
              {String(timeLeft % 60).padStart(2, "0")}
            </span>
          </div>
        )}
      </div>

      {/* Question Card */}
      <div className="mb-6 border border-[#169976] bg-[#222222] rounded-lg p-5">
        <p className="text-lg font-medium mb-4 text-white">
          {currentIndex + 1}. {question?.text}
        </p>

        <div className="space-y-3">
          {question?.options.map((opt, idx) => {
            const selected = answers[currentIndex] === idx;
            return (
              <button
                key={idx}
                onClick={() => handleOptionSelect(idx)}
                className={[
                  "w-full text-left px-4 py-2 rounded-md transition",
                  "border",
                  selected
                    ? "px-4 py-2 rounded-md bg-[#1DCD9F] text-[#000000] hover:bg-[#169976] transition"
                    : "bg-[#000000] border-[#169976] hover:bg-[#222222] text-white",
                ].join(" ")}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <button
          onClick={handlePrev}
          disabled={!quiz.allowBack || currentIndex === 0}
          className="px-4 py-2 rounded-md border border-[#169976] text-white disabled:opacity-50 hover:bg-[#000000] transition"
        >
          Previous
        </button>

        {currentIndex === quiz.questions.length - 1 ? (
          <button
            onClick={handleSubmit}
            className="px-4 py-2 rounded-md bg-[#1DCD9F] text-[#000000] hover:bg-[#169976] transition"
          >
            Submit
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="px-4 py-2 rounded-md bg-[#1DCD9F] text-[#000000] hover:bg-[#169976] transition"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}
