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
    <div className="max-w-xl mx-auto py-10 px-4 bg-[#000000] min-h-[calc(100vh-64px)]">
      <div className="border border-[#169976] rounded-xl bg-[#222222] p-6 shadow-lg">
        <h1 className="text-2xl font-bold mb-3 text-white">Answer a Quiz</h1>
        <p className="text-white/80 mb-5">
          Paste a quiz link (e.g.,{" "}
          <code className="text-white/90">https://yourapp.com/quiz/123</code>)
          or just the quiz ID.
        </p>

        <div className="flex gap-2">
          <input
            className="flex-1 border border-[#169976] rounded-lg px-3 py-2 bg-[#000000] text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#1DCD9F]"
            placeholder="Paste link or ID..."
            value={link}
            onChange={(e) => setLink(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") goToQuiz();
            }}
          />
          <button
            onClick={goToQuiz}
            className="px-5 py-2 rounded-lg bg-[#1DCD9F] text-[#000000] font-medium hover:bg-[#169976] transition disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Loading..." : "Enter"}
          </button>
        </div>
      </div>
    </div>
  );
}
