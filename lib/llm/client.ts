import Groq from "groq-sdk";
import { LLMResponseSchema, type LLMResponse } from "@/lib/llm/schema";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/prompts";
import { MODELS, type ModelId } from "@/lib/llm/models";

// ─────────────────────────────────────────────────────────────────────────────
// LLM client
//
//  1. Build prompt
//  2. Call Groq with JSON mode enabled
//  3. Strip markdown fences (defensive — some models add them despite instructions)
//  4. Parse JSON
//  5. Validate with Zod — throws if the response doesn't match the schema
//  6. Retry once if the output was malformed
// ─────────────────────────────────────────────────────────────────────────────

// Strip ```json ... ``` or ``` ... ``` wrappers that some models add despite instructions
function stripFences(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

// Models occasionally return malformed JSON or drop a required key.
// Retry once on those (cheap, usually fixes it); network/API errors are not retried.
const MAX_ATTEMPTS = 2;

function isMalformedOutput(error: unknown): boolean {
  return error instanceof SyntaxError || (error instanceof Error && error.name === "ZodError");
}

export async function analyzeTrace(
  model: ModelId,
  stackTrace: string,
  codeContext?: string,
  temperature = 0.3
): Promise<LLMResponse> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await requestAnalysis(model, stackTrace, codeContext, temperature);
    } catch (error) {
      if (attempt >= MAX_ATTEMPTS || !isMalformedOutput(error)) throw error;
      console.warn(`${MODELS[model].label} returned invalid output, retrying (attempt ${attempt + 1})`);
    }
  }
}

async function requestAnalysis(
  model: ModelId,
  stackTrace: string,
  codeContext: string | undefined,
  temperature: number
): Promise<LLMResponse> {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const completion = await groq.chat.completions.create({
    model: MODELS[model].apiId,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: buildSystemPrompt() },
      { role: "user", content: buildUserPrompt(stackTrace, codeContext) },
    ],
    temperature,
    // Both models reason before answering: keep the reasoning out of the
    // content and leave room for it in the token budget
    reasoning_format: "hidden",
    max_tokens: 4096,
  });

  const raw = completion.choices[0]?.message?.content ?? "";
  const parsed = JSON.parse(stripFences(raw));
  return LLMResponseSchema.parse(parsed);
}

// Agreement heuristic: two models "agree" if they identified the same language
// and their confidence levels are within one tier of each other.
// This is intentionally simple — the goal is to flag major disagreements,
// not to do semantic similarity scoring.
const CONFIDENCE_RANK: Record<string, number> = { high: 2, medium: 1, low: 0 };

export function checkAgreement(a: LLMResponse, b: LLMResponse): boolean {
  const sameLanguage = a.language.toLowerCase() === b.language.toLowerCase();
  const confidenceDiff = Math.abs(CONFIDENCE_RANK[a.confidence] - CONFIDENCE_RANK[b.confidence]);
  return sameLanguage && confidenceDiff <= 1;
}
