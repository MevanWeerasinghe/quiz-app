"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth, useClerk, useUser } from "@clerk/nextjs";
import Popup from "@/components/Popup";

type Question = {
  _id: string;
  text: string;
  options: string[];
  correctIndex: number;
  questionTime?: number;
};

type Quiz = {
  _id: string;
  title: string;
  questions: Question[];
  timeLimit: number;
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

  const [alreadySubmitted, setAlreadySubmitted] = useState<boolean | null>(
    null
  );
  const submittingRef = useRef(false);

  // NEW: popup + pending navigation
  const [navPopupOpen, setNavPopupOpen] = useState(false);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      redirectToSignIn({ redirectUrl: `/quiz/${quizId}` });
    }
  }, [isLoaded, isSignedIn, quizId, redirectToSignIn]);

  // Fetch quiz
  useEffect(() => {
    const fetchQuizAndProbe = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/quizzes/${quizId}`);
        const data = await res.json();

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
          timingMode: data.timingMode || "whole-quiz",
        };

        setQuiz(normalized);
        setAnswers(Array(questions.length).fill(null));

        if (normalized.timingMode === "whole-quiz") {
          setTimeLeft((normalized.timeLimit || 0) * 60);
        } else {
          setTimeLeft(questions[0]?.questionTime ?? 60);
        }

        if (user?.id) {
          const probe = await fetch(
            `http://localhost:5000/api/submissions/quiz/${quizId}/has-submitted?userId=${encodeURIComponent(
              user.id
            )}`
          );
          const payload = await probe.json();
          setAlreadySubmitted(Boolean(payload?.submitted));
        }
      } catch (err) {
        console.error("Failed to fetch quiz/probe:", err);
      }
    };

    if (isLoaded && isSignedIn) fetchQuizAndProbe();
  }, [quizId, isLoaded, isSignedIn, user?.id]);

  // Build payload
  const buildPayload = useCallback(() => {
    if (!quiz || !user) return null;
    return {
      quizId: quiz._id,
      userId: user.id,
      userEmail: user.emailAddresses?.[0]?.emailAddress,
      answers: quiz.questions.map((q, idx) => ({
        questionId: q._id,
        selectedIndex: answers[idx],
      })),
    };
  }, [quiz, user, answers]);

  const submitWithBeacon = useCallback(() => {
    try {
      const payload = buildPayload();
      if (!payload) return;
      const blob = new Blob([JSON.stringify(payload)], {
        type: "application/json",
      });
      navigator.sendBeacon("http://localhost:5000/api/submissions", blob);
    } catch (e) {
      console.error("beacon submit failed:", e);
    }
  }, [buildPayload]);

  // Safe submit
  const safeSubmit = useCallback(
    async (reason: "manual" | "timeout" | "navigate", useBeacon = false) => {
      if (!quiz || !user) return;
      if (isSubmitted || submittingRef.current) return;

      submittingRef.current = true;
      setSubmitErr(null);

      // For navigation/timeouts → beacon only, don’t show final screen
      if (reason !== "manual") {
        if (useBeacon && "sendBeacon" in navigator) {
          submitWithBeacon();
        } else {
          try {
            const payload = buildPayload();
            if (payload) {
              await fetch("http://localhost:5000/api/submissions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
              });
            }
          } catch (err) {
            console.error("non-manual submit failed:", err);
          }
        }
        submittingRef.current = false;
        return;
      }

      // Manual submission → normal final page flow
      setIsSubmitted(true);
      try {
        const payload = buildPayload();
        if (!payload) return;

        const res = await fetch("http://localhost:5000/api/submissions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) {
          setSubmitErr(data?.message || "Submission failed");
          return;
        }

        setScore(data.score ?? 0);
      } catch (err: any) {
        setSubmitErr(err.message || "Failed to submit quiz.");
      } finally {
        submittingRef.current = false;
      }
    },
    [quiz, user, isSubmitted, buildPayload, submitWithBeacon]
  );

  // Timer
  useEffect(() => {
    if (!started || !quiz || timeLeft <= 0 || isSubmitted) return;

    const t = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(t);
          if (quiz.timingMode === "whole-quiz") {
            safeSubmit("timeout", true);
          } else {
            const last = currentIndex >= quiz.questions.length - 1;
            if (last) safeSubmit("timeout", true);
            else {
              const next = currentIndex + 1;
              setCurrentIndex(next);
              setTimeLeft(quiz.questions[next]?.questionTime ?? 60);
            }
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(t);
  }, [started, quiz, timeLeft, isSubmitted, currentIndex, safeSubmit]);

  // Refresh
  useEffect(() => {
    if (!started || isSubmitted || !quiz) return;

    const beforeUnload = (e: BeforeUnloadEvent) => {
      safeSubmit("navigate", true);
      e.preventDefault();
      e.returnValue =
        "If you reload, your current progress will be submitted automatically.";
    };

    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [started, isSubmitted, quiz, safeSubmit]);

  // Back button
  useEffect(() => {
    if (!started || isSubmitted || !quiz) return;
    const onPopState = () => safeSubmit("navigate", true);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [started, isSubmitted, quiz, safeSubmit]);

  // Internal navigation
  useEffect(() => {
    if (!started || isSubmitted || !quiz) return;

    const onClickCapture = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const a = target.closest("a") as HTMLAnchorElement | null;
      if (!a) return;

      const href = a.getAttribute("href");
      if (!href || href.startsWith("#") || a.target === "_blank") return;

      const url = new URL(href, window.location.origin);
      if (url.origin !== window.location.origin) return;

      if (url.pathname !== window.location.pathname) {
        e.preventDefault();
        setPendingUrl(url.href);
        setNavPopupOpen(true);
      }
    };

    document.addEventListener("click", onClickCapture, true);
    return () => document.removeEventListener("click", onClickCapture, true);
  }, [started, isSubmitted, quiz]);

  // UI Helpers
  const question = quiz?.questions[currentIndex];
  const handleOptionSelect = (idx: number) => {
    const updated = [...answers];
    updated[currentIndex] = idx;
    setAnswers(updated);
  };
  const handlePrev = () => {
    if (!quiz || !quiz.allowBack || currentIndex === 0) return;
    setCurrentIndex(currentIndex - 1);
    if (quiz.timingMode === "per-question")
      setTimeLeft(quiz.questions[currentIndex - 1]?.questionTime ?? 60);
  };
  const handleNext = () => {
    if (!quiz || currentIndex >= quiz.questions.length - 1) return;
    setCurrentIndex(currentIndex + 1);
    if (quiz.timingMode === "per-question")
      setTimeLeft(quiz.questions[currentIndex + 1]?.questionTime ?? 60);
  };
  const handleSubmit = () => safeSubmit("manual");

  // ---- UI ----
  if (!isLoaded)
    return <div className="p-6 text-white bg-[#000000]">Loading...</div>;
  if (!isSignedIn) return null;
  if (!quiz)
    return <div className="p-6 text-white bg-[#000000]">Loading quiz...</div>;

  // Start screen
  if (!started && !isSubmitted) {
    const blocked = alreadySubmitted === true;
    return (
      <div className="max-w-2xl mx-auto py-10 px-4 bg-[#000000]">
        <div className="border border-[#169976] bg-[#222222] rounded-lg p-6">
          <h1 className="text-3xl font-bold mb-2 text-white">{quiz.title}</h1>
          {blocked ? (
            <>
              <p className="text-white/90 mb-4">
                You’ve already completed this quiz.
              </p>
              <button
                onClick={() => router.push(`/`)}
                className="bg-[#1DCD9F] text-black px-6 py-3 rounded"
              >
                Go to Home
              </button>
            </>
          ) : (
            <>
              <ul className="text-white/80 mb-6">
                <li>Questions: {quiz.questions.length}</li>
                {quiz.timingMode === "whole-quiz" ? (
                  <li>Time limit: {quiz.timeLimit} min</li>
                ) : (
                  <li>Per-question timing</li>
                )}
                <li>{quiz.allowBack ? "Back allowed" : "Back not allowed"}</li>
                <li>
                  If you refresh, go back, or navigate away, your progress will
                  be auto-submitted. Unanswered count as wrong.
                </li>
              </ul>
              <button
                onClick={() => setStarted(true)}
                className="bg-[#1DCD9F] text-black px-6 py-3 rounded"
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
      <div className="max-w-2xl mx-auto p-6 text-center bg-[#000000]">
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
          {submitErr && <p className="mt-3 text-red-400">{submitErr}</p>}
          <button
            onClick={() => router.push(`/`)}
            className="bg-[#1DCD9F] text-black px-6 py-3 rounded"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  // In-quiz UI
  return (
    <div className="max-w-3xl mx-auto p-6 bg-[#000000]">
      {/* Header */}
      <div className="flex justify-between mb-4 text-white">
        <h1 className="text-2xl font-bold">{quiz.title}</h1>
        <div>
          Time Left:{" "}
          <span className="text-[#1DCD9F]">
            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
          </span>
        </div>
      </div>

      {/* Question */}
      <div className="mb-6 border border-[#169976] bg-[#222222] rounded p-5">
        <p className="text-lg font-medium mb-4 text-white">
          {currentIndex + 1}. {question?.text}
        </p>
        <div className="space-y-3">
          {question?.options.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => handleOptionSelect(idx)}
              className={[
                "w-full text-left px-4 py-2 rounded border",
                answers[currentIndex] === idx
                  ? "bg-[#1DCD9F] text-black"
                  : "bg-black border-[#169976] text-white hover:bg-[#222222]",
              ].join(" ")}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Nav buttons */}
      <div className="flex justify-between">
        <button
          onClick={handlePrev}
          disabled={!quiz.allowBack || currentIndex === 0}
          className="px-4 py-2 border border-[#169976] text-white rounded disabled:opacity-50"
        >
          Previous
        </button>
        {currentIndex === quiz.questions.length - 1 ? (
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-[#1DCD9F] text-black rounded"
          >
            Submit
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="px-4 py-2 bg-[#1DCD9F] text-black rounded"
          >
            Next
          </button>
        )}
      </div>

      {/* Popup confirm navigation */}
      <Popup
        open={navPopupOpen}
        onClose={() => setNavPopupOpen(false)}
        title="Leaving Quiz"
        message="If you navigate away, your current progress will be submitted automatically."
        buttons={[
          { label: "Cancel", onClick: () => setNavPopupOpen(false) },
          {
            label: "Proceed",
            color: "primary",
            onClick: async () => {
              await safeSubmit("navigate");
              if (pendingUrl) window.location.href = pendingUrl;
            },
          },
        ]}
      />
    </div>
  );
}
