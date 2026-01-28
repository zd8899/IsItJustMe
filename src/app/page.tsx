"use client";

import { useState } from "react";
import { Container } from "@/components/layout/Container";
import { PostForm } from "@/components/post/PostForm";
import { FeedTabs } from "@/components/feed/FeedTabs";
import { PostList } from "@/components/post/PostList";

export default function HomePage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [sortBy, setSortBy] = useState<"hot" | "new">("hot");
  const [categorySlug, setCategorySlug] = useState("all");

  const handlePostCreated = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <Container>
      <div className="py-8">
        <FeedTabs
          sortBy={sortBy}
          onSortByChange={setSortBy}
          categorySlug={categorySlug}
          onCategoryChange={setCategorySlug}
        />
        <div className="mt-4">
          <PostForm onPostCreated={handlePostCreated} />
        </div>
        <div className="mt-8">
          <PostList refreshKey={refreshKey} sortBy={sortBy} categorySlug={categorySlug} />
        </div>
      </div>
    </Container>
  );
}
