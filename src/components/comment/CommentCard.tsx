"use client";

import { VoteButtons } from "@/components/vote/VoteButtons";
import { CommentForm } from "./CommentForm";
import { Button } from "@/components/ui/Button";

interface CommentCardProps {
  id: string;
  content: string;
  score: number;
  username?: string;
  createdAt: string;
  postId: string;
  replies?: CommentCardProps[];
  depth?: number;
  isReplyFormOpen?: boolean;
  onReplyFormToggle?: (isOpen: boolean) => void;
  onReplySuccess?: () => void;
}

// Format date consistently to avoid hydration mismatch
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function CommentCard({
  id,
  content,
  score,
  username,
  createdAt,
  postId,
  replies = [],
  depth = 0,
  isReplyFormOpen = false,
  onReplyFormToggle,
  onReplySuccess,
}: CommentCardProps) {
  const canReply = depth < 1; // Max 2 levels of nesting (only top-level comments can have replies)

  const handleReplyClick = () => {
    onReplyFormToggle?.(!isReplyFormOpen);
  };

  const handleCancel = () => {
    onReplyFormToggle?.(false);
  };

  const handleSuccess = () => {
    onReplySuccess?.();
  };

  return (
    <div className={`${depth > 0 ? "ml-8 border-l-2 border-primary-100 pl-4" : ""}`}>
      <div className="bg-white border border-primary-200 rounded-lg p-4">
        <div className="flex gap-3">
          <VoteButtons score={score} commentId={id} />
          <div className="flex-1 min-w-0">
            <p className="text-primary-800">{content}</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-primary-500">
              <span>{username || "Anonymous"}</span>
              <span>{formatDate(createdAt)}</span>
              {canReply && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReplyClick}
                >
                  Reply
                </Button>
              )}
            </div>
            {isReplyFormOpen && (
              <div className="mt-3">
                <CommentForm
                  postId={postId}
                  parentId={id}
                  onCancel={handleCancel}
                  onSuccess={handleSuccess}
                  autoFocus
                />
              </div>
            )}
          </div>
        </div>
      </div>
      {replies.length > 0 && (
        <div className="mt-2 space-y-2">
          {replies.map((reply) => (
            <CommentCard key={reply.id} {...reply} postId={postId} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
