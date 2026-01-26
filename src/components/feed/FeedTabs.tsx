"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { CategoryFilter } from "./CategoryFilter";

type FeedType = "hot" | "new";

export function FeedTabs() {
  const [activeTab, setActiveTab] = useState<FeedType>("hot");

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex gap-2">
        <Button
          variant={activeTab === "hot" ? "primary" : "ghost"}
          onClick={() => setActiveTab("hot")}
        >
          Hot
        </Button>
        <Button
          variant={activeTab === "new" ? "primary" : "ghost"}
          onClick={() => setActiveTab("new")}
        >
          New
        </Button>
      </div>
      <CategoryFilter />
    </div>
  );
}
