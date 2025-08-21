"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";

export default function Home() {
  const { user } = useUser();

  useEffect(() => {
    const syncUserToBackend = async () => {
      if (!user) return;
      try {
        await fetch("http://localhost:5000/api/users/auth", {
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
    <main className="min-h-[calc(100vh-64px)] p-10 text-center bg-[#000000]">
      <h1 className="text-4xl font-bold mb-4 text-white">
        Welcome to the Quiz App
      </h1>

      <p className="mb-10 text-[#cfcfcf]">
        Create quizzes. Share them. Let others answer.
      </p>

      <SignedIn>
        <div className="flex justify-center gap-6">
          <Link href="/create">
            <button
              className="bg-[#1DCD9F] text-[#000000] px-6 py-3 rounded-md font-medium hover:bg-[#169976] transition-colors"
              aria-label="Go to Quiz Builder"
            >
              Go to Quiz Builder
            </button>
          </Link>
          <Link href="/answer">
            <button
              className="border border-[#1DCD9F] text-[#1DCD9F] px-6 py-3 rounded-md font-medium hover:bg-[#222222] transition-colors"
              aria-label="Go to Answer Quiz"
            >
              Go to Answer Quiz
            </button>
          </Link>
        </div>
      </SignedIn>

      <SignedOut>
        <p className="text-[#b5b5b5]">
          Please sign in to create or answer quizzes.
        </p>
      </SignedOut>
    </main>
  );
}
