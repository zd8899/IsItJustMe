"use client";

import Link from "next/link";
import { UserMenu } from "@/components/auth/UserMenu";

export function Header() {
  return (
    <header className="border-b border-primary-200 bg-white">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-serif font-semibold text-primary-900">
          IsItJustMe
        </Link>
        <UserMenu />
      </div>
    </header>
  );
}
