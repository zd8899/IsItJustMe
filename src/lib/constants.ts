export const CATEGORIES = [
  { id: "work", name: "Work", slug: "work" },
  { id: "relationships", name: "Relationships", slug: "relationships" },
  { id: "technology", name: "Technology", slug: "technology" },
  { id: "health", name: "Health", slug: "health" },
  { id: "parenting", name: "Parenting", slug: "parenting" },
  { id: "finance", name: "Finance", slug: "finance" },
  { id: "daily-life", name: "Daily Life", slug: "daily-life" },
  { id: "social", name: "Social", slug: "social" },
  { id: "other", name: "Other", slug: "other" },
] as const;

export const RATE_LIMITS = {
  anonymous: {
    posts: { limit: 5, windowMs: 60 * 60 * 1000 }, // 5 per hour
    votes: { limit: 30, windowMs: 60 * 60 * 1000 }, // 30 per hour
    comments: { limit: 10, windowMs: 60 * 60 * 1000 }, // 10 per hour
  },
  registered: {
    posts: { limit: 20, windowMs: 60 * 60 * 1000 }, // 20 per hour
    votes: { limit: 100, windowMs: 60 * 60 * 1000 }, // 100 per hour
    comments: { limit: 50, windowMs: 60 * 60 * 1000 }, // 50 per hour
  },
} as const;

export const PAGINATION = {
  defaultLimit: 20,
  maxLimit: 50,
} as const;

export const MAX_COMMENT_DEPTH = 2;
