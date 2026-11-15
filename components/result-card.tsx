"use client";

import { useState, useRef } from "react";
import {
  ChevronDown,
  Copy,
  Check,
  AlertCircle,
  AlertTriangle,
  Lightbulb,
  Wrench,
  Eye,
  RefreshCw,
  GraduationCap,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CodeBlock } from "@/components/code-block";
import { ConfidenceBadge } from "@/components/confidence-badge";
import { useTypewriter } from "@/hooks/use-typewriter";
import { MODELS, PROVIDER, type ModelId } from "@/lib/llm/models";
import { SITE } from "@/lib/site";
import { cn } from "@/lib/utils";
import type { LLMResponse } from "@/lib/llm/schema";

const MODEL_DOT: Record<ModelId, string> = {
  primary: "bg-model-primary",
  secondary: "bg-info",
};

interface ResultCardProps {
  result: LLMResponse;
  model: ModelId;
  /** Multi-model layout: bordered card with a model header, denser type */
  framed?: boolean;
  fresh?: boolean;
  onRetry?: () => void;
}

export function ResultCard({ result, model, framed = false, fresh = false, onRetry }: ResultCardProps) {
  const [assumptionsOpen, setAssumptionsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [beginnerMode, setBeginnerMode] = useState(false);
  const [simplifying, setSimplifying] = useState(false);
  const simplifiedRef = useRef<{ explanation: string; rootCause: string; likelyCauses: string[] } | null>(null);

  const active = beginnerMode && simplifiedRef.current ? simplifiedRef.current : result;
  const animate = fresh && !beginnerMode;

  const explanationText = useTypewriter(active.explanation, animate);
  const rootCauseText = useTypewriter(active.rootCause, animate);
  const explanationTyping = animate && explanationText !== active.explanation;
  const rootCauseTyping = animate && !explanationTyping && rootCauseText !== active.rootCause;

  const meta = MODELS[model];

  async function handleBeginnerToggle() {
    if (beginnerMode) { setBeginnerMode(false); return; }
    if (simplifiedRef.current) { setBeginnerMode(true); return; }
    setSimplifying(true);
    try {
      const res = await fetch("/api/simplify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          explanation: result.explanation,
          rootCause: result.rootCause,
          likelyCauses: result.likelyCauses,
          language: result.language,
        }),
      });
      if (res.ok) {
        simplifiedRef.current = await res.json();
        setBeginnerMode(true);
      }
    } finally {
      setSimplifying(false);
    }
  }

  async function handleCopyMarkdown() {
    await navigator.clipboard.writeText(buildMarkdown(result));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <article
      className={cn(
        "flex min-w-0 flex-col",
        framed ? "gap-[18px] rounded-[10px] border border-border bg-surface p-4" : "gap-[22px]"
      )}
    >
      {/* Model header (multi-model only) */}
      {framed && (
        <div className="-mb-1 flex items-center gap-2 border-b border-border pb-3 text-[13px] font-medium">
          <span className={cn("h-2 w-2 rounded-full", MODEL_DOT[model])} />
          {meta.name}
          <span className="font-mono text-xs font-normal text-muted-foreground">({meta.label})</span>
        </div>
      )}

      {/* Language + confidence + model */}
      <div className="flex animate-fade-up flex-wrap items-center gap-2">
        <Badge>{result.language}</Badge>
        <ConfidenceBadge confidence={result.confidence} />
        {!framed && (
          <span className="ml-auto text-xs text-muted-foreground">
            via {PROVIDER} <span className="font-mono">/ {meta.label}</span>
          </span>
        )}
      </div>

      <Section icon={Lightbulb} title="What happened" delay={40}>
        <p className="text-sm leading-[1.65]">
          <InlineCode text={explanationText} />
          {explanationTyping && <span className="caret" />}
        </p>
      </Section>

      <Section icon={AlertCircle} title="Root cause" delay={80}>
        <p className="text-sm leading-[1.65]">
          <InlineCode text={rootCauseText} />
          {rootCauseTyping && <span className="caret" />}
        </p>
      </Section>

      <Section icon={Eye} title="Likely causes" delay={120}>
        <ol className="flex flex-col gap-2">
          {active.likelyCauses.map((cause, i) => (
            <li key={i} className="flex gap-2.5 text-sm leading-relaxed">
              <span className="mt-px flex h-5 w-5 flex-none items-center justify-center rounded-[5px] bg-muted font-mono text-[11px] text-muted-foreground">
                {i + 1}
              </span>
              <span>
                <InlineCode text={cause} />
              </span>
            </li>
          ))}
        </ol>
      </Section>

      <Section icon={Wrench} title="Suggested fix" delay={160}>
        <CodeBlock code={result.suggestedFix.code} language={result.suggestedFix.language} compact={framed} />
        <p className="text-[13.5px] leading-relaxed text-muted-foreground">
          <InlineCode text={result.suggestedFix.explanation} />
        </p>
      </Section>

      {/* Assumptions */}
      <Collapsible
        open={assumptionsOpen}
        onOpenChange={setAssumptionsOpen}
        className="animate-fade-up overflow-hidden rounded-lg border border-border [animation-delay:200ms]"
      >
        <CollapsibleTrigger asChild>
          <button className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-accent">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-warning" />
            <span className="text-[13px] font-medium">
              Assumptions{" "}
              <span className="font-mono font-normal text-muted-foreground">({result.assumptions.length})</span>
            </span>
            <span className="flex-1 truncate text-xs text-muted-foreground">about code the model couldn’t see</span>
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-150",
                assumptionsOpen && "rotate-180"
              )}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <ul className="flex animate-fade-up list-disc flex-col gap-1.5 border-t border-border py-2.5 pl-[34px] pr-3 text-[13px] leading-normal text-muted-foreground">
            {result.assumptions.map((assumption, i) => (
              <li key={i}>
                <InlineCode text={assumption} />
              </li>
            ))}
          </ul>
        </CollapsibleContent>
      </Collapsible>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-1.5 border-t border-border pt-3.5">
        <button
          onClick={handleBeginnerToggle}
          disabled={simplifying}
          aria-pressed={beginnerMode}
          title="Re-phrase without jargon for beginners"
          className={cn(
            "flex h-[30px] items-center gap-1.5 rounded-full border px-3 text-[12.5px] font-medium transition-colors duration-150",
            beginnerMode
              ? "border-primary/45 bg-primary/10 text-primary"
              : "border-input text-foreground hover:bg-accent",
            simplifying && "cursor-wait text-muted-foreground"
          )}
        >
          {simplifying ? (
            <>
              <Loader2 className="h-[13px] w-[13px] animate-spin" strokeWidth={2.25} />
              Simplifying…
            </>
          ) : (
            <>
              <GraduationCap className="h-3.5 w-3.5" />
              {beginnerMode ? "Beginner mode" : "Explain simply"}
            </>
          )}
        </button>

        {onRetry && (
          <Button variant="ghost" size="sm" onClick={onRetry} title="Re-run at higher temperature for a different take">
            <RefreshCw /> Try again
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopyMarkdown}
          className={cn("ml-auto", copied && "text-success hover:text-success")}
        >
          {copied ? (
            <>
              <Check strokeWidth={2.25} /> Copied!
            </>
          ) : (
            <>
              <Copy /> Copy as Markdown
            </>
          )}
        </Button>
      </div>
    </article>
  );
}

