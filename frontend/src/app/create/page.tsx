"use client";

import Link from "next/link";
import QuizList from "@/components/QuizList";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Wand2, PenTool } from "lucide-react";

export default function CreateQuizPage() {
  return (
    <div className="max-w-6xl mx-auto py-10 px-4 bg-[#000000] min-h-[calc(100vh-64px)]">
      <div className="mb-10">
        <h1 className="text-4xl font-bold mb-3 text-white">Create a Quiz</h1>
        <p className="text-white/70 text-lg">
          Choose how you want to build your quiz
        </p>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <Link href="/create/manual">
          <Card className="cursor-pointer hover:border-[#1DCD9F] hover:shadow-lg hover:shadow-[#1DCD9F]/20 transition-all h-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-[#1DCD9F]/10">
                  <PenTool className="w-6 h-6 text-[#1DCD9F]" />
                </div>
                <CardTitle className="text-2xl">Manual Create</CardTitle>
              </div>
              <CardDescription className="text-base mt-3">
                Build your quiz question by question with full control over
                every detail.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/create/ai">
          <Card className="cursor-pointer hover:border-[#1DCD9F] hover:shadow-lg hover:shadow-[#1DCD9F]/20 transition-all h-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-[#1DCD9F]/10">
                  <Wand2 className="w-6 h-6 text-[#1DCD9F]" />
                </div>
                <CardTitle className="text-2xl">AI Generate</CardTitle>
              </div>
              <CardDescription className="text-base mt-3">
                Let AI generate questions based on a topic with customizable
                options.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

      {/* Reusable list with search */}
      <QuizList heading="Your Quizzes" />
    </div>
  );
}
