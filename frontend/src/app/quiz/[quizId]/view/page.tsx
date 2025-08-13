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
  questions: Question[];
};

export default function QuizViewPage() {
  const { quizId } = useParams<{ quizId: string }>();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [editing, setEditing] = useState<Record<string, Question>>({}); // questionId -> draft

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`http://localhost:5000/api/quizzes/${quizId}`);
      const data = await res.json();
      setQuiz(data);
    };
    load();
  }, [quizId]);

  const startEdit = (q: Question) => {
    setEditing((prev) => ({
      ...prev,
      [q._id]: { ...q },
    }));
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
        const opts = [...draft.options];
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
    if (draft.options.some((o) => !o.trim()))
      return alert("All options required");
    if (draft.correctIndex < 0 || draft.correctIndex >= draft.options.length) {
      return alert("Correct option out of range");
    }

    try {
      // Backend exposes PUT /api/quizzes/:id (updateQuestion)
      const res = await fetch(
        `http://localhost:5000/api/quizzes/${questionId}`,
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
        const updatedQs = prev.questions.map((q) =>
          q._id === questionId ? { ...q, ...updated } : q
        );
        return { ...prev, questions: updatedQs };
      });

      cancelEdit(questionId);
    } catch (err) {
      console.error(err);
      alert("Failed to update question");
    }
  };

  if (!quiz) return <div className="p-6 text-center">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-2">{quiz.title} — Preview</h1>
      <p className="text-gray-600 mb-6">
        Time: {quiz.timeLimit} min •{" "}
        {quiz.allowBack ? "Back allowed" : "Back not allowed"} •{" "}
        {quiz.showResult ? "Show result after submit" : "Result hidden"}
      </p>

      <ol className="space-y-4">
        {quiz.questions.map((q, idx) => {
          const draft = editing[q._id];
          const isEditing = Boolean(draft);
          const show = draft || q;

          return (
            <li key={q._id} className="border rounded p-4 bg-white">
              <div className="flex items-start justify-between gap-4">
                {isEditing ? (
                  <input
                    className="w-full border rounded px-3 py-2 font-medium"
                    value={show.text}
                    onChange={(e) => changeDraft(q._id, "text", e.target.value)}
                  />
                ) : (
                  <p className="font-medium">
                    {idx + 1}. {q.text}
                  </p>
                )}
                <div className="flex gap-2">
                  {!isEditing ? (
                    <button
                      onClick={() => startEdit(q)}
                      className="px-3 py-2 text-sm border rounded bg-gray-50 hover:bg-gray-100"
                    >
                      Edit
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => saveEdit(q._id)}
                        className="px-3 py-2 text-sm rounded bg-green-600 text-white hover:opacity-90"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => cancelEdit(q._id)}
                        className="px-3 py-2 text-sm border rounded bg-gray-50 hover:bg-gray-100"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>

              <ul className="mt-3 space-y-2">
                {show.options.map((opt, i) => {
                  const isCorrect = show.correctIndex === i;
                  return (
                    <li key={i}>
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            className="border rounded px-3 py-2 w-full"
                            value={opt}
                            onChange={(e) =>
                              changeDraft(q._id, "option", e.target.value, i)
                            }
                          />
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="radio"
                              name={`correct-${q._id}`}
                              checked={show.correctIndex === i}
                              onChange={() =>
                                changeDraft(q._id, "correctIndex", i)
                              }
                            />
                            Correct
                          </label>
                        </div>
                      ) : (
                        <div
                          className={`px-3 py-2 border rounded ${
                            isCorrect
                              ? "bg-green-50 border-green-400"
                              : "bg-white"
                          }`}
                        >
                          {opt}{" "}
                          {isCorrect && (
                            <span className="text-green-700"> (correct)</span>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
