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
    <nav className="bg-purple-50 border-b border-purple-200 px-6 py-4 flex items-center justify-between shadow-sm">
      <div className="text-xl font-bold text-purple-700">
        <Link href="/">Quiz App</Link>
      </div>
      <div className="flex items-center gap-6">
        <Link
          href="/"
          className="text-purple-800 hover:text-purple-600 font-medium"
        >
          Home
        </Link>
        <SignedIn>
          <Link
            href="/create"
            className="text-purple-800 hover:text-purple-600 font-medium"
          >
            Create
          </Link>
          <Link
            href="/answer"
            className="text-purple-800 hover:text-purple-600 font-medium"
          >
            Answer
          </Link>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
        <SignedOut>
          <SignInButton>
            <button className="bg-white border border-purple-500 text-purple-600 rounded-full font-medium text-sm h-10 px-4">
              Sign In
            </button>
          </SignInButton>
          <SignUpButton>
            <button className="bg-purple-600 text-white rounded-full font-medium text-sm h-10 px-5">
              Sign Up
            </button>
          </SignUpButton>
        </SignedOut>
      </div>
    </nav>
  );
}
