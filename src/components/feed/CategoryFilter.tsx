"use client";

import { useState } from "react";
import { Select } from "@/components/ui/Select";

const categories = [
  { value: "all", label: "All Categories" },
  { value: "work", label: "Work" },
  { value: "relationships", label: "Relationships" },
  { value: "technology", label: "Technology" },
  { value: "health", label: "Health" },
  { value: "parenting", label: "Parenting" },
  { value: "finance", label: "Finance" },
  { value: "daily-life", label: "Daily Life" },
  { value: "social", label: "Social" },
  { value: "other", label: "Other" },
];

export function CategoryFilter() {
  const [selectedCategory, setSelectedCategory] = useState("all");

  return (
    <div className="w-48">
      <Select
        options={categories}
        value={selectedCategory}
        onChange={(e) => setSelectedCategory(e.target.value)}
      />
    </div>
  );
}
