"use client";

import { useSession, signOut } from "next-auth/react";
import { useSyncExternalStore, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

interface AuthState {
  isAuthenticated: boolean;
  username: string | null;
}

// Cache for localStorage snapshot to avoid infinite re-renders
let cachedAuthState: AuthState = { isAuthenticated: false, username: null };

// Server snapshot is always the same, so cache it
const serverSnapshot: AuthState = { isAuthenticated: false, username: null };

// localStorage auth state for testing purposes
function getLocalStorageSnapshot(): AuthState {
  if (typeof window === "undefined") {
    return serverSnapshot;
  }
  const storedAuth = localStorage.getItem("isAuthenticated");
  const storedUsername = localStorage.getItem("username");

  const newIsAuthenticated = storedAuth === "true" && storedUsername !== null;
  const newUsername = storedUsername;

  // Only create a new object if values changed
  if (
    cachedAuthState.isAuthenticated !== newIsAuthenticated ||
    cachedAuthState.username !== newUsername
  ) {
    cachedAuthState = {
      isAuthenticated: newIsAuthenticated,
      username: newUsername,
    };
  }

  return cachedAuthState;
}

function getServerSnapshot(): AuthState {
  return serverSnapshot;
}

function subscribeToLocalStorage(callback: () => void) {
  // Listen for storage events from other windows/tabs
  window.addEventListener("storage", callback);
  // Listen for custom event for same-window localStorage updates (used by tests)
  window.addEventListener("localStorageChange", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("localStorageChange", callback);
  };
}

export function UserMenu() {
  // Try NextAuth session first
  const { data: session, status } = useSession();

  // Fallback to localStorage for testing
  const localAuthState = useSyncExternalStore(
    subscribeToLocalStorage,
    getLocalStorageSnapshot,
    getServerSnapshot
  );

  const handleSignOut = useCallback(async () => {
    // Clear localStorage auth state
    localStorage.removeItem("user");
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("username");
    // Dispatch custom event to trigger re-render (storage event doesn't fire for same-window changes)
    window.dispatchEvent(new Event("localStorageChange"));

    // Sign out from NextAuth if session exists
    if (session) {
      await signOut({ redirect: false });
    }
  }, [session]);

  // Determine auth state: prefer NextAuth session, fallback to localStorage
  const isAuthenticated = session?.user || localAuthState.isAuthenticated;
  const username = session?.user?.name || localAuthState.username;

  if (isAuthenticated && username) {
    return (
      <div className="flex items-center gap-4" data-testid="user-menu">
        <Link href="/profile">
          <Button variant="ghost">{username}</Button>
        </Link>
        <Button variant="secondary" onClick={handleSignOut}>
          Sign Out
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2" data-testid="user-menu">
      <Link
        href="/auth/login"
        className="inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 text-primary-700 hover:bg-primary-100 px-4 py-2 text-sm"
      >
        Sign In
      </Link>
      <Link
        href="/auth/register"
        className="inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 bg-primary-900 text-white hover:bg-primary-800 px-4 py-2 text-sm"
      >
        Sign Up
      </Link>
    </div>
  );
}
