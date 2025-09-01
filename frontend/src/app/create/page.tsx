"use client";

import Link from "next/link";
import QuizList from "@/components/QuizList";

export default function CreateQuizPage() {
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

      {/* Reusable list with search */}
      <QuizList heading="Your Quizzes" />
    </div>
  );
}
