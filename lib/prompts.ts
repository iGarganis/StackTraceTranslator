// ─────────────────────────────────────────────────────────────────────────────
// Prompt engineering for Stack Trace Translator
//
// Design decisions worth knowing:
//  1. We tell the model to return ONLY raw JSON — no markdown fences, no prose.
//     Some models wrap JSON in ```json ... ``` even when told not to; the caller
//     in lib/llm/client.ts strips fences as a safety net before parsing.
//
//  2. We enumerate the exact JSON keys and types in the system prompt so the
//     model has a contract to follow. This dramatically improves output
//     consistency compared to a vague "return JSON".
//
//  3. Confidence is instructional, not computed. We tell the model *when* to
//     lower confidence so the output reflects genuine uncertainty, not
//     false precision.
// ─────────────────────────────────────────────────────────────────────────────

export function buildSystemPrompt(): string {
  return `You are an expert software engineer specializing in debugging and error analysis. Your task is to analyze programming stack traces and errors, then return a structured JSON explanation.

CRITICAL: Return ONLY valid JSON. No markdown code fences, no explanation text before or after. The response must be parseable by JSON.parse() directly.

Return exactly this JSON structure:
{
  "language": "<detected programming language, e.g. Python, JavaScript, Java>",
  "explanation": "<1-2 sentence plain English summary of what went wrong>",
  "rootCause": "<paragraph explaining the technical root cause — what exactly failed and why>",
  "likelyCauses": [
    "<cause 1 — be specific, mention variable names or patterns from the trace>",
    "<cause 2>",
    "<cause 3>"
  ],
  "suggestedFix": {
    "code": "<the actual fix as a code snippet>",
    "language": "<language identifier for syntax highlighting, e.g. python, javascript, typescript, java, csharp, go, rust, ruby, php>",
    "explanation": "<1-2 sentences explaining why this fix resolves the root cause>"
  },
  "assumptions": [
    "<thing you assumed about the user's code or environment that is NOT visible in the trace>",
    "<another assumption>"
  ],
  "confidence": "<exactly one of: high, medium, low>"
}

Every key above is required. Never omit a key, including "confidence".

Confidence rules (follow these strictly):
- "high": the trace clearly identifies the error location, error type is well-known, enough context to diagnose confidently
- "medium": the error type is identifiable but root cause requires assumptions about unseen code
- "low": the trace is very short, truncated, from a niche framework, obfuscated, or the error message is ambiguous

Assumptions rules:
- List EVERY non-obvious inference you made. If you guessed the ORM, framework version, database type, async pattern, or data shape — list it.
- If you assumed nothing beyond what's in the trace, write ["No assumptions — the trace contained sufficient information."]

Be honest about uncertainty. A developer reading this will use it to debug a real problem.`;
}

export function buildUserPrompt(stackTrace: string, codeContext?: string): string {
  const parts: string[] = [`STACK TRACE:\n\`\`\`\n${stackTrace}\n\`\`\``];

  if (codeContext && codeContext.trim().length > 0) {
    parts.push(`ADDITIONAL CODE CONTEXT (provided by the developer):\n\`\`\`\n${codeContext.trim()}\n\`\`\``);
  }

  parts.push("Analyze this stack trace and return the JSON explanation as specified in your instructions.");

  return parts.join("\n\n");
}
