import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { analyzeTrace, checkAgreement } from "@/lib/llm/client";
import { MODELS, type ModelId } from "@/lib/llm/models";
import type { LLMResponse } from "@/lib/llm/schema";
import type { AppResponse } from "@/lib/types";

// ─────────────────────────────────────────────────────────────────────────────
// Input validation schema
// We validate on the server even though the client also enforces these limits,
// because the client can always be bypassed (curl, browser devtools, etc.)
// ─────────────────────────────────────────────────────────────────────────────
const RequestSchema = z.object({
  stackTrace: z
    .string()
    .min(10, "Stack trace is too short to analyze")
    .max(10_000, "Stack trace exceeds the 10,000 character limit"),
  codeContext: z.string().max(10_000, "Code context exceeds the 10,000 character limit").optional(),
  useMultiModel: z.boolean().optional().default(false),
  temperature: z.number().min(0).max(1).optional().default(0.3),
});

// Helper to get the client IP — works on Vercel (x-forwarded-for) and locally
function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  // ── 1. Rate limiting ──────────────────────────────────────────────────────
  const ip = getClientIp(req);
  const rateLimit = checkRateLimit(ip);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: "Rate limit exceeded",
        message: `You've used all 20 requests for today. Resets at ${new Date(rateLimit.resetAt).toUTCString()}.`,
        resetAt: rateLimit.resetAt,
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(rateLimit.resetAt),
        },
      }
    );
  }

  // ── 2. Input validation ───────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { stackTrace, codeContext, useMultiModel, temperature } = parsed.data;

  // ── 3. Sanitize input ─────────────────────────────────────────────────────
  // Trim and collapse excessive whitespace to reduce token waste.
  // We don't strip special characters — stack traces legitimately contain
  // angle brackets, quotes, etc.
  const sanitizedTrace = stackTrace.trim();
  const sanitizedContext = codeContext?.trim();

  // ── 4. Call LLM(s) ────────────────────────────────────────────────────────
  const headers = {
    "X-RateLimit-Remaining": String(rateLimit.remaining),
    "X-RateLimit-Reset": String(rateLimit.resetAt),
  };

  try {
    if (useMultiModel) {
      // Run both models in parallel — allSettled so one failure doesn't kill the other
      const [primary, secondary] = await Promise.allSettled([
        analyzeTrace("primary", sanitizedTrace, sanitizedContext, temperature),
        analyzeTrace("secondary", sanitizedTrace, sanitizedContext, temperature),
      ]);

      if (primary.status === "rejected" && secondary.status === "rejected") {
        console.error("Both models failed:", primary.reason, secondary.reason);
        return NextResponse.json(
          { error: "Both models failed to analyze the stack trace. Please try again." },
          { status: 502 }
        );
      }

      // Only one succeeded: return it as a single-model response with a notice
      if (primary.status === "rejected" || secondary.status === "rejected") {
        const [failed, survivor, result, reason]: [ModelId, ModelId, LLMResponse, unknown] =
          primary.status === "fulfilled"
            ? ["secondary", "primary", primary.value, (secondary as PromiseRejectedResult).reason]
            : ["primary", "secondary", (secondary as PromiseFulfilledResult<LLMResponse>).value, primary.reason];

        console.error(`${MODELS[failed].label} failed, falling back to ${MODELS[survivor].label}:`, reason);
        const body: AppResponse = {
          multiModel: false,
          model: survivor,
          result,
          fallback: true,
          fallbackReason: `${MODELS[failed].name} was unavailable`,
        };
        return NextResponse.json(body, { headers });
      }

      const body: AppResponse = {
        multiModel: true,
        results: { primary: primary.value, secondary: secondary.value },
        agreement: checkAgreement(primary.value, secondary.value),
      };
      return NextResponse.json(body, { headers });
    }

    const body: AppResponse = {
      multiModel: false,
      model: "primary",
      result: await analyzeTrace("primary", sanitizedTrace, sanitizedContext, temperature),
    };
    return NextResponse.json(body, { headers });
  } catch (error) {
    // Log the full error server-side but only send a safe message to the client
    console.error("LLM call failed:", error);

    // Detect Zod validation failures vs. network/API errors
    const message =
      error instanceof SyntaxError
        ? "The AI returned an invalid response. Please try again."
        : error instanceof Error && error.name === "ZodError"
          ? "The AI response didn't match the expected format. Please try again."
          : "Failed to analyze the stack trace. Please try again.";

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