// ── Section wrapper ────────────────────────────────────────────────────────────
// Staggered fade-up so sections appear one after another
function Section({
  icon: Icon,
  title,
  children,
  delay = 0,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <section className="flex animate-fade-up flex-col gap-2" style={{ animationDelay: `${delay}ms` }}>
      <h3 className="flex items-center gap-[7px] text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {title}
      </h3>
      {children}
    </section>
  );
}

// ── Inline code ────────────────────────────────────────────────────────────────
// Renders `backtick` spans from the model's text as inline code chips
function InlineCode({ text }: { text: string }) {
  const parts = text.split("`");
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <code key={i} className="rounded bg-muted px-[5px] py-px font-mono text-[0.9em] text-foreground">
            {part}
          </code>
        ) : (
          part
        )
      )}
    </>
  );
}

// ── Markdown serializer ────────────────────────────────────────────────────────
function buildMarkdown(result: LLMResponse): string {
  return `## Stack Trace Analysis

**Language:** ${result.language}
**Confidence:** ${result.confidence}

### What happened
${result.explanation}

### Root Cause
${result.rootCause}

### Likely Causes
${result.likelyCauses.map((c, i) => `${i + 1}. ${c}`).join("\n")}

### Suggested Fix
\`\`\`${result.suggestedFix.language}
${result.suggestedFix.code}
\`\`\`

${result.suggestedFix.explanation}

### Assumptions
${result.assumptions.map((a) => `- ${a}`).join("\n")}

---
*Generated by [${SITE.name}](${SITE.repoUrl})*
`;
}
