"use client";

import { useState, useEffect, useCallback } from "react";
import { PostCard } from "./PostCard";

interface Post {
  id: string;
  frustration: string;
  identity: string;
  category: string;
  score: number;
  commentCount: number;
  createdAt: string;
  username?: string;
}

interface PostListProps {
  sortBy?: "new" | "hot" | "top";
  refreshKey?: number;
}

export function PostList({ sortBy = "new", refreshKey = 0 }: PostListProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/posts?sortBy=${sortBy}`);
      if (!response.ok) {
        throw new Error("Failed to fetch posts");
      }
      const data = await response.json();
      setPosts(data);
    } catch (err) {
      setError("Failed to load posts");
    } finally {
      setIsLoading(false);
    }
  }, [sortBy]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts, refreshKey]);

  if (isLoading) {
    return (
      <div className="space-y-4 mt-4">
        <div className="text-center text-primary-500 py-8">Loading posts...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 mt-4">
        <div className="text-center text-red-500 py-8">{error}</div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="space-y-4 mt-4">
        <div className="text-center text-primary-500 py-8">No posts yet. Be the first to share!</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      {posts.map((post) => (
        <PostCard key={post.id} {...post} />
      ))}
    </div>
  );
}
