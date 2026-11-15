"use client";

import { useState, useEffect, useCallback } from "react";
import type { HistoryEntry, AppResponse } from "@/lib/types";

const HISTORY_KEY = "stt-history";
const MAX_ENTRIES = 20;

// Derive the primary language from a response for session tabs and history
function extractLanguage(response: AppResponse): string {
  if (!response.multiModel) return response.result.language;
  return response.results.primary.language;
}

// Entries saved by older versions used "groq"/"gemini" as model keys.
// Map them onto the current primary/secondary keys so they still render.
const LEGACY_MODEL_KEYS: Record<string, "primary" | "secondary"> = { groq: "primary", gemini: "secondary" };

export function migrateEntry(entry: HistoryEntry): HistoryEntry {
  const res = entry.response as unknown as Record<string, unknown>;
  if (res.multiModel) {
    const results = res.results as Record<string, unknown>;
    if ("groq" in results) {
      return { ...entry, response: { ...res, results: { primary: results.groq, secondary: results.gemini } } as AppResponse };
    }
  } else if (typeof res.model === "string" && res.model in LEGACY_MODEL_KEYS) {
    return { ...entry, response: { ...res, model: LEGACY_MODEL_KEYS[res.model] } as AppResponse };
  }
  return entry;
}

export function useHistory() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  // Load on mount — guarded because localStorage is unavailable during SSR
  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (stored) setEntries((JSON.parse(stored) as HistoryEntry[]).map(migrateEntry));
    } catch {
      // localStorage may be blocked (private browsing, permissions policy, etc.)
    }
  }, []);

  // Returns the new entry's ID so the caller can mark it as active
  const addEntry = useCallback(
    (stackTrace: string, codeContext: string | undefined, useMultiModel: boolean, response: AppResponse): string => {
      const entry: HistoryEntry = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        language: extractLanguage(response),
        tracePreview: stackTrace.trim().slice(0, 60),
        stackTrace,
        codeContext: codeContext || undefined,
        useMultiModel,
        response,
      };

      setEntries((prev) => {
        const updated = [entry, ...prev].slice(0, MAX_ENTRIES);
        try {
          localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
        } catch {}
        return updated;
      });

      return entry.id;
    },
    []
  );

  const removeEntry = useCallback((id: string) => {
    setEntries((prev) => {
      const updated = prev.filter((e) => e.id !== id);
      try {
        if (updated.length === 0) localStorage.removeItem(HISTORY_KEY);
        else localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setEntries([]);
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch {}
  }, []);

  return { entries, addEntry, removeEntry, clearHistory };
}
