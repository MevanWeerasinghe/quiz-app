"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AnswerLandingPage() {
  const router = useRouter();
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);

  const extractQuizId = (url: string) => {
    try {
      if (!url) return null;
      if (/^[a-f0-9]{24}$/i.test(url)) return url; // raw ObjectId
      const u = new URL(url);
      const parts = u.pathname.split("/").filter(Boolean);
      const idx = parts.findIndex((p) => p === "quiz");
      if (idx !== -1 && parts[idx + 1]) return parts[idx + 1];
      return null;
    } catch {
      return null;
    }
  };

  const goToQuiz = async () => {
    const id = extractQuizId(link.trim());
    if (!id) {
      alert("Please paste a valid quiz link or ID.");
      return;
    }
    setLoading(true);
    // No intermediate modal — go directly to the quiz info/start page
    router.push(`/quiz/${id}`);
  };

  return (
    <div className="max-w-xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-4">Answer a Quiz</h1>
      <p className="text-gray-600 mb-4">
        Paste a quiz link (e.g., <code>https://yourapp.com/quiz/123</code>) or
        just the quiz ID.
      </p>

      <div className="flex gap-2">
        <input
          className="flex-1 border rounded px-3 py-2"
          placeholder="Paste link or ID..."
          value={link}
          onChange={(e) => setLink(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") goToQuiz();
          }}
        />
        <button
          onClick={goToQuiz}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:opacity-90"
          disabled={loading}
        >
          {loading ? "Loading..." : "Enter"}
        </button>
      </div>
    </div>
  );
}
