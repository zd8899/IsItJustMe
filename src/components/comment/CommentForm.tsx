"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/Button";

interface CommentFormProps {
  postId: string;
  parentId?: string;
  onCancel?: () => void;
  onSuccess?: () => void;
  autoFocus?: boolean;
}

export function CommentForm({ postId, parentId, onCancel, onSuccess, autoFocus = false }: CommentFormProps) {
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isReplyForm = !!parentId;

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validation
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      setError("Comment is required");
      return;
    }
    if (trimmedContent.length < 3) {
      setError("Comment must be at least 3 characters");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: trimmedContent,
          postId,
          parentId: parentId || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to post comment");
        return;
      }

      setContent("");
      onSuccess?.();
    } catch {
      setError("Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Share your thoughts..."
        className="w-full px-3 py-2 border border-primary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[100px] resize-y"
        disabled={isSubmitting}
      />
      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}
      <div className="flex gap-2 justify-end">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && (
            <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" data-testid="loading-spinner" />
          )}
          {isReplyForm ? "Post Reply" : "Reply"}
        </Button>
      </div>
    </form>
  );
}
