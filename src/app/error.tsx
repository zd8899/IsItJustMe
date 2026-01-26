"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/layout/Container";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container>
      <div className="py-8 text-center">
        <h2 className="text-2xl font-serif font-semibold text-primary-900">
          Something went wrong!
        </h2>
        <p className="mt-4 text-primary-600">{error.message}</p>
        <Button className="mt-6" onClick={() => reset()}>
          Try again
        </Button>
      </div>
    </Container>
  );
}
