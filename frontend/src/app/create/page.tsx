"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";

interface Quiz {
  _id: string;
  title: string;
  createdAt: string;
}

export default function CreateQuizPage() {
  const { user } = useUser();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);

  useEffect(() => {
    const fetchQuizzes = async () => {
      if (!user) return;
      try {
        const res = await fetch(
          `http://localhost:5000/api/quizzes/user/${user.id}`
        );
        const data = await res.json();
        console.log("Raw quizzes data from backend:", data); // 🔍 DEBUG HERE

        if (Array.isArray(data)) {
          setQuizzes(data);
        } else {
          console.error("Expected an array but got:", data); // 🔍 DEBUG HERE
          setQuizzes([]);
        }
        //setQuizzes(data);
      } catch (error) {
        console.error("Failed to load quizzes:", error);
      }
    };

    fetchQuizzes();
  }, [user]);

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
          {quizzes.map((quiz) => (
            <li key={quiz._id} className="border p-4 rounded-lg">
              <h3 className="text-lg font-semibold">{quiz.title}</h3>
              <p className="text-sm text-gray-500">
                Created on {new Date(quiz.createdAt).toLocaleDateString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
