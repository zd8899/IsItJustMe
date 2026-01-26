"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function UserMenu() {
  // TODO: Replace with actual session check
  const isAuthenticated = false;
  const username = null;

  if (isAuthenticated) {
    return (
      <div className="flex items-center gap-4">
        <Link href="/profile">
          <Button variant="ghost">{username}</Button>
        </Link>
        <Button variant="secondary" onClick={() => console.log("Sign out")}>
          Sign Out
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link href="/auth/login">
        <Button variant="ghost">Sign In</Button>
      </Link>
      <Link href="/auth/register">
        <Button>Sign Up</Button>
      </Link>
    </div>
  );
}
