"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import Popup from "@/components/Popup";

type Quiz = {
  _id: string;
  title: string;
  createdAt: string;
};

export default function QuizList({
  heading = "Your Quizzes",
}: {
  heading?: string;
}) {
  const { user } = useUser();

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [origin, setOrigin] = useState<string>("");
  const [search, setSearch] = useState("");

  // track copied state per quiz id (to show copied icon & disable temporarily)
  const [copiedMap, setCopiedMap] = useState<Record<string, boolean>>({});

  // popup state
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupCfg, setPopupCfg] = useState<{
    title?: string;
    message?: React.ReactNode;
    buttons?: {
      label: string;
      color?: "primary" | "danger" | "neutral";
      onClick: () => void;
      autoClose?: boolean;
    }[];
  }>({});

  useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin);
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

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  const handleCopy = async (quizId: string, link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedMap((prev) => ({ ...prev, [quizId]: true }));
      setTimeout(() => {
        setCopiedMap((prev) => {
          const cp = { ...prev };
          delete cp[quizId];
          return cp;
        });
      }, 2 * 1000); // 2 seconds
    } catch {
      console.error("Failed to copy link");
    }
  };

  const confirmDelete = (quizId: string, quizTitle: string) => {
    setPopupCfg({
      title: "Delete Quiz?",
      message: (
        <div className="text-white/90">
          You are about to delete{" "}
          <span className="font-semibold">{quizTitle}</span>. This will remove
          the quiz and its questions.
        </div>
      ),
      buttons: [
        { label: "Cancel", color: "neutral", onClick: () => {} },
        {
          label: "Delete",
          color: "danger",
          onClick: async () => {
            try {
              const res = await fetch(
                `http://localhost:5000/api/quizzes/${quizId}`,
                { method: "DELETE" }
              );
              if (!res.ok) throw new Error("Failed to delete");
              setQuizzes((prev) => prev.filter((q) => q._id !== quizId));
            } catch (err) {
              console.error(err);
              setPopupCfg({
                title: "Delete failed",
                message: "Something went wrong while deleting the quiz.",
                buttons: [
                  { label: "Close", color: "neutral", onClick: () => {} },
                ],
              });
              setPopupOpen(true);
            }
          },
        },
      ],
    });
    setPopupOpen(true);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-white">{heading}</h2>

      {/* Search (inside component) */}
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
            const isCopied = copiedMap[quiz._id];
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
                    <Link
                      href={`/quiz/${quiz._id}/view`}
                      className="px-3 py-2 text-sm rounded border border-[#1DCD9F] text-[#1DCD9F] hover:bg-[#000000] transition"
                    >
                      View
                    </Link>

                    <Link
                      href={`/quiz/${quiz._id}/dashboard`}
                      className="px-3 py-2 text-sm rounded bg-[#1DCD9F] text-[#000000] hover:bg-[#169976] transition"
                    >
                      Open
                    </Link>

                    <button
                      onClick={() => confirmDelete(quiz._id, quiz.title)}
                      className="px-3 py-2 text-sm rounded border border-red-500 text-red-500 hover:bg-[#000000] transition"
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
                    onClick={() => !isCopied && handleCopy(quiz._id, quizUrl)}
                    disabled={isCopied}
                    className={`px-3 py-2 text-sm rounded bg-[#1DCD9F] text-[#000000] transition flex items-center justify-center ${
                      isCopied
                        ? "opacity-70 cursor-not-allowed"
                        : "hover:bg-[#169976]"
                    }`}
                    aria-label="Copy link"
                    title={isCopied ? "Copied" : "Copy link"}
                  >
                    <img
                      src={isCopied ? "/copied.png" : "/copy-link.png"}
                      alt={isCopied ? "Copied" : "Copy"}
                      className="w-5 h-5"
                    />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Reusable confirmation popup */}
      <Popup
        open={popupOpen}
        onClose={() => setPopupOpen(false)}
        title={popupCfg.title}
        message={popupCfg.message}
        buttons={popupCfg.buttons}
        widthClass="max-w-md w-full"
      />
    </div>
  );
}
