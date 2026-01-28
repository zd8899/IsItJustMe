"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface PostFormProps {
  onPostCreated?: () => void;
}

export function PostForm({ onPostCreated }: PostFormProps) {
  const [frustration, setFrustration] = useState("");
  const [identity, setIdentity] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<{ value: string; label: string }[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCategories() {
      try {
        setIsLoadingCategories(true);
        setCategoriesError(null);
        const response = await fetch("/api/categories");
        if (!response.ok) {
          throw new Error("Failed to load categories");
        }
        const data: Category[] = await response.json();

        // Define the expected order for core categories
        const categoryOrder = [
          'Work',
          'Relationships',
          'Technology',
          'Health',
          'Parenting',
          'Finance',
          'Daily Life',
          'Social',
          'Other'
        ];

        // Sort categories by the expected order, unknown categories go at the end
        const sortedData = [...data].sort((a, b) => {
          const indexA = categoryOrder.indexOf(a.name);
          const indexB = categoryOrder.indexOf(b.name);

          // If both are in the order list, sort by order
          if (indexA !== -1 && indexB !== -1) {
            return indexA - indexB;
          }
          // If only a is in the list, a comes first
          if (indexA !== -1) return -1;
          // If only b is in the list, b comes first
          if (indexB !== -1) return 1;
          // If neither are in the list, sort alphabetically
          return a.name.localeCompare(b.name);
        });

        setCategories(
          sortedData.map((cat) => ({
            value: cat.id,
            label: cat.name,
          }))
        );
      } catch (err) {
        setCategoriesError("Failed to load categories");
      } finally {
        setIsLoadingCategories(false);
      }
    }

    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    // Client-side validation
    if (!frustration.trim()) {
      setFormError("Please describe your frustration");
      return;
    }

    if (!identity.trim()) {
      setFormError("Please describe who you are");
      return;
    }

    if (!categoryId) {
      setFormError("Please select a category");
      return;
    }

    if (frustration.length > 500) {
      setFormError("Frustration must be less than 500 characters");
      return;
    }

    if (identity.length > 100) {
      setFormError("Identity must be less than 100 characters");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          frustration: frustration.trim(),
          identity: identity.trim(),
          categoryId: categoryId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setFormError(data.error || "Failed to create post");
        return;
      }

      // Success - clear form and show success message
      setFrustration("");
      setIdentity("");
      setCategoryId("");
      setSuccessMessage("Your frustration has been shared!");

      // Notify parent component to refresh feed
      if (onPostCreated) {
        onPostCreated();
      }

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);

    } catch (err) {
      setFormError("Failed to create post. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && (
          <div className="text-red-500 text-sm" role="alert">
            {formError}
          </div>
        )}
        {successMessage && (
          <div className="text-green-600 text-sm" role="status">
            {successMessage}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-primary-700 mb-1">
            Why is it so hard to...
          </label>
          <Input
            value={frustration}
            onChange={(e) => setFrustration(e.target.value)}
            placeholder="e.g., get a good night's sleep"
            disabled={isSubmitting}
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
            disabled={isSubmitting}
            required
          />
        </div>
        {categoriesError ? (
          <div className="w-full">
            <label className="block text-sm font-medium text-primary-700 mb-1">
              Category
            </label>
            <p className="text-sm text-red-500">{categoriesError}</p>
          </div>
        ) : (
          <Select
            label="Category"
            options={categories}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            data-testid="category-select"
            placeholder="Select a category"
            loading={isLoadingCategories}
            disabled={isSubmitting}
            required
          />
        )}
        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
        >
          {isSubmitting ? "Asking..." : "Ask"}
        </Button>
      </form>
    </Card>
  );
}
