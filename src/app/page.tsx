"use client";

import { useState } from "react";
import { Container } from "@/components/layout/Container";
import { PostForm } from "@/components/post/PostForm";
import { FeedTabs } from "@/components/feed/FeedTabs";
import { PostList } from "@/components/post/PostList";

export default function HomePage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handlePostCreated = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <Container>
      <div className="py-8">
        <PostForm onPostCreated={handlePostCreated} />
        <div className="mt-8">
          <FeedTabs />
          <PostList refreshKey={refreshKey} />
        </div>
      </div>
    </Container>
  );
}
