"use client";

import Link from "next/link";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  return (
    <nav className="bg-[#222222] border-b border-[#169976] px-6 py-4 flex items-center justify-between shadow-lg sticky top-0 z-50">
      <div className="text-2xl font-bold">
        <Link
          href="/"
          className="text-[#1DCD9F] hover:text-[#169976] transition-colors flex items-center gap-2"
        >
          <span className="text-3xl">📝</span> Quiz App
        </Link>
      </div>

      <div className="flex items-center gap-6">
        <Link
          href="/"
          className="text-white/90 hover:text-[#1DCD9F] transition-colors font-medium text-sm"
        >
          Home
        </Link>

        <SignedIn>
          <Link
            href="/my-quizzes"
            className="text-white/90 hover:text-[#1DCD9F] transition-colors font-medium text-sm"
          >
            My Quizzes
          </Link>
          <Link
            href="/create"
            className="text-white/90 hover:text-[#1DCD9F] transition-colors font-medium text-sm"
          >
            Create
          </Link>
          <Link
            href="/answer"
            className="text-white/90 hover:text-[#1DCD9F] transition-colors font-medium text-sm"
          >
            Answer
          </Link>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>

        <SignedOut>
          <SignInButton>
            <Button variant="outline" size="sm">
              Sign In
            </Button>
          </SignInButton>
          <SignUpButton>
            <Button size="sm">Sign Up</Button>
          </SignUpButton>
        </SignedOut>
      </div>
    </nav>
  );
}
