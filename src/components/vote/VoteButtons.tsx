"use client";

import { Button } from "@/components/ui/Button";

interface VoteButtonsProps {
  score: number;
  postId?: string;
  commentId?: string;
}

export function VoteButtons({ score, postId, commentId }: VoteButtonsProps) {
  const handleUpvote = () => {
    // TODO: Implement vote via tRPC
    console.log("Upvote", { postId, commentId });
  };

  const handleDownvote = () => {
    // TODO: Implement vote via tRPC
    console.log("Downvote", { postId, commentId });
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleUpvote}
        aria-label="Upvote"
        className="p-1"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 15l7-7 7 7"
          />
        </svg>
      </Button>
      <span className="text-sm font-medium text-primary-700">{score}</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDownvote}
        aria-label="Downvote"
        className="p-1"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </Button>
    </div>
  );
}
