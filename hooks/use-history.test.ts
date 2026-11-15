import { describe, expect, it } from "vitest";
import { migrateEntry } from "@/hooks/use-history";
import type { HistoryEntry } from "@/lib/types";

const result = {
  language: "Go",
  explanation: "x",
  rootCause: "y",
  likelyCauses: ["z"],
  suggestedFix: { code: "", language: "go", explanation: "w" },
  assumptions: [],
  confidence: "medium" as const,
};

const entry = (response: unknown): HistoryEntry => ({
  id: "1",
  timestamp: 0,
  language: "Go",
  tracePreview: "panic",
  stackTrace: "panic",
  useMultiModel: false,
  response: response as HistoryEntry["response"],
});

describe("migrateEntry", () => {
  it("maps legacy multi-model keys to primary/secondary", () => {
    const migrated = migrateEntry(entry({ multiModel: true, results: { groq: result, gemini: result }, agreement: true }));
    expect(migrated.response).toEqual({ multiModel: true, results: { primary: result, secondary: result }, agreement: true });
  });

  it("maps a legacy single-model key", () => {
    const migrated = migrateEntry(entry({ multiModel: false, model: "gemini", result }));
    expect(migrated.response).toMatchObject({ multiModel: false, model: "secondary" });
  });

  it("leaves current entries untouched", () => {
    const current = entry({ multiModel: false, model: "primary", result });
    expect(migrateEntry(current)).toBe(current);
  });
});
