"use client";

import QuizList from "@/components/QuizList";

export default function MyQuizzesPage() {
  return (
    <div className="max-w-4xl mx-auto py-10 px-4 bg-[#000000] min-h-[calc(100vh-64px)]">
      <h1 className="text-3xl font-bold mb-6 text-white">My Quizzes</h1>
      <QuizList heading="Copy links & share" />
    </div>
  );
}
