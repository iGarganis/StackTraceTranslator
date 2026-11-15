import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import Groq from "groq-sdk";
import { MODELS } from "@/lib/llm/models";

const RequestSchema = z.object({
  explanation: z.string(),
  rootCause: z.string(),
  likelyCauses: z.array(z.string()),
  language: z.string(),
});

const ResponseSchema = z.object({
  explanation: z.string(),
  rootCause: z.string(),
  likelyCauses: z.array(z.string()),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { explanation, rootCause, likelyCauses, language } = parsed.data;

  const prompt = `You are explaining a ${language} programming error to someone who has never written code before.

Rewrite the following technical analysis in plain, friendly English. Rules:
- No jargon. If you must use a technical term, immediately explain it in parentheses with a simple analogy.
- Use short sentences. Maximum 2 sentences per field.
- Be warm and reassuring, not alarming.
- Keep the meaning accurate — just make it accessible.

Original analysis:
EXPLANATION: ${explanation}
ROOT CAUSE: ${rootCause}
LIKELY CAUSES:
${likelyCauses.map((c, i) => `${i + 1}. ${c}`).join("\n")}

Return ONLY valid JSON in this exact shape:
{
  "explanation": "...",
  "rootCause": "...",
  "likelyCauses": ["...", "...", "..."]
}`;

  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const completion = await groq.chat.completions.create({
      model: MODELS.primary.apiId,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
      reasoning_format: "hidden",
      max_tokens: 2048,
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const data = ResponseSchema.parse(JSON.parse(raw));
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Simplification failed. Please try again." }, { status: 502 });
  }
}
