"use client";

import { useState, useEffect } from "react";
import { CommentCard } from "./CommentCard";

interface Comment {
  id: string;
  content: string;
  score: number;
  username?: string;
  createdAt: string;
  postId: string;
  replies?: Comment[];
}

interface CommentListProps {
  postId: string;
}

export function CommentList({ postId }: CommentListProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchComments() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/comments?postId=${postId}`);
        if (response.ok) {
          const data = await response.json();
          setComments(data);
        } else {
          setComments([]);
        }
      } catch {
        setComments([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchComments();
  }, [postId]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <p className="text-primary-500 text-sm">Loading comments...</p>
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-primary-500 text-sm">No comments yet. Be the first to comment!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <CommentCard key={comment.id} {...comment} postId={postId} />
      ))}
    </div>
  );
}
