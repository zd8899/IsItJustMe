"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";

const categories = [
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

export function PostForm() {
  const [frustration, setFrustration] = useState("");
  const [identity, setIdentity] = useState("");
  const [category, setCategory] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement post creation via tRPC
    console.log({ frustration, identity, category });
  };

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-primary-700 mb-1">
            Why is it so hard to...
          </label>
          <Input
            value={frustration}
            onChange={(e) => setFrustration(e.target.value)}
            placeholder="e.g., get a good night's sleep"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-primary-700 mb-1">
            I am...
          </label>
          <Input
            value={identity}
            onChange={(e) => setIdentity(e.target.value)}
            placeholder="e.g., a new parent"
            required
          />
        </div>
        <Select
          label="Category"
          options={categories}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
        />
        <Button type="submit" className="w-full">
          Ask
        </Button>
      </form>
    </Card>
  );
}
