"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useUser } from "@clerk/nextjs";

interface Quiz {
  _id: string;
  title: string;
  createdAt: string;
}

export default function CreateQuizPage() {
  const { user } = useUser();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [origin, setOrigin] = useState<string>("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    // capture current origin for link building (window is client-only)
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const fetchQuizzes = useCallback(async () => {
    if (!user) return;
    try {
      const query = search ? `?search=${encodeURIComponent(search)}` : "";
      const res = await fetch(
        `http://localhost:5000/api/quizzes/user/${user.id}${query}`
      );
      const data = await res.json();
      setQuizzes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load quizzes:", error);
    }
  }, [user, search]);

  // Initial load
  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("Link copied!");
    } catch {
      alert("Failed to copy link");
    }
  };

  const handleDelete = async (quizId: string) => {
    if (!confirm("Are you sure you want to delete this quiz?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/quizzes/${quizId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      setQuizzes((prev) => prev.filter((q) => q._id !== quizId));
    } catch (err) {
      console.error(err);
      alert("Delete failed");
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 bg-[#000000] min-h-[calc(100vh-64px)]">
      <h1 className="text-3xl font-bold mb-6 text-white">Create a Quiz</h1>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <Link href="/create/manual">
          <div className="cursor-pointer p-6 rounded-lg border border-[#169976] bg-[#222222] hover:border-[#1DCD9F] hover:shadow-[0_0_0_2px_rgba(29,205,159,0.25)] transition">
            <h2 className="text-xl font-semibold mb-2 text-white">
              Manual Create
            </h2>
            <p className="text-white/70">
              Build your quiz question by question.
            </p>
          </div>
        </Link>

        <Link href="/create/ai">
          <div className="cursor-pointer p-6 rounded-lg border border-[#169976] bg-[#222222] hover:border-[#1DCD9F] hover:shadow-[0_0_0_2px_rgba(29,205,159,0.25)] transition">
            <h2 className="text-xl font-semibold mb-2 text-white">
              AI Generate
            </h2>
            <p className="text-white/70">
              Let AI generate questions based on a topic.
            </p>
          </div>
        </Link>
      </div>

      <h2 className="text-2xl font-bold mb-4 text-white">Your Quizzes</h2>

      {/* Search bar (live) */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="Search quizzes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") fetchQuizzes();
            }}
            className="w-full rounded px-3 py-2 text-white placeholder-white/50 bg-[#000000] border border-[#169976] focus:outline-none focus:ring-2 focus:ring-[#1DCD9F]"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition"
              aria-label="Clear search"
              title="Clear"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {quizzes.length === 0 ? (
        <p className="text-white/70">You haven’t created any quizzes yet.</p>
      ) : (
        <ul className="space-y-4">
          {quizzes.map((quiz) => {
            const quizUrl = origin
              ? `${origin}/quiz/${quiz._id}`
              : `/quiz/${quiz._id}`;
            return (
              <li
                key={quiz._id}
                className="p-4 rounded-lg border border-[#169976] bg-[#222222]"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {quiz.title}
                    </h3>
                    <p className="text-sm text-white/60">
                      Created on {new Date(quiz.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* View should open the preview+edit page */}
                    <Link
                      href={`/quiz/${quiz._id}/view`}
                      className="px-3 py-2 text-sm rounded border border-[#1DCD9F] text-[#1DCD9F] hover:bg-[#000000] transition"
                    >
                      View
                    </Link>

                    {/* Open should go to dashboard (submissions/stats) */}
                    <Link
                      href={`/quiz/${quiz._id}/dashboard`}
                      className="px-3 py-2 text-sm rounded bg-[#1DCD9F] text-[#000000] hover:bg-[#169976] transition"
                    >
                      Open
                    </Link>

                    <button
                      onClick={() => handleDelete(quiz._id)}
                      className="px-3 py-2 text-sm rounded border border-[#1DCD9F] text-[#1DCD9F] hover:bg-[#000000] transition"
                      title="Delete quiz"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Share link + copy */}
                <div className="mt-3 flex items-center gap-2">
                  <input
                    className="w-full rounded px-3 py-2 text-sm text-white bg-[#000000] border border-[#169976] focus:outline-none"
                    value={quizUrl}
                    readOnly
                  />
                  <button
                    onClick={() => handleCopy(quizUrl)}
                    className="px-3 py-2 text-sm rounded bg-[#1DCD9F] text-[#000000] hover:bg-[#169976] transition"
                  >
                    Copy Link
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
