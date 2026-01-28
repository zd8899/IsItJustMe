"use client";

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

interface CategoryFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export function CategoryFilter({ value, onChange }: CategoryFilterProps) {
  return (
    <div className="w-48">
      <Select
        options={categories}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        data-testid="category-filter"
      />
    </div>
  );
}
