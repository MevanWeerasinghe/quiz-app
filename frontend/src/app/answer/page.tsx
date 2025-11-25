"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardCheck, ArrowRight } from "lucide-react";

export default function AnswerLandingPage() {
  const router = useRouter();
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      setError("Please paste a valid quiz link or ID.");
      return;
    }
    setError("");
    setLoading(true);
    router.push(`/quiz/${id}`);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#000000] flex items-center justify-center p-6">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center space-y-3">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-[#1DCD9F]/10">
              <ClipboardCheck className="w-12 h-12 text-[#1DCD9F]" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white">
            Answer a Quiz
          </h1>
          <p className="text-xl text-white/70">
            Enter a quiz link or ID to start your challenge
          </p>
        </div>

        <Card className="border-[#169976]">
          <CardHeader>
            <CardTitle>Enter Quiz Details</CardTitle>
            <CardDescription>
              Paste a quiz link (e.g.,{" "}
              <code className="text-[#1DCD9F] bg-[#1DCD9F]/10 px-2 py-1 rounded text-sm">
                https://quizappfe.vercel.app/quiz/123abc
              </code>
              ) or just the quiz ID.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="Paste quiz link or ID here..."
                value={link}
                onChange={(e) => {
                  setLink(e.target.value);
                  setError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") goToQuiz();
                }}
                className={error ? "border-red-500" : ""}
              />
              {error && (
                <p className="text-sm text-red-400">{error}</p>
              )}
            </div>

            <Button 
              onClick={goToQuiz} 
              disabled={loading || !link.trim()} 
              className="w-full gap-2"
              size="lg"
            >
              {loading ? (
                <>Loading...</>
              ) : (
                <>
                  Start Quiz
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <Card className="bg-[#222222]/50">
            <CardContent className="pt-6">
              <Badge variant="secondary" className="mb-2">Tip</Badge>
              <p className="text-sm text-white/70">
                You can paste the full URL or just the quiz ID
              </p>
            </CardContent>
          </Card>
          <Card className="bg-[#222222]/50">
            <CardContent className="pt-6">
              <Badge variant="secondary" className="mb-2">Fast</Badge>
              <p className="text-sm text-white/70">
                Press Enter to quickly start the quiz
              </p>
            </CardContent>
          </Card>
          <Card className="bg-[#222222]/50">
            <CardContent className="pt-6">
              <Badge variant="secondary" className="mb-2">Simple</Badge>
              <p className="text-sm text-white/70">
                No signup required to answer quizzes
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
