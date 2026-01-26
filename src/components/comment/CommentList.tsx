"use client";

import { CommentCard } from "./CommentCard";

interface CommentListProps {
  postId: string;
}

// Placeholder data - will be replaced with tRPC query
const placeholderComments = [
  {
    id: "1",
    content: "I feel this so much. The constant context switching is exhausting.",
    score: 12,
    username: "user456",
    createdAt: new Date().toISOString(),
    postId: "1",
    replies: [
      {
        id: "2",
        content: "Have you tried time blocking? It helped me a bit.",
        score: 5,
        username: undefined,
        createdAt: new Date().toISOString(),
        postId: "1",
        replies: [],
      },
    ],
  },
  {
    id: "3",
    content: "The expectations are just unrealistic these days.",
    score: 8,
    username: undefined,
    createdAt: new Date().toISOString(),
    postId: "1",
    replies: [],
  },
];

export function CommentList({ postId }: CommentListProps) {
  // TODO: Replace with tRPC query
  const comments = placeholderComments;

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <CommentCard key={comment.id} {...comment} postId={postId} />
      ))}
    </div>
  );
}
