"use client";

import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { VoteButtons } from "@/components/vote/VoteButtons";
import { CommentList } from "@/components/comment/CommentList";
import { CommentForm } from "@/components/comment/CommentForm";

interface Post {
  id: string;
  frustration: string;
  identity: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  score: number;
  upvotes: number;
  downvotes: number;
  createdAt: string;
}

interface PostDetailProps {
  postId: string;
}

// Format date consistently to avoid hydration mismatch
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function PostDetail({ postId }: PostDetailProps) {
  const [post, setPost] = useState<Post | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [commentCount, setCommentCount] = useState(0);
  const [commentListKey, setCommentListKey] = useState(0);

  const handleCommentsLoaded = useCallback((count: number) => {
    setCommentCount(count);
  }, []);

  const handleCommentSuccess = useCallback(() => {
    // Increment key to force CommentList to re-fetch
    setCommentListKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    async function fetchPost() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/posts/${postId}`);
        const data = await response.json();

        if (!response.ok) {
          if (response.status === 400) {
            setError("Invalid post ID");
          } else if (response.status === 404) {
            setError("Post not found");
          } else {
            setError(data.error || "Failed to load post");
          }
          setPost(null);
        } else {
          setPost(data);
          setError(null);
        }
      } catch {
        setError("Failed to load post");
        setPost(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPost();
  }, [postId]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <div className="flex items-center justify-center py-8">
            <span className="text-primary-600">Loading...</span>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <div className="flex items-center justify-center py-8" role="alert">
            <span className="text-red-600">{error}</span>
          </div>
        </Card>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="space-y-6">
        <Card>
          <div className="flex items-center justify-center py-8" role="alert">
            <span className="text-red-600">Post not found</span>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex gap-4">
          <VoteButtons score={post.score} postId={post.id} />
          <div className="flex-1">
            <h1 className="text-2xl font-serif text-primary-900">
              Why is it so hard to {post.frustration}?
            </h1>
            <p className="text-lg text-primary-600 mt-2">I am {post.identity}</p>
            <div className="flex items-center gap-4 mt-4 text-sm text-primary-500">
              <span className="px-2 py-1 bg-primary-100 rounded">{post.category.name}</span>
              <span>{commentCount} comments</span>
              <span>Anonymous</span>
              <span>{formatDate(post.createdAt)}</span>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-serif font-semibold text-primary-900 mb-4">
          Add a Comment
        </h2>
        <CommentForm postId={postId} onSuccess={handleCommentSuccess} />
      </Card>

      <div>
        <h2 className="text-lg font-serif font-semibold text-primary-900 mb-4">
          Comments ({commentCount})
        </h2>
        <CommentList key={commentListKey} postId={postId} onCommentsLoaded={handleCommentsLoaded} />
      </div>
    </div>
  );
}
