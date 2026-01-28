"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";

interface Post {
  id: string;
  frustration: string;
  identity: string;
  score: number;
  commentCount?: number;
  createdAt: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
}

interface UserPostsListProps {
  userId: string;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function UserPostsList({ userId }: UserPostsListProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPosts() {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch from profile API which includes posts
        const response = await fetch(`/api/profile/${userId}`);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("User not found");
          }
          throw new Error("Failed to fetch posts");
        }

        const data = await response.json();
        const postsData = data?.posts || [];
        setPosts(Array.isArray(postsData) ? postsData : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load posts");
      } finally {
        setIsLoading(false);
      }
    }

    if (userId) {
      fetchPosts();
    }
  }, [userId]);

  if (isLoading) {
    return (
      <Card>
        <div
          className="flex items-center justify-center py-8"
          data-testid="posts-loading"
        >
          <span className="text-primary-600">Loading posts...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="flex items-center justify-center py-8" role="alert">
          <span className="text-red-600">{error}</span>
        </div>
      </Card>
    );
  }

  if (posts.length === 0) {
    return (
      <Card>
        <div className="py-6 text-center">
          <p className="text-primary-600">
            This user hasn&apos;t created any posts yet.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div data-testid="user-posts-list" className="space-y-4">
      <h2 className="text-lg font-semibold text-primary-900">Posts</h2>
      {posts.map((post) => (
        <div
          key={post.id}
          data-testid="user-post-card"
          className="bg-white border border-primary-200 rounded-lg p-4 hover:border-primary-300 transition-colors"
        >
          <Link href={`/post/${post.id}`} className="block">
            <p data-testid="post-frustration" className="text-primary-900">
              Why is it so hard to {post.frustration}?
            </p>
            <p
              data-testid="post-identity"
              className="text-sm text-primary-600 mt-1"
            >
              I am {post.identity}
            </p>
          </Link>
          <div className="flex items-center gap-4 mt-3 text-xs text-primary-500">
            <span
              data-testid="post-category"
              className="px-2 py-1 bg-primary-100 rounded"
            >
              {post.category.name}
            </span>
            <span data-testid="post-score">{post.score} points</span>
            <span data-testid="post-comments">
              {post.commentCount ?? 0} comments
            </span>
            <span data-testid="post-date" suppressHydrationWarning>
              {formatDate(post.createdAt)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
