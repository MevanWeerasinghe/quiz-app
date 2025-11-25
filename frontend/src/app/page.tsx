"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";
import { API_URL } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Sparkles, BookOpen } from "lucide-react";

export default function Home() {
  const { user } = useUser();

  useEffect(() => {
    const syncUserToBackend = async () => {
      if (!user) return;
      try {
        await fetch(`${API_URL}/api/users/auth`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            googleId: user.id,
            name: user.fullName,
            email: user.emailAddresses[0].emailAddress,
            photo: user.imageUrl,
          }),
        });
      } catch (error) {
        console.error("Error syncing user to backend:", error);
      }
    };

    syncUserToBackend();
  }, [user]);

  return (
    <main className="min-h-[calc(100vh-64px)] bg-[#000000] flex items-center justify-center p-6">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight">
            Welcome to <span className="text-[#1DCD9F]">Quiz App</span>
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Create engaging quizzes, share them with the world, and challenge
            others to test their knowledge.
          </p>
        </div>

        <SignedIn>
          <div className="grid md:grid-cols-2 gap-6 mt-12">
            <Card className="hover:border-[#1DCD9F] transition-colors">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#1DCD9F]/10">
                    <Sparkles className="w-6 h-6 text-[#1DCD9F]" />
                  </div>
                  <CardTitle>Create Quizzes</CardTitle>
                </div>
                <CardDescription>
                  Build custom quizzes with AI assistance or manually. Perfect
                  for education, training, or fun.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/create">
                  <Button className="w-full" size="lg">
                    Go to Quiz Builder
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:border-[#1DCD9F] transition-colors">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#1DCD9F]/10">
                    <BookOpen className="w-6 h-6 text-[#1DCD9F]" />
                  </div>
                  <CardTitle>Answer Quizzes</CardTitle>
                </div>
                <CardDescription>
                  Test your knowledge by answering quizzes created by the
                  community.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/answer">
                  <Button variant="outline" className="w-full" size="lg">
                    Go to Answer Quiz
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </SignedIn>

        <SignedOut>
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-center">Get Started</CardTitle>
              <CardDescription className="text-center">
                Please sign in to create or answer quizzes and join our learning
                community.
              </CardDescription>
            </CardHeader>
          </Card>
        </SignedOut>
      </div>
    </main>
  );
}
