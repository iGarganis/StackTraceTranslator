import { z } from "zod";

// This is the single source of truth for what we expect back from every LLM.
// Every model's response is validated against this schema before
// anything reaches the client — if an LLM hallucinates extra fields or returns
// wrong types, Zod catches it here rather than letting bad data propagate.
export const LLMResponseSchema = z.object({
  language: z.string().min(1),
  explanation: z.string().min(1),
  rootCause: z.string().min(1),
  // We ask for exactly 3 in the prompt; allow 1–5 so a slightly non-compliant
  // model doesn't hard-fail the whole request
  likelyCauses: z.array(z.string().min(1)).min(1).max(5),
  suggestedFix: z.object({
    code: z.string(),
    language: z.string().min(1),
    explanation: z.string().min(1),
  }),
  assumptions: z.array(z.string().min(1)),
  confidence: z.enum(["high", "medium", "low"]),
});

export type LLMResponse = z.infer<typeof LLMResponseSchema>;
