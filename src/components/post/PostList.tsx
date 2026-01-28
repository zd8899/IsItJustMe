"use client";

import { useState, useEffect, useRef } from "react";
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
  categorySlug?: string;
}

export function PostList({ sortBy = "new", refreshKey = 0, categorySlug = "all" }: PostListProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const fetchPosts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        let url = `/api/posts?sortBy=${sortBy}`;
        if (categorySlug && categorySlug !== "all") {
          url += `&categorySlug=${encodeURIComponent(categorySlug)}`;
        }
        const response = await fetch(url, { signal: abortController.signal });
        if (!response.ok) {
          throw new Error("Failed to fetch posts");
        }
        const data = await response.json();
        // Only update state if this request wasn't aborted
        if (!abortController.signal.aborted) {
          setPosts(data);
        }
      } catch (err) {
        // Ignore abort errors
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        if (!abortController.signal.aborted) {
          setError("Failed to load posts");
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchPosts();

    // Cleanup: abort the request if dependencies change or component unmounts
    return () => {
      abortController.abort();
    };
  }, [sortBy, categorySlug, refreshKey]);

  // Show loading only on initial load when no posts exist yet
  if (isLoading && posts.length === 0) {
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
