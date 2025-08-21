"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";

type AnswerRow = {
  questionId: {
    _id: string;
    text: string;
    options: string[];
    correctIndex: number;
  };
  selectedIndex: number | null;
};

type Submission = {
  _id: string;
  userId: string; // Clerk id
  userEmail?: string;
  score: number;
  submittedAt: string;
  answers: AnswerRow[];
};

type Summary = {
  totalSubmissions: number;
  correctCounts: number[];
  mostCorrect: { index: number; questionId: string } | null;
  leastCorrect: { index: number; questionId: string } | null;
};

type QuizHead = {
  _id: string;
  title: string;
  creator: string; // Clerk user id string
};

export default function QuizDashboardPage() {
  const { quizId } = useParams<{ quizId: string }>();
  const { user } = useUser();

  const [title, setTitle] = useState<string>("");
  const [creator, setCreator] = useState<string>("");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const [openSubmission, setOpenSubmission] = useState<Submission | null>(null);

  const isOwner = useMemo(
    () => Boolean(user?.id && creator && user?.id === creator),
    [user?.id, creator]
  );

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setLoadErr(null);
      try {
        // Quiz head
        const qRes = await fetch(`http://localhost:5000/api/quizzes/${quizId}`);
        const qData: QuizHead = await qRes.json();
        setTitle(qData?.title || "Quiz");
        setCreator(qData?.creator || "");

        // Only owners can view submissions
        if (user?.id && qData?.creator && user.id === qData.creator) {
          const sRes = await fetch(
            `http://localhost:5000/api/submissions/quiz/${quizId}`
          );
          const sData = await sRes.json();
          setSubmissions(Array.isArray(sData) ? sData : []);

          const sumRes = await fetch(
            `http://localhost:5000/api/submissions/quiz/${quizId}/summary`
          );
          const sumData = await sumRes.json();
          setSummary(sumData);
        } else {
          setSubmissions([]);
          setSummary(null);
        }
      } catch (e: any) {
        console.error(e);
        setLoadErr(e?.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [quizId, user?.id]);

  if (loading)
    return (
      <div className="p-6 text-white bg-[#000000] min-h-[calc(100vh-64px)]">
        Loading...
      </div>
    );

  if (!isOwner) {
    return (
      <div className="max-w-3xl mx-auto py-10 px-4 bg-[#000000] min-h-[calc(100vh-64px)]">
        <div className="border border-[#169976] rounded-lg p-6 bg-[#222222]">
          <h1 className="text-2xl font-bold mb-2 text-white">
            {title} — Dashboard
          </h1>
          <p className="text-white/80 mb-6">
            You are not authorized to view this dashboard.
          </p>
          <Link
            href="/"
            className="inline-block px-4 py-2 rounded bg-[#1DCD9F] text-[#000000] font-medium hover:bg-[#169976] transition"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 bg-[#000000] min-h-[calc(100vh-64px)]">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">{title} — Dashboard</h1>
        <div className="flex gap-2">
          <Link
            href={`/quiz/${quizId}`}
            className="px-3 py-2 rounded bg-[#1DCD9F] text-[#000000] hover:bg-[#169976] transition text-sm font-medium"
          >
            Open Quiz
          </Link>
          <Link
            href={`/quiz/${quizId}/view`}
            className="px-3 py-2 rounded border border-[#169976] text-white hover:bg-[#000000] transition text-sm"
          >
            View / Edit
          </Link>
        </div>
      </div>

      {loadErr && (
        <div className="mb-4 text-white border border-[#169976] rounded px-3 py-2 bg-[#222222]">
          {loadErr}
        </div>
      )}

      {/* Simple stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="border border-[#169976] rounded p-4 bg-[#222222]">
          <div className="text-sm text-white/70">Total Submissions</div>
          <div className="text-2xl font-semibold text-white">
            {summary?.totalSubmissions ?? 0}
          </div>
        </div>
        <div className="border border-[#169976] rounded p-4 bg-[#222222]">
          <div className="text-sm text-white/70">Most Correct</div>
          <div className="text-base text-[#1DCD9F]">
            {summary?.mostCorrect
              ? `Q${(summary.mostCorrect.index ?? 0) + 1}`
              : "-"}
          </div>
        </div>
        <div className="border border-[#169976] rounded p-4 bg-[#222222]">
          <div className="text-sm text-white/70">Least Correct</div>
          <div className="text-base text-[#1DCD9F]">
            {summary?.leastCorrect
              ? `Q${(summary.leastCorrect.index ?? 0) + 1}`
              : "-"}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="border border-[#169976] rounded bg-[#222222] overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#000000]">
            <tr>
              <th className="text-left p-3 border-b border-[#169976] text-white">
                Email
              </th>
              <th className="text-left p-3 border-b border-[#169976] text-white">
                Submitted
              </th>
              <th className="text-left p-3 border-b border-[#169976] text-white">
                Score
              </th>
              <th className="text-left p-3 border-b border-[#169976] text-white">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((s, rowIdx) => (
              <tr
                key={s._id}
                className={rowIdx % 2 === 0 ? "bg-[#222222]" : "bg-[#000000]"}
              >
                <td className="p-3 border-b border-[#169976] text-white">
                  {s.userEmail || s.userId}
                </td>
                <td className="p-3 border-b border-[#169976] text-white/90">
                  {new Date(s.submittedAt).toLocaleString()}
                </td>
                <td className="p-3 border-b border-[#169976] text-[#1DCD9F] font-semibold">
                  {s.score}
                </td>
                <td className="p-3 border-b border-[#169976]">
                  <button
                    className="px-3 py-2 rounded bg-[#1DCD9F] text-[#000000] hover:bg-[#169976] transition"
                    onClick={() => setOpenSubmission(s)}
                  >
                    View answers
                  </button>
                </td>
              </tr>
            ))}
            {submissions.length === 0 && (
              <tr>
                <td className="p-3 text-white/80" colSpan={4}>
                  No submissions yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Answers Modal */}
      {openSubmission && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
          onClick={() => setOpenSubmission(null)} // close on outside click
        >
          <div
            className="bg-[#222222] border border-[#169976] rounded-2xl shadow-xl w-full max-w-5xl max-h-[85vh] overflow-auto p-6 relative"
            onClick={(e) => e.stopPropagation()} // prevent backdrop close on content click
          >
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Answer Sheet —{" "}
                  {openSubmission.userEmail || openSubmission.userId}
                </h2>
                <p className="text-sm text-white/70">
                  Submitted:{" "}
                  {new Date(openSubmission.submittedAt).toLocaleString()} •
                  Score:{" "}
                  <span className="font-semibold text-[#1DCD9F]">
                    {openSubmission.score}
                  </span>
                </p>
              </div>
              <button
                className="px-3 py-1.5 rounded border border-[#169976] text-white hover:bg-[#000000] transition text-sm"
                onClick={() => setOpenSubmission(null)}
              >
                Close
              </button>
            </div>

            <div className="space-y-3">
              {openSubmission.answers.map((a, idx) => {
                const q = a.questionId;
                const isCorrect =
                  typeof a.selectedIndex === "number" &&
                  a.selectedIndex === q.correctIndex;
                return (
                  <div
                    key={idx}
                    className="border border-[#169976] rounded p-4 bg-[#000000]"
                  >
                    <div className="font-medium mb-2 text-white">
                      {idx + 1}. {q.text}
                    </div>
                    <ul className="ml-5 list-disc">
                      {q.options.map((opt: string, i: number) => {
                        const sel = a.selectedIndex === i;
                        const corr = q.correctIndex === i;
                        let optionClass = "text-white/80"; // default style
                        if (corr) {
                          optionClass = "text-[#1DCD9F] font-semibold"; // correct answer → green
                        }
                        if (sel && !corr) {
                          optionClass = "text-red-400 font-semibold"; // wrong choice → red
                        }

                        return (
                          <li key={i} className={optionClass}>
                            {opt}
                            {corr && " (correct)"}
                            {sel && !corr && " (choosed)"}
                          </li>
                        );
                      })}
                    </ul>
                    <div className="mt-2 text-sm">
                      <span
                        className={
                          isCorrect
                            ? "text-[#1DCD9F] font-semibold"
                            : "text-red-400 font-semibold"
                        }
                      >
                        {isCorrect ? "✔ Correct" : "✖ Wrong"}
                      </span>
                    </div>
                  </div>
                );
              })}
              {openSubmission.answers.length === 0 && (
                <div className="text-sm text-white/70">
                  No answers recorded.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
