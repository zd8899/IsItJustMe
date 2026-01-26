import { create } from "zustand";

type FeedType = "hot" | "new";

interface FeedState {
  feedType: FeedType;
  categorySlug: string | null;
  setFeedType: (type: FeedType) => void;
  setCategorySlug: (slug: string | null) => void;
}

export const useFeedStore = create<FeedState>((set) => ({
  feedType: "hot",
  categorySlug: null,
  setFeedType: (type) => set({ feedType: type }),
  setCategorySlug: (slug) => set({ categorySlug: slug }),
}));
