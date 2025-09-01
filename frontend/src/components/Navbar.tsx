"use client";

import Link from "next/link";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";

export default function Navbar() {
  return (
    <nav className="bg-[#222222] border-b border-[#169976] px-6 py-4 flex items-center justify-between shadow-sm">
      <div className="text-xl font-bold">
        <Link
          href="/"
          className="text-[#1DCD9F] hover:text-[#169976] transition-colors"
        >
          Quiz App
        </Link>
      </div>

      <div className="flex items-center gap-6">
        <Link
          href="/"
          className="text-white/90 hover:text-white transition-colors font-medium"
        >
          Home
        </Link>

        <SignedIn>
          <Link
            href="/my-quizzes"
            className="text-white/90 hover:text-white transition-colors font-medium"
          >
            My Quizzes
          </Link>
          <Link
            href="/create"
            className="text-white/90 hover:text-white transition-colors font-medium"
          >
            Create
          </Link>
          <Link
            href="/answer"
            className="text-white/90 hover:text-white transition-colors font-medium"
          >
            Answer
          </Link>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>

        <SignedOut>
          <SignInButton>
            <button className="bg-transparent border border-[#1DCD9F] text-[#1DCD9F] rounded-full font-medium text-sm h-10 px-4 hover:bg-[#000000] transition-colors">
              Sign In
            </button>
          </SignInButton>
          <SignUpButton>
            <button className="bg-[#1DCD9F] text-[#000000] rounded-full font-medium text-sm h-10 px-5 hover:bg-[#169976] transition-colors">
              Sign Up
            </button>
          </SignUpButton>
        </SignedOut>
      </div>
    </nav>
  );
}
