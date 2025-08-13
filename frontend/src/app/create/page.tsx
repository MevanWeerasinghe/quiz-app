"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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

  useEffect(() => {
    // capture current origin for link building (window is client-only)
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  useEffect(() => {
    const fetchQuizzes = async () => {
      if (!user) return;
      try {
        const res = await fetch(
          `http://localhost:5000/api/quizzes/user/${user.id}`
        );
        const data = await res.json();
        if (Array.isArray(data)) {
          setQuizzes(data);
        } else {
          console.error("Expected an array but got:", data);
          setQuizzes([]);
        }
      } catch (error) {
        console.error("Failed to load quizzes:", error);
      }
    };

    fetchQuizzes();
  }, [user]);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("Link copied!");
    } catch {
      alert("Failed to copy link");
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">Create a Quiz</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <Link href="/create/manual">
          <div className="cursor-pointer p-6 border rounded-lg hover:shadow-md transition">
            <h2 className="text-xl font-semibold mb-2">Manual Create</h2>
            <p className="text-gray-600">
              Build your quiz question by question.
            </p>
          </div>
        </Link>

        <Link href="/create/ai">
          <div className="cursor-pointer p-6 border rounded-lg hover:shadow-md transition">
            <h2 className="text-xl font-semibold mb-2">AI Generate</h2>
            <p className="text-gray-600">
              Let AI generate questions based on a topic.
            </p>
          </div>
        </Link>
      </div>

      <h2 className="text-2xl font-bold mb-4">Your Quizzes</h2>
      {quizzes.length === 0 ? (
        <p className="text-gray-500">You haven’t created any quizzes yet.</p>
      ) : (
        <ul className="space-y-4">
          {quizzes.map((quiz) => {
            const quizUrl = origin
              ? `${origin}/quiz/${quiz._id}`
              : `/quiz/${quiz._id}`;
            return (
              <li key={quiz._id} className="border p-4 rounded-lg">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold">{quiz.title}</h3>
                    <p className="text-sm text-gray-500">
                      Created on {new Date(quiz.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* View should open the preview+edit page */}
                    <Link
                      href={`/quiz/${quiz._id}/view`}
                      className="px-3 py-2 bg-gray-100 border rounded hover:bg-gray-200 text-sm"
                    >
                      View
                    </Link>

                    {/* Open should go to dashboard (submissions/stats) */}
                    <Link
                      href={`/quiz/${quiz._id}/dashboard`}
                      className="px-3 py-2 bg-blue-600 text-white rounded hover:opacity-90 text-sm"
                    >
                      Open
                    </Link>
                  </div>
                </div>

                {/* Share link + copy */}
                <div className="mt-3 flex items-center gap-2">
                  <input
                    className="w-full border rounded px-3 py-2 text-sm"
                    value={quizUrl}
                    readOnly
                  />
                  <button
                    onClick={() => handleCopy(quizUrl)}
                    className="px-3 py-2 bg-purple-600 text-white rounded text-sm hover:opacity-90"
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
