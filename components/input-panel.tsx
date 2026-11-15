"use client";

import { useState, useRef } from "react";
import { ChevronDown, Zap, Loader2, Code2, Link2, Check, RotateCcw, ArrowDown, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { MODELS } from "@/lib/llm/models";
import { STACK_TRACE_INPUT_ID } from "@/lib/sample-trace";
import { cn } from "@/lib/utils";

interface InputPanelProps {
  stackTrace: string;
  codeContext: string;
  useMultiModel: boolean;
  isLoading: boolean;
  shareLinkCopied: boolean;
  errorLine: number | null;
  onStackTraceChange: (value: string) => void;
  onCodeContextChange: (value: string) => void;
  onMultiModelChange: (value: boolean) => void;
  onSubmit: () => void;
  onCopyShareLink: () => void;
  onNew: () => void;
}

const MAX_CHARS = 10_000;

const PLACEHOLDER = `Traceback (most recent call last):
  File "app.py", line 14, in <module>
    total = order["price"] * qty
KeyError: 'price'

Paste an error or stack trace…`;

export function InputPanel({
  stackTrace,
  codeContext,
  useMultiModel,
  isLoading,
  shareLinkCopied,
  errorLine,
  onStackTraceChange,
  onCodeContextChange,
  onMultiModelChange,
  onSubmit,
  onCopyShareLink,
  onNew,
}: InputPanelProps) {
  const [codeContextOpen, setCodeContextOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function jumpToErrorLine() {
    const el = textareaRef.current;
    if (!el || !errorLine) return;
    const lines = el.value.split("\n");
    const start = lines.slice(0, errorLine - 1).join("\n").length + (errorLine > 1 ? 1 : 0);
    const end = start + (lines[errorLine - 1]?.length ?? 0);
    el.focus();
    el.setSelectionRange(start, end);
    // Scroll the textarea so the selected line is visible
    const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 18;
    el.scrollTop = (errorLine - 3) * lineHeight;
  }

  const traceLength = stackTrace.length;
  const isOverLimit = traceLength > MAX_CHARS;
  const canSubmit = stackTrace.trim().length >= 10 && !isOverLimit && !isLoading;

  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && canSubmit) {
      e.preventDefault();
      onSubmit();
    }
  }

  return (
    <div className="flex flex-col gap-3.5 p-5">
      {/* Label + character counter */}
      <div className="flex items-center justify-between">
        <label
          htmlFor={STACK_TRACE_INPUT_ID}
          className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
        >
          Input
        </label>
        <span
          className={cn(
            "font-mono text-[11px] tabular-nums transition-colors",
            isOverLimit ? "text-destructive" : "text-muted-foreground"
          )}
        >
          {traceLength.toLocaleString("en-US")} / {MAX_CHARS.toLocaleString("en-US")}
        </span>
      </div>

      {/* Stack trace textarea */}
      <div className="flex flex-col gap-2">
        <Textarea
          id={STACK_TRACE_INPUT_ID}
          ref={textareaRef}
          value={stackTrace}
          onChange={(e) => onStackTraceChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={PLACEHOLDER}
          aria-invalid={isOverLimit}
          className={cn("min-h-[280px]", isOverLimit && "border-destructive focus:border-destructive")}
          disabled={isLoading}
        />

        {isOverLimit && (
          <p role="alert" className="flex items-center gap-1.5 text-xs text-destructive">
            <AlertCircle className="h-[13px] w-[13px]" />
            Input exceeds the 10,000 character limit.
          </p>
        )}

        {errorLine && !isOverLimit && (
          <button
            type="button"
            onClick={jumpToErrorLine}
            className="flex items-center gap-1.5 self-start py-0.5 text-xs font-medium text-warning transition-opacity hover:opacity-80"
          >
            <ArrowDown className="h-[13px] w-[13px]" />
            Error on line <span className="font-mono">{errorLine}</span>
          </button>
        )}
      </div>

      {/* Optional code context */}
      <Collapsible
        open={codeContextOpen}
        onOpenChange={setCodeContextOpen}
        className="overflow-hidden rounded-lg border border-border"
      >
        <CollapsibleTrigger asChild>
          <button className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-accent">
            <Code2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="text-[13px] font-medium">Add code context</span>
            <span className="flex-1 truncate text-xs text-muted-foreground">(optional — improves accuracy)</span>
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-150",
                codeContextOpen && "rotate-180"
              )}
            />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent className="animate-fade-up px-3 pb-3">
          <Textarea
            value={codeContext}
            onChange={(e) => onCodeContextChange(e.target.value)}
            placeholder="Paste the function or file around the failing line…"
            aria-label="Code context"
            className="min-h-[120px] text-xs"
            disabled={isLoading}
          />
        </CollapsibleContent>
      </Collapsible>

      {/* Multi-model switch */}
      <label className="flex cursor-pointer select-none items-center gap-2.5 text-[13px]">
        <button
          type="button"
          role="switch"
          aria-checked={useMultiModel}
          onClick={() => onMultiModelChange(!useMultiModel)}
          disabled={isLoading}
          className={cn(
            "relative h-5 w-[34px] shrink-0 rounded-full transition-colors duration-150",
            "disabled:cursor-not-allowed disabled:opacity-50",
            useMultiModel ? "bg-primary" : "bg-input"
          )}
        >
          <span
            className={cn(
              "absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.3)] transition-transform duration-150",
              useMultiModel && "translate-x-3.5"
            )}
          />
        </button>
        <span>
          Multi-model{" "}
          <span className="text-muted-foreground">
            ({MODELS.primary.name} + {MODELS.secondary.name})
          </span>
        </span>
      </label>

      {/* Submit */}
      <Button
        onClick={onSubmit}
        disabled={!canSubmit}
        className={cn(
          "h-10 w-full gap-2 rounded-lg text-sm",
          "disabled:opacity-100",
          isLoading
            ? "bg-primary/70 text-primary-foreground"
            : !canSubmit && "bg-muted text-muted-foreground/70"
        )}
      >
        {isLoading ? (
          <>
            <Loader2 className="animate-spin" strokeWidth={2.25} />
            Analyzing…
          </>
        ) : (
          <>
            <Zap className="fill-current" strokeWidth={0} />
            Explain
            <kbd className="ml-1.5 hidden rounded border border-current px-1.5 py-px font-mono text-[10.5px] opacity-55 sm:inline">
              Ctrl ↵
            </kbd>
          </>
        )}
      </Button>

      {/* Secondary actions — only when there's a trace to act on */}
      {stackTrace.length > 0 && (
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCopyShareLink}
            disabled={isLoading}
            className={cn(shareLinkCopied && "text-success hover:text-success")}
          >
            {shareLinkCopied ? (
              <>
                <Check strokeWidth={2.25} /> Copied!
              </>
            ) : (
              <>
                <Link2 /> Copy share link
              </>
            )}
          </Button>

          <Button variant="ghost" size="sm" onClick={onNew} disabled={isLoading}>
            <RotateCcw />
            New
          </Button>
        </div>
      )}
    </div>
  );
}
