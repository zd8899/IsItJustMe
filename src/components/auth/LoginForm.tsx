"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Client-side validation
    if (!username.trim()) {
      setError("Username is required");
      return;
    }

    if (!password) {
      setError("Password is required");
      return;
    }

    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        username: username.trim(),
        password,
        redirect: false,
      });

      // Check for explicit error or if URL indicates a failure (CSRF error, signin redirect)
      const hasError = result?.error ||
        result?.url?.includes('csrf=') ||
        result?.url?.includes('/error') ||
        result?.url?.includes('/signin');

      if (hasError) {
        setError("Invalid username or password");
      } else if (result?.ok) {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}
        <Input
          id="username"
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <Input
          id="password"
          type="password"
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
          aria-busy={isLoading}
        >
          {isLoading ? "Logging in..." : "Log In"}
        </Button>
        <p className="text-center text-sm text-primary-600">
          Don&apos;t have an account?{" "}
          <Link href="/auth/register" className="text-primary-900 underline">
            Create one
          </Link>
        </p>
      </form>
    </Card>
  );
}
