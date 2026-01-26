"use client";

import { Card } from "@/components/ui/Card";
import { VoteButtons } from "@/components/vote/VoteButtons";
import { CommentList } from "@/components/comment/CommentList";
import { CommentForm } from "@/components/comment/CommentForm";

interface PostDetailProps {
  postId: string;
}

export function PostDetail({ postId }: PostDetailProps) {
  // TODO: Replace with tRPC query
  const post = {
    id: postId,
    frustration: "find a work-life balance",
    identity: "a software engineer",
    category: "Work",
    score: 42,
    commentCount: 15,
    createdAt: new Date().toISOString(),
    username: undefined,
  };

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
              <span className="px-2 py-1 bg-primary-100 rounded">{post.category}</span>
              <span>{post.commentCount} comments</span>
              <span>{post.username ? `by ${post.username}` : "Anonymous"}</span>
              <span>{new Date(post.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-serif font-semibold text-primary-900 mb-4">
          Add a Comment
        </h2>
        <CommentForm postId={postId} />
      </Card>

      <div>
        <h2 className="text-lg font-serif font-semibold text-primary-900 mb-4">
          Comments ({post.commentCount})
        </h2>
        <CommentList postId={postId} />
      </div>
    </div>
  );
}
