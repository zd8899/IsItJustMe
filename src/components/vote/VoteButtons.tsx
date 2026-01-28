"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { trpc } from "@/lib/trpc";

interface VoteButtonsProps {
  score: number;
  postId?: string;
  commentId?: string;
}

// Generate or retrieve anonymous ID for voting
function getAnonymousId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("anonymousVoterId");
  if (!id) {
    id = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem("anonymousVoterId", id);
  }
  return id;
}

export function VoteButtons({ score, postId, commentId }: VoteButtonsProps) {
  const [displayScore, setDisplayScore] = useState(score);
  const [isVoting, setIsVoting] = useState(false);
  // Track user's current vote: null = no vote, 1 = upvoted, -1 = downvoted
  const [currentVote, setCurrentVote] = useState<number | null>(null);

  // Sync displayScore with prop when it changes
  useEffect(() => {
    setDisplayScore(score);
  }, [score]);

  const castPostVote = trpc.vote.castPostVote.useMutation({
    onSuccess: (result) => {
      if ('deleted' in result && result.deleted) {
        // Vote was removed - clear current vote
        setCurrentVote(null);
      } else if ('updated' in result && result.updated) {
        // Vote direction changed
        setCurrentVote(result.value);
      } else {
        // New vote created
        setCurrentVote(result.value);
      }
      setIsVoting(false);
    },
    onError: () => {
      // Revert optimistic update on error
      setDisplayScore(score);
      setIsVoting(false);
    },
  });

  const castCommentVote = trpc.vote.castCommentVote.useMutation({
    onSuccess: (result) => {
      if ('deleted' in result && result.deleted) {
        setCurrentVote(null);
      } else if ('updated' in result && result.updated) {
        setCurrentVote(result.value);
      } else {
        setCurrentVote(result.value);
      }
      setIsVoting(false);
    },
    onError: () => {
      setDisplayScore(score);
      setIsVoting(false);
    },
  });

  const handleUpvote = () => {
    if (isVoting) return;
    setIsVoting(true);

    // Calculate optimistic score change based on current vote state
    let scoreChange: number;
    if (currentVote === 1) {
      // Already upvoted - clicking again removes the vote
      scoreChange = -1;
    } else if (currentVote === -1) {
      // Currently downvoted - switching to upvote is +2
      scoreChange = 2;
    } else {
      // No current vote - add upvote is +1
      scoreChange = 1;
    }

    setDisplayScore((prev) => prev + scoreChange);

    const anonymousId = getAnonymousId();

    if (commentId) {
      castCommentVote.mutate({ commentId, value: 1, anonymousId });
    } else if (postId) {
      castPostVote.mutate({ postId, value: 1, anonymousId });
    }
  };

  const handleDownvote = () => {
    if (isVoting) return;
    setIsVoting(true);

    // Calculate optimistic score change based on current vote state
    let scoreChange: number;
    if (currentVote === -1) {
      // Already downvoted - clicking again removes the vote
      scoreChange = 1;
    } else if (currentVote === 1) {
      // Currently upvoted - switching to downvote is -2
      scoreChange = -2;
    } else {
      // No current vote - add downvote is -1
      scoreChange = -1;
    }

    setDisplayScore((prev) => prev + scoreChange);

    const anonymousId = getAnonymousId();

    if (commentId) {
      castCommentVote.mutate({ commentId, value: -1, anonymousId });
    } else if (postId) {
      castPostVote.mutate({ postId, value: -1, anonymousId });
    }
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleUpvote}
        aria-label="Upvote"
        className="p-1"
        disabled={isVoting}
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
      <span className="text-sm font-medium text-primary-700" data-testid="vote-score">{displayScore}</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDownvote}
        aria-label="Downvote"
        className="p-1"
        disabled={isVoting}
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
