"use client";

import { useState, useCallback } from "react";
import { useAnonymousId } from "./useAnonymousId";

interface UseVoteOptions {
  postId?: string;
  commentId?: string;
  initialScore: number;
}

export function useVote({ postId, commentId, initialScore }: UseVoteOptions) {
  const [score, setScore] = useState(initialScore);
  const [userVote, setUserVote] = useState<number | null>(null);
  const anonymousId = useAnonymousId();

  const vote = useCallback(
    async (value: 1 | -1) => {
      if (!anonymousId) return;

      const previousVote = userVote;
      const previousScore = score;

      // Optimistic update
      if (userVote === value) {
        // Remove vote
        setUserVote(null);
        setScore(score - value);
      } else {
        // Change or add vote
        const scoreDelta = previousVote ? value * 2 : value;
        setUserVote(value);
        setScore(score + scoreDelta);
      }

      try {
        // TODO: Call tRPC mutation
        console.log("Vote", { postId, commentId, value, anonymousId });
      } catch (error) {
        // Rollback on error
        setUserVote(previousVote);
        setScore(previousScore);
      }
    },
    [score, userVote, anonymousId, postId, commentId]
  );

  const upvote = useCallback(() => vote(1), [vote]);
  const downvote = useCallback(() => vote(-1), [vote]);

  return {
    score,
    userVote,
    upvote,
    downvote,
  };
}
