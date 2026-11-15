import { describe, expect, it } from "vitest";
import { checkAgreement } from "@/lib/llm/client";
import { LLMResponseSchema, type LLMResponse } from "@/lib/llm/schema";

const base: LLMResponse = {
  language: "Python",
  explanation: "A dictionary key was missing.",
  rootCause: "The code reads item['price'] but one item has no price.",
  likelyCauses: ["Malformed input", "Typo in the key name"],
  suggestedFix: { code: "item.get('price', 0)", language: "python", explanation: "Use a default." },
  assumptions: ["cart is a list of dicts"],
  confidence: "high",
};

describe("LLMResponseSchema", () => {
  it("accepts a well-formed response", () => {
    expect(LLMResponseSchema.safeParse(base).success).toBe(true);
  });

  it("rejects a response with a missing confidence", () => {
    const withoutConfidence: Partial<LLMResponse> = { ...base };
    delete withoutConfidence.confidence;
    expect(LLMResponseSchema.safeParse(withoutConfidence).success).toBe(false);
  });

  it("rejects an unknown confidence level", () => {
    expect(LLMResponseSchema.safeParse({ ...base, confidence: "certain" }).success).toBe(false);
  });

  it("rejects more than five likely causes", () => {
    expect(LLMResponseSchema.safeParse({ ...base, likelyCauses: ["a", "b", "c", "d", "e", "f"] }).success).toBe(false);
  });
});

describe("checkAgreement", () => {
  it("agrees on the same language with confidence one tier apart", () => {
    expect(checkAgreement(base, { ...base, confidence: "medium" })).toBe(true);
  });

  it("ignores language casing", () => {
    expect(checkAgreement(base, { ...base, language: "python" })).toBe(true);
  });

  it("disagrees when confidence is two tiers apart", () => {
    expect(checkAgreement(base, { ...base, confidence: "low" })).toBe(false);
  });

  it("disagrees when the detected language differs", () => {
    expect(checkAgreement(base, { ...base, language: "JavaScript" })).toBe(false);
  });
});
