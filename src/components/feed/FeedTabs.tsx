"use client";

import { Button } from "@/components/ui/Button";
import { CategoryFilter } from "./CategoryFilter";

type FeedType = "hot" | "new";

interface FeedTabsProps {
  sortBy: FeedType;
  onSortByChange: (sortBy: FeedType) => void;
  categorySlug: string;
  onCategoryChange: (categorySlug: string) => void;
}

export function FeedTabs({ sortBy, onSortByChange, categorySlug, onCategoryChange }: FeedTabsProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex gap-2">
        <Button
          variant={sortBy === "hot" ? "primary" : "ghost"}
          onClick={() => onSortByChange("hot")}
        >
          Hot
        </Button>
        <Button
          variant={sortBy === "new" ? "primary" : "ghost"}
          onClick={() => onSortByChange("new")}
        >
          New
        </Button>
      </div>
      <CategoryFilter value={categorySlug} onChange={onCategoryChange} />
    </div>
  );
}
