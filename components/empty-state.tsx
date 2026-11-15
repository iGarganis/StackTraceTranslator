import { ArrowRight, Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";

const LANGUAGES = ["Python", "JavaScript", "TypeScript", "Java", "C#", "Go", "Rust", "Ruby", "PHP"];

interface EmptyStateProps {
  onTrySample?: () => void;
}

export function EmptyState({ onTrySample }: EmptyStateProps) {
  return (
    <div className="flex min-h-[520px] animate-fade-up flex-col items-center justify-center gap-7 px-2 py-8 text-center">
      {/* Illustration: raw trace → structured analysis */}
      <div aria-hidden="true" className="flex flex-wrap items-center justify-center gap-3.5">
        <div className="w-[220px] rounded-[10px] border border-border bg-code-bg p-3 text-left font-mono text-[10.5px] leading-[1.7] text-muted-foreground/80">
          <div className="mb-2 flex gap-[5px]">
            {[0, 1, 2].map((i) => (
              <span key={i} className="h-[7px] w-[7px] rounded-full bg-border" />
            ))}
          </div>
          <div>at render (App.tsx:24:18)</div>
          <div>at map (Array.prototype)</div>
          <div className="-mx-1.5 mt-0.5 rounded bg-destructive/10 px-1.5 py-0.5 text-destructive">
            TypeError: Cannot read…
          </div>
        </div>

        <ArrowRight className="h-4 w-7 text-muted-foreground/60" strokeWidth={1.5} />

        <div className="flex w-[220px] flex-col gap-2 rounded-[10px] border border-border bg-surface p-3 text-left">
          <div className="flex gap-1.5">
            <span className="rounded bg-secondary px-1.5 text-[9.5px] leading-4 text-muted-foreground">TypeScript</span>
            <span className="rounded bg-success/10 px-1.5 text-[9.5px] leading-4 text-success">High confidence</span>
          </div>
          <div className="h-1.5 w-[88%] rounded-full bg-muted-foreground/25" />
          <div className="h-1.5 w-[64%] rounded-full bg-muted-foreground/20" />
          <div className="flex h-[22px] items-center gap-1 rounded-[5px] border border-border bg-code-bg px-2">
            <span className="h-1 w-[22px] rounded-sm bg-destructive/60" />
            <span className="h-1 w-10 rounded-sm bg-info/60" />
            <span className="h-1 w-[30px] rounded-sm bg-primary/60" />
          </div>
        </div>
      </div>

      <div className="flex max-w-[420px] flex-col gap-2">
        <h3 className="text-xl font-semibold tracking-tight">Paste a stack trace, get clarity in seconds</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Paste any error or stack trace into the input. You’ll get what happened, the root cause and a suggested fix.
        </p>
      </div>

      <div className="flex max-w-[460px] flex-wrap justify-center gap-1.5">
        {LANGUAGES.map((lang) => (
          <span
            key={lang}
            className="inline-flex h-[22px] items-center rounded-md border border-border px-2 font-mono text-[11px] text-muted-foreground"
          >
            {lang}
          </span>
        ))}
      </div>

      <div className="flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Kbd>Ctrl</Kbd>
          <Kbd>↵</Kbd> to explain
        </span>
        <span className="flex items-center gap-1">
          <Kbd>Ctrl</Kbd>
          <Kbd>K</Kbd> for commands
        </span>
      </div>

      {onTrySample && (
        <Button variant="outline" size="sm" onClick={onTrySample}>
          <Code2 />
          Try a sample trace
        </Button>
      )}
    </div>
  );
}
