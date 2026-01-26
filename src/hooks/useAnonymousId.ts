"use client";

import { useState, useEffect } from "react";
import { generateAnonymousId } from "@/lib/utils";

const STORAGE_KEY = "isitjustme_anonymous_id";

export function useAnonymousId() {
  const [anonymousId, setAnonymousId] = useState<string | null>(null);

  useEffect(() => {
    let id = localStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = generateAnonymousId();
      localStorage.setItem(STORAGE_KEY, id);
    }
    setAnonymousId(id);
  }, []);

  return anonymousId;
}
