"use client";

import { PostCard } from "./PostCard";

// Placeholder data - will be replaced with tRPC query
const placeholderPosts = [
  {
    id: "1",
    frustration: "find a work-life balance",
    identity: "a software engineer",
    category: "Work",
    score: 42,
    commentCount: 15,
    createdAt: "2026-01-20T12:00:00.000Z",
    username: undefined,
  },
  {
    id: "2",
    frustration: "remember everyone's birthday",
    identity: "someone with a big family",
    category: "Relationships",
    score: 28,
    commentCount: 8,
    createdAt: "2026-01-19T12:00:00.000Z",
    username: "user123",
  },
];

export function PostList() {
  // TODO: Replace with tRPC query
  const posts = placeholderPosts;

  return (
    <div className="space-y-4 mt-4">
      {posts.map((post) => (
        <PostCard key={post.id} {...post} />
      ))}
    </div>
  );
}
