"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth, useClerk, useUser } from "@clerk/nextjs";

type Question = {
  _id: string;
  text: string;
  options: string[];
  correctIndex: number;
  questionTime?: number; // seconds (used when timingMode === 'per-question')
};

type Quiz = {
  _id: string;
  title: string;
  questions: Question[];
  timeLimit: number; // minutes (used when timingMode === 'whole-quiz')
  allowBack: boolean;
  showResult: boolean;
  timingMode: "whole-quiz" | "per-question";
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

  // block second attempt at start screen
  const [alreadySubmitted, setAlreadySubmitted] = useState<boolean | null>(
    null
  );

  // ---- NEW: re-entrancy guard to prevent double submit on timeout ----
  const submittingRef = useRef(false);

  // Redirect loop fix: wait for Clerk to load
  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      redirectToSignIn({ redirectUrl: `/quiz/${quizId}` });
    }
  }, [isLoaded, isSignedIn, quizId, redirectToSignIn]);

  // Fetch quiz after authenticated (+ probe one-attempt)
  useEffect(() => {
    const fetchQuizAndProbe = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/quizzes/${quizId}`);
        const data = await res.json();

        const timingMode: "whole-quiz" | "per-question" =
          data.timingMode || "whole-quiz";
        const questions: Question[] = Array.isArray(data.questions)
          ? data.questions.map((q: any) => ({
              _id: q._id,
              text: q.text,
              options: q.options,
              correctIndex: q.correctIndex,
              questionTime:
                typeof q.questionTime === "number" ? q.questionTime : 60,
            }))
          : [];

        const normalized: Quiz = {
          _id: data._id,
          title: data.title,
          questions,
          timeLimit: data.timeLimit ?? 0,
          allowBack: data.allowBack ?? true,
          showResult: data.showResult ?? true,
          timingMode,
        };

        setQuiz(normalized);
        setAnswers(Array(questions.length).fill(null));

        if (timingMode === "whole-quiz") {
          setTimeLeft((normalized.timeLimit || 0) * 60);
        } else {
          const first = questions[0];
          setTimeLeft(first?.questionTime ?? 60);
        }

        // probe if this user already submitted
        if (user?.id) {
          const probe = await fetch(
            `http://localhost:5000/api/submissions/quiz/${quizId}/has-submitted?userId=${encodeURIComponent(
              user.id
            )}`
          );
          const payload = await probe.json();
          setAlreadySubmitted(Boolean(payload?.submitted));
        } else {
          setAlreadySubmitted(false);
        }
      } catch (err) {
        console.error("Failed to fetch quiz/probe:", err);
      }
    };

    if (isLoaded && isSignedIn) fetchQuizAndProbe();
  }, [quizId, isLoaded, isSignedIn, user?.id]);

  // ---- NEW: single-safe submit function (guards against double submit) ----
  const safeSubmit = useCallback(
    async (reason: "manual" | "timeout") => {
      if (!quiz || !user) return;
      if (isSubmitted || submittingRef.current) return;

      // prevent any further submissions immediately
      submittingRef.current = true;
      setIsSubmitted(true);
      setSubmitErr(null);

      try {
        const payload = {
          quizId: quiz._id,
          userId: user.id,
          userEmail: user.emailAddresses?.[0]?.emailAddress,
          answers: quiz.questions.map((q, idx) => ({
            questionId: q._id,
            selectedIndex: answers[idx],
          })),
        };

        const res = await fetch("http://localhost:5000/api/submissions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (!res.ok) {
          // graceful handling for one-attempt rule or other errors
          if (res.status === 400 && data?.message) {
            setSubmitErr(data.message);
          } else {
            setSubmitErr(data?.message || "Submission failed");
          }
          return;
        }

        setScore(data.score ?? 0);
      } catch (err: any) {
        console.error(err);
        setSubmitErr(err.message || "Failed to submit quiz.");
      } finally {
        // keep isSubmitted = true; just unlock the ref to avoid blocking future navigations if needed
        submittingRef.current = false;
      }
    },
    [quiz, user, answers, isSubmitted]
  );

  // Timer
  useEffect(() => {
    if (!started || !quiz || timeLeft <= 0 || isSubmitted) return;

    const t = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(t);
          // On timeout, submit only once via the guarded function
          if (quiz.timingMode === "whole-quiz") {
            safeSubmit("timeout");
          } else {
            const last = currentIndex >= quiz.questions.length - 1;
            if (last) {
              safeSubmit("timeout");
            } else {
              const nextIndex = currentIndex + 1;
              setCurrentIndex(nextIndex);
              const q = quiz.questions[nextIndex];
              setTimeLeft(
                typeof q?.questionTime === "number" ? q.questionTime! : 60
              );
            }
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(t);
  }, [started, quiz, timeLeft, isSubmitted, currentIndex, safeSubmit]);

  const question = quiz?.questions[currentIndex];

  const handleOptionSelect = (idx: number) => {
    const updated = [...answers];
    updated[currentIndex] = idx;
    setAnswers(updated);
  };

  const resetPerQuestionClock = (index: number) => {
    if (!quiz || quiz.timingMode !== "per-question") return;
    const q = quiz.questions[index];
    setTimeLeft(typeof q?.questionTime === "number" ? q.questionTime! : 60);
  };

  const handlePrev = () => {
    if (!quiz) return;
    if (!quiz.allowBack) return;
    if (currentIndex > 0) {
      const next = currentIndex - 1;
      setCurrentIndex(next);
      resetPerQuestionClock(next);
    }
  };

  const handleNext = () => {
    if (!quiz) return;
    if (currentIndex < quiz.questions.length - 1) {
      const next = currentIndex + 1;
      setCurrentIndex(next);
      resetPerQuestionClock(next);
    }
  };

  // manual submit uses the same guarded function
  const handleSubmit = () => safeSubmit("manual");

  if (!isLoaded)
    return (
      <div className="p-6 text-white bg-[#000000] min-h-[calc(100vh-64px)]">
        Loading...
      </div>
    );
  if (!isSignedIn) return null;
  if (!quiz)
    return (
      <div className="p-6 text-white bg-[#000000] min-h-[calc(100vh-64px)]">
        Loading quiz...
      </div>
    );

  // Start screen (blocks if already submitted)
  if (!started && !isSubmitted) {
    const blocked = alreadySubmitted === true;
    return (
      <div className="max-w-2xl mx-auto py-10 px-4 bg-[#000000] min-h-[calc(100vh-64px)]">
        <div className="border border-[#169976] bg-[#222222] rounded-lg p-6">
          <h1 className="text-3xl font-bold mb-2 text-white">{quiz.title}</h1>

          {blocked ? (
            <>
              <p className="text-white/90 mb-4">
                You’ve already completed this quiz. Your answers have been
                saved.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => router.push(`/`)}
                  className="bg-[#1DCD9F] text-[#000000] px-6 py-3 rounded font-medium hover:bg-[#169976] transition"
                >
                  Go to Home
                </button>
              </div>
            </>
          ) : (
            <>
              <ul className="text-white/80 mb-6">
                <li>Questions: {quiz.questions.length}</li>
                {quiz.timingMode === "whole-quiz" ? (
                  <li>Time limit: {quiz.timeLimit} min (whole quiz)</li>
                ) : (
                  <li>
                    Timing: per question (each question has its own timer)
                  </li>
                )}
                <li>{quiz.allowBack ? "Back allowed" : "Back not allowed"}</li>
                <li>
                  {quiz.showResult
                    ? "Result shown after submit"
                    : "Result hidden"}
                </li>
              </ul>
              <button
                onClick={() => setStarted(true)}
                className="bg-[#1DCD9F] text-[#000000] px-6 py-3 rounded font-medium hover:bg-[#169976] transition"
              >
                Start Quiz
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // Completion screen
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

  // In-quiz UI
  return (
    <div className="max-w-3xl mx-auto p-6 bg-[#000000] min-h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-white">{quiz.title}</h1>
        <div className="text-lg font-semibold text-white">
          Time Left:{" "}
          <span className="text-[#1DCD9F]">
            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
          </span>
          {quiz.timingMode === "per-question" && (
            <span className="text-white/60 text-sm ml-2">
              (Q{currentIndex + 1})
            </span>
          )}
        </div>
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
