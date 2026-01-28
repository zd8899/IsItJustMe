"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";

interface UserProfile {
  id: string;
  username: string;
  karma: number;
  postKarma: number;
  commentKarma: number;
  createdAt: string;
  _count: {
    posts: number;
    comments: number;
  };
}

interface ProfileHeaderProps {
  userId: string;
}

// Format date to "Month Day, Year" format (e.g., "January 15, 2024")
function formatJoinDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function ProfileHeader({ userId }: ProfileHeaderProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/profile/${userId}`);
        const data = await response.json();

        if (!response.ok) {
          if (response.status === 404) {
            setError("User not found");
          } else {
            setError(data.error || "Failed to load profile");
          }
          setProfile(null);
        } else {
          setProfile(data);
          setError(null);
        }
      } catch {
        setError("Failed to load profile");
        setProfile(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfile();
  }, [userId]);

  if (isLoading) {
    return (
      <Card>
        <div
          className="flex items-center justify-center py-8"
          data-testid="profile-loading"
        >
          <span className="text-primary-600">Loading...</span>
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

  if (!profile) {
    return (
      <Card>
        <div
          className="flex items-center justify-center py-8"
          role="alert"
          data-testid="profile-not-found"
        >
          <span className="text-red-600">User not found</span>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="space-y-4">
        <h1
          className="text-2xl font-serif font-semibold text-primary-900"
          data-testid="profile-username"
        >
          {profile.username}
        </h1>
        <p className="text-primary-600" data-testid="profile-join-date">
          Joined {formatJoinDate(profile.createdAt)}
        </p>
        <div className="flex items-center gap-6 text-sm text-primary-500">
          <span>{profile.karma} karma</span>
          <span>Post Karma: {profile.postKarma}</span>
          <span>Comment Karma: {profile.commentKarma}</span>
        </div>
        <div className="flex items-center gap-6 text-sm text-primary-500">
          <span>{profile._count.posts} posts</span>
          <span>{profile._count.comments} comments</span>
        </div>
      </div>
    </Card>
  );
}
