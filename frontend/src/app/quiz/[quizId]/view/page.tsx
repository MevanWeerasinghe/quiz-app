"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Question = {
  _id: string;
  text: string;
  options: string[];
  correctIndex: number;
};

type Quiz = {
  _id: string;
  title: string;
  allowBack: boolean;
  showResult: boolean;
  timeLimit: number;
  questions: Question[] | any[]; // tolerate ids briefly
};

export default function QuizViewPage() {
  const { quizId } = useParams<{ quizId: string }>();

  const [quiz, setQuiz] = useState<Quiz | null>(null);

  // metadata draft
  const [title, setTitle] = useState("");
  const [timeLimit, setTimeLimit] = useState<number>(5);
  const [allowBack, setAllowBack] = useState<boolean>(true);
  const [showResult, setShowResult] = useState<boolean>(true);
  const [savingMeta, setSavingMeta] = useState(false);

  // per-question editing drafts
  const [editing, setEditing] = useState<Record<string, Question>>({}); // questionId -> draft

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`http://localhost:5000/api/quizzes/${quizId}`);
      const data = await res.json();
      setQuiz(data);
      setTitle(data.title);
      setTimeLimit(data.timeLimit);
      setAllowBack(data.allowBack);
      setShowResult(data.showResult);
    };
    load();
  }, [quizId]);

  const saveMetadata = async () => {
    if (!quiz) return;
    setSavingMeta(true);
    try {
      const res = await fetch(`http://localhost:5000/api/quizzes/${quiz._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, timeLimit, allowBack, showResult }),
      });
      if (!res.ok) throw new Error("Failed to update quiz");
      const updated = await res.json();
      setQuiz(updated);
      alert("Quiz updated");
    } catch (err) {
      console.error(err);
      alert("Failed to update quiz");
    } finally {
      setSavingMeta(false);
    }
  };

  const startEdit = (q: Question) => {
    setEditing((prev) => ({ ...prev, [q._id]: { ...q } }));
  };

  const cancelEdit = (questionId: string) => {
    setEditing((prev) => {
      const cp = { ...prev };
      delete cp[questionId];
      return cp;
    });
  };

  const changeDraft = (
    questionId: string,
    field: "text" | "option" | "correctIndex",
    value: string | number,
    optionIndex?: number
  ) => {
    setEditing((prev) => {
      const draft = { ...(prev[questionId] as Question) };
      if (field === "text") draft.text = String(value);
      if (field === "correctIndex") draft.correctIndex = Number(value);
      if (field === "option" && typeof optionIndex === "number") {
        const opts = Array.isArray(draft.options) ? [...draft.options] : [];
        opts[optionIndex] = String(value);
        draft.options = opts;
      }
      return { ...prev, [questionId]: draft };
    });
  };

  const saveEdit = async (questionId: string) => {
    const draft = editing[questionId];
    if (!draft) return;

    if (!draft.text.trim()) return alert("Question text is required");
    if (!Array.isArray(draft.options) || draft.options.some((o) => !o?.trim()))
      return alert("All options required");
    if (draft.correctIndex < 0 || draft.correctIndex >= draft.options.length) {
      return alert("Correct option out of range");
    }

    try {
      const res = await fetch(
        `http://localhost:5000/api/quizzes/questions/${questionId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: draft.text,
            options: draft.options,
            correctIndex: draft.correctIndex,
          }),
        }
      );
      if (!res.ok) throw new Error("Update failed");
      const updated = await res.json();

      setQuiz((prev) => {
        if (!prev) return prev;
        const updatedQs = (prev.questions || []).map((q: any) =>
          (q?._id || String(q)) === questionId ? { ...q, ...updated } : q
        );
        return { ...prev, questions: updatedQs } as Quiz;
      });

      cancelEdit(questionId);
    } catch (err) {
      console.error(err);
      alert("Failed to update question");
    }
  };

  if (!quiz)
    return (
      <div className="p-6 text-center bg-[#000000] min-h-[calc(100vh-64px)] text-white">
        Loading...
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 bg-[#000000] min-h-[calc(100vh-64px)]">
      {/* Metadata editor */}
      <div className="border border-[#169976] rounded-lg p-4 bg-[#222222] mb-6">
        <h1 className="text-2xl font-bold mb-4 text-white">Edit Quiz</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="block text-sm font-medium mb-1 text-white">
              Title
            </span>
            <input
              className="border border-[#169976] rounded px-3 py-2 w-full bg-[#000000] text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#1DCD9F]"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Quiz title"
            />
          </label>

          <label className="block">
            <span className="block text-sm font-medium mb-1 text-white">
              Time Limit (min)
            </span>
            <input
              type="number"
              className="border border-[#169976] rounded px-3 py-2 w-full bg-[#000000] text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#1DCD9F]"
              value={timeLimit}
              onChange={(e) =>
                setTimeLimit(parseInt(e.target.value || "0", 10))
              }
              min={0}
              placeholder="0 = No limit"
            />
          </label>

          <label className="flex items-center gap-2 mt-1 text-white">
            <input
              type="checkbox"
              checked={allowBack}
              onChange={(e) => setAllowBack(e.target.checked)}
              className="accent-[#1DCD9F]"
            />
            Allow Back
          </label>

          <label className="flex items-center gap-2 mt-1 text-white">
            <input
              type="checkbox"
              checked={showResult}
              onChange={(e) => setShowResult(e.target.checked)}
              className="accent-[#1DCD9F]"
            />
            Show Result
          </label>
        </div>

        <button
          onClick={saveMetadata}
          className="mt-4 px-4 py-2 rounded bg-[#1DCD9F] text-[#000000] font-medium hover:bg-[#169976] transition disabled:opacity-60"
          disabled={savingMeta}
        >
          {savingMeta ? "Saving..." : "Save Quiz Settings"}
        </button>
      </div>

      {/* Preview */}
      <h2 className="text-xl font-semibold mb-2 text-white">Questions</h2>
      <p className="text-white/70 mb-4">
        Time: {quiz.timeLimit} min •{" "}
        {quiz.allowBack ? "Back allowed" : "Back not allowed"} •{" "}
        {quiz.showResult ? "Show result after submit" : "Result hidden"}
      </p>

      <ol className="space-y-4">
        {(quiz.questions || []).map((q: any, idx: number) => {
          // If backend accidentally returned ids, skip rendering until refresh
          const base: any = typeof q === "object" ? q : null;
          const questionId = base?._id || String(q);
          const draft = editing[questionId];
          const isEditing = Boolean(draft);
          const show: Question | null = (draft || base) as any;

          return (
            <li
              key={questionId}
              className="border border-[#169976] rounded p-4 bg-[#222222]"
            >
              <div className="flex items-start justify-between gap-4">
                {isEditing ? (
                  <input
                    className="w-full border border-[#169976] rounded px-3 py-2 font-medium bg-[#000000] text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#1DCD9F]"
                    value={draft?.text || base?.text || ""}
                    onChange={(e) =>
                      changeDraft(questionId, "text", e.target.value)
                    }
                    placeholder="Question text"
                  />
                ) : (
                  <p className="font-medium text-white">
                    {idx + 1}. {base?.text || "(loading...)"}
                  </p>
                )}

                <div className="flex gap-2">
                  {!isEditing ? (
                    <button
                      onClick={() => base && startEdit(base)}
                      className="px-3 py-2 text-sm rounded border border-[#1DCD9F] text-[#1DCD9F] hover:bg-[#000000] transition disabled:opacity-50"
                      disabled={!base}
                    >
                      Edit
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => saveEdit(questionId)}
                        className="px-3 py-2 text-sm rounded bg-[#1DCD9F] text-[#000000] hover:bg-[#169976] transition"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => cancelEdit(questionId)}
                        className="px-3 py-2 text-sm rounded border border-[#169976] text-white hover:bg-[#000000] transition"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>

              <ul className="mt-3 space-y-2">
                {(Array.isArray((show as any)?.options)
                  ? (show as any).options
                  : []
                ).map((opt: string, i: number) => {
                  const isCorrect = (show as any)?.correctIndex === i;
                  return (
                    <li key={i}>
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            className="border border-[#169976] rounded px-3 py-2 w-full bg-[#000000] text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#1DCD9F]"
                            value={opt}
                            onChange={(e) =>
                              changeDraft(
                                questionId,
                                "option",
                                e.target.value,
                                i
                              )
                            }
                            placeholder={`Option ${i + 1}`}
                          />
                          <label className="flex items-center gap-2 text-sm text-white">
                            <input
                              type="radio"
                              name={`correct-${questionId}`}
                              checked={(show as any)?.correctIndex === i}
                              onChange={() =>
                                changeDraft(questionId, "correctIndex", i)
                              }
                              className="accent-[#1DCD9F]"
                            />
                            Correct
                          </label>
                        </div>
                      ) : (
                        <div
                          className={`px-3 py-2 border rounded ${
                            isCorrect
                              ? "bg-[#000000] border-[#1DCD9F] text-white"
                              : "bg-[#000000] border-[#169976] text-white/90"
                          }`}
                        >
                          {opt}{" "}
                          {isCorrect && (
                            <span className="text-[#1DCD9F] font-semibold">
                              (correct)
                            </span>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>

              {!Array.isArray((show as any)?.options) && (
                <div className="text-sm text-white/60 mt-2">
                  Loading question details…
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
