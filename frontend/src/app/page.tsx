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
    <main className="p-10 text-center">
      <h1 className="text-4xl font-bold mb-4">Welcome to the Quiz App</h1>
      <p className="mb-10 text-gray-600">
        Create quizzes. Share them. Let others answer.
      </p>

      <SignedIn>
        <div className="flex justify-center gap-6">
          <Link href="/create">
            <button className="bg-purple-600 text-white px-6 py-3 rounded-md font-medium">
              Go to Quiz Builder
            </button>
          </Link>
          <Link href="/answer">
            <button className="bg-gray-200 px-6 py-3 rounded-md font-medium">
              Go to Answer Quiz
            </button>
          </Link>
        </div>
      </SignedIn>

      <SignedOut>
        <p className="text-gray-500">
          Please sign in to create or answer quizzes.
        </p>
      </SignedOut>
    </main>
  );
}
