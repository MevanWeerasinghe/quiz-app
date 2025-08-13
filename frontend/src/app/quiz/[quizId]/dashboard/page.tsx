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

  if (loading) return <div className="p-6">Loading...</div>;

  if (!isOwner) {
    return (
      <div className="max-w-3xl mx-auto py-10 px-4">
        <h1 className="text-2xl font-bold mb-2">{title} — Dashboard</h1>
        <p className="text-gray-700 mb-6">
          You are not authorized to view this dashboard.
        </p>
        <Link href="/" className="px-4 py-2 bg-purple-600 text-white rounded">
          Go Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{title} — Dashboard</h1>
        <div className="flex gap-2">
          <Link
            href={`/quiz/${quizId}`}
            className="px-3 py-2 rounded bg-purple-600 text-white hover:opacity-90 text-sm"
          >
            Open Quiz
          </Link>
          <Link
            href={`/quiz/${quizId}/view`}
            className="px-3 py-2 rounded border bg-gray-50 hover:bg-gray-100 text-sm"
          >
            View / Edit
          </Link>
        </div>
      </div>

      {loadErr && <div className="mb-4 text-red-600">{loadErr}</div>}

      {/* Simple stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="border rounded p-4 bg-white">
          <div className="text-sm text-gray-500">Total Submissions</div>
          <div className="text-2xl font-semibold">
            {summary?.totalSubmissions ?? 0}
          </div>
        </div>
        <div className="border rounded p-4 bg-white">
          <div className="text-sm text-gray-500">Most Correct</div>
          <div className="text-base">
            {summary?.mostCorrect
              ? `Q${(summary.mostCorrect.index ?? 0) + 1}`
              : "-"}
          </div>
        </div>
        <div className="border rounded p-4 bg-white">
          <div className="text-sm text-gray-500">Least Correct</div>
          <div className="text-base">
            {summary?.leastCorrect
              ? `Q${(summary.leastCorrect.index ?? 0) + 1}`
              : "-"}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3 border-b">Email</th>
              <th className="text-left p-3 border-b">Submitted</th>
              <th className="text-left p-3 border-b">Score</th>
              <th className="text-left p-3 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((s) => (
              <tr key={s._id} className="odd:bg-white even:bg-gray-50">
                <td className="p-3 border-b">{s.userEmail || s.userId}</td>
                <td className="p-3 border-b">
                  {new Date(s.submittedAt).toLocaleString()}
                </td>
                <td className="p-3 border-b">{s.score}</td>
                <td className="p-3 border-b">
                  <button
                    className="px-3 py-2 bg-blue-600 text-white rounded hover:opacity-90"
                    onClick={() => setOpenSubmission(s)}
                  >
                    View answers
                  </button>
                </td>
              </tr>
            ))}
            {submissions.length === 0 && (
              <tr>
                <td className="p-3" colSpan={4}>
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
          className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
          onClick={() => setOpenSubmission(null)} // close on outside click
        >
          <div
            className="bg-white rounded-xl shadow-lg w-full max-w-4xl max-h-[80vh] overflow-auto p-6 relative"
            onClick={(e) => e.stopPropagation()} // prevent backdrop close on content click
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold">
                  Answer Sheet —{" "}
                  {openSubmission.userEmail || openSubmission.userId}
                </h2>
                <p className="text-sm text-gray-600">
                  Submitted:{" "}
                  {new Date(openSubmission.submittedAt).toLocaleString()} •
                  Score:{" "}
                  <span className="font-semibold">{openSubmission.score}</span>
                </p>
              </div>
              <button
                className="px-3 py-1.5 rounded border bg-gray-50 hover:bg-gray-100 text-sm"
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
                  <div key={idx} className="border rounded p-3">
                    <div className="font-medium mb-1">
                      {idx + 1}. {q.text}
                    </div>
                    <ul className="ml-5 list-disc">
                      {q.options.map((opt: string, i: number) => {
                        const sel = a.selectedIndex === i;
                        const corr = q.correctIndex === i;
                        return (
                          <li
                            key={i}
                            className={
                              corr
                                ? "text-green-700"
                                : sel && !corr
                                ? "text-red-600"
                                : ""
                            }
                          >
                            {opt}
                            {corr && " (correct)"}
                            {sel && !corr && " (your choice)"}
                          </li>
                        );
                      })}
                    </ul>
                    <div className="mt-1 text-sm">
                      Result: {isCorrect ? "✔ Correct" : "✖ Wrong"}
                    </div>
                  </div>
                );
              })}
              {openSubmission.answers.length === 0 && (
                <div className="text-sm text-gray-600">
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
