"use client";

import Link from "next/link";
import { VoteButtons } from "@/components/vote/VoteButtons";

interface PostCardProps {
  id: string;
  frustration: string;
  identity: string;
  category: string;
  score: number;
  commentCount: number;
  createdAt: string;
  username?: string;
}

export function PostCard({
  id,
  frustration,
  identity,
  category,
  score,
  commentCount,
  createdAt,
  username,
}: PostCardProps) {
  return (
    <div className="bg-white border border-primary-200 rounded-lg p-4 hover:border-primary-300 transition-colors">
      <div className="flex gap-4">
        <VoteButtons score={score} postId={id} />
        <div className="flex-1 min-w-0">
          <Link href={`/post/${id}`} className="block">
            <h3 className="text-lg font-serif text-primary-900">
              Why is it so hard to {frustration}?
            </h3>
            <p className="text-sm text-primary-600 mt-1">I am {identity}</p>
          </Link>
          <div className="flex items-center gap-4 mt-3 text-xs text-primary-500">
            <span className="px-2 py-1 bg-primary-100 rounded">{category}</span>
            <span>{commentCount} comments</span>
            <span>{username ? `by ${username}` : "Anonymous"}</span>
            <span suppressHydrationWarning>{new Date(createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
