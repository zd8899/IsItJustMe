"use client";

import { useState, useEffect, useCallback } from "react";
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
  onCommentsLoaded?: (count: number) => void;
}

export function CommentList({ postId, onCommentsLoaded }: CommentListProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeReplyCommentId, setActiveReplyCommentId] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/comments?postId=${postId}`);
      if (response.ok) {
        const data = await response.json();
        setComments(data);
        onCommentsLoaded?.(data.length);
      } else {
        setComments([]);
        onCommentsLoaded?.(0);
      }
    } catch {
      setComments([]);
      onCommentsLoaded?.(0);
    } finally {
      setIsLoading(false);
    }
  }, [postId, onCommentsLoaded]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleReplyFormToggle = useCallback((commentId: string, isOpen: boolean) => {
    setActiveReplyCommentId(isOpen ? commentId : null);
  }, []);

  const handleReplySuccess = useCallback(() => {
    setActiveReplyCommentId(null);
    fetchComments();
  }, [fetchComments]);

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
        <CommentCard
          key={comment.id}
          {...comment}
          postId={postId}
          isReplyFormOpen={activeReplyCommentId === comment.id}
          onReplyFormToggle={(isOpen) => handleReplyFormToggle(comment.id, isOpen)}
          onReplySuccess={handleReplySuccess}
        />
      ))}
    </div>
  );
}
