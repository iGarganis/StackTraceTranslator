"use client";

import { useState, useCallback, useEffect } from "react";
import { InputPanel } from "@/components/input-panel";
import { OutputPanel } from "@/components/output-panel";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { HistoryPanel } from "@/components/history-panel";
import { CommandPalette } from "@/components/command-palette";
import { SessionTabs } from "@/components/session-tabs";
import { ToastContainer } from "@/components/toast";
import { Kbd } from "@/components/ui/kbd";
import { useHistory } from "@/hooks/use-history";
import { useShare } from "@/hooks/use-share";
import { useToast } from "@/hooks/use-toast";
import { SAMPLE_TRACE, STACK_TRACE_INPUT_ID } from "@/lib/sample-trace";
import { findErrorLocation } from "@/lib/utils";
import type { AnalysisError, AppResponse, HistoryEntry } from "@/lib/types";

export function MainApp() {
  // ── Form state ────────────────────────────────────────────────────────────
  const [stackTrace, setStackTrace] = useState("");
  const [codeContext, setCodeContext] = useState("");
  const [useMultiModel, setUseMultiModel] = useState(false);

  // ── Result state ──────────────────────────────────────────────────────────
  const [response, setResponse] = useState<AppResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AnalysisError | null>(null);

  // ── Active session tab ────────────────────────────────────────────────────
  // null = new unsaved session, string = ID of a saved history entry
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // ── Fresh flag — true only immediately after a new analysis completes ─────
  // Drives the typewriter animation; cleared on session switch
  const [freshResult, setFreshResult] = useState(false);

  // ── UI overlays ───────────────────────────────────────────────────────────
  const [historyOpen, setHistoryOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  // ── Cross-cutting hooks ───────────────────────────────────────────────────
  const { entries, addEntry, removeEntry, clearHistory } = useHistory();
  const { toasts, toast, dismiss } = useToast();
  const { copyShareLink, copied: shareLinkCopied } = useShare({
    onLoad: ({ stackTrace: st, codeContext: cc }) => {
      setStackTrace(st);
      if (cc) setCodeContext(cc);
      setActiveSessionId(null);
      toast("Share link loaded — form prefilled");
    },
  });

  // Auto-select the most recent session on first load if history exists
  useEffect(() => {
    if (entries.length > 0 && activeSessionId === null) {
      const latest = entries[0];
      setActiveSessionId(latest.id);
      setStackTrace(latest.stackTrace);
      setCodeContext(latest.codeContext ?? "");
      setUseMultiModel(latest.useMultiModel);
      setResponse(latest.response);
    }
    // Only run once after history loads from localStorage
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries.length > 0]);

  // ── Global keyboard shortcuts ─────────────────────────────────────────────
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // ── Action handlers ───────────────────────────────────────────────────────
  // Derived — null when no result yet or no line found in the trace
  const errorLocation = response ? findErrorLocation(stackTrace) : null;

  const runAnalysis = useCallback(async (temperature: number) => {
    if (!stackTrace.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setResponse(null);
    setFreshResult(false);

    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stackTrace,
          codeContext: codeContext.trim() || undefined,
          useMultiModel,
          temperature,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const message = data.message ?? data.error ?? "Something went wrong. Please try again.";
        setError({ message, status: res.status });
        if (res.status === 429) toast(message, "error");
        return;
      }

      const appResponse = data as AppResponse;
      setResponse(appResponse);
      setFreshResult(true);
      const newId = addEntry(stackTrace, codeContext.trim() || undefined, useMultiModel, appResponse);
      setActiveSessionId(newId);
    } catch {
      setError({ message: "Network error — could not reach the server. Please check your connection." });
    } finally {
      setIsLoading(false);
    }
  }, [stackTrace, codeContext, useMultiModel, isLoading, addEntry, toast]);

  const handleSubmit = useCallback(() => runAnalysis(0.3), [runAnalysis]);
  const handleRetry  = useCallback(() => runAnalysis(0.8), [runAnalysis]);

  const handleNew = useCallback(() => {
    setStackTrace("");
    setCodeContext("");
    setResponse(null);
    setError(null);
    setActiveSessionId(null);
  }, []);

  const handleTrySample = useCallback(() => {
    setStackTrace(SAMPLE_TRACE);
    document.getElementById(STACK_TRACE_INPUT_ID)?.focus();
  }, []);

  const handleLoadSession = useCallback((entry: HistoryEntry) => {
    setStackTrace(entry.stackTrace);
    setCodeContext(entry.codeContext ?? "");
    setUseMultiModel(entry.useMultiModel);
    setResponse(entry.response);
    setError(null);
    setActiveSessionId(entry.id);
    setFreshResult(false);
  }, []);

  const handleRemoveSession = useCallback((id: string) => {
    removeEntry(id);
    // If the deleted tab was active, switch to the next available or go blank
    if (id === activeSessionId) {
      const remaining = entries.filter((e) => e.id !== id);
      if (remaining.length > 0) {
        handleLoadSession(remaining[0]);
      } else {
        handleNew();
      }
    }
  }, [removeEntry, activeSessionId, entries, handleLoadSession, handleNew]);

  const handleClearHistory = useCallback(() => {
    clearHistory();
    setActiveSessionId(null);
    setStackTrace("");
    setCodeContext("");
    setResponse(null);
    toast("History cleared");
  }, [clearHistory, toast]);

  const handleCopyShareLink = useCallback(() => {
    if (!stackTrace.trim()) return;
    copyShareLink(stackTrace, codeContext.trim() || undefined);
    toast("Share link copied to clipboard");
  }, [copyShareLink, stackTrace, codeContext, toast]);

  const handleToggleMultiModel = useCallback(() => {
    setUseMultiModel((v) => !v);
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <Header historyCount={entries.length} onHistoryOpen={() => setHistoryOpen(true)} />

      <main className="mx-auto w-full max-w-[1248px] flex-1 px-3 pt-6 sm:px-6">
        {/* One connected card: session tabs on top, analysis + input below */}
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
          <SessionTabs
            entries={entries}
            activeId={activeSessionId}
            onSelect={handleLoadSession}
            onRemove={handleRemoveSession}
            onNew={handleNew}
          />

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
            {/* Analysis — left on desktop, below the input on mobile */}
            <section
              aria-label="Analysis"
              className="order-last flex min-w-0 flex-col gap-4 px-3 pb-6 pt-5 sm:px-6 lg:order-none lg:border-r lg:border-border"
            >
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Analysis
              </h2>
              <OutputPanel
                response={response}
                isLoading={isLoading}
                error={error}
                useMultiModel={useMultiModel}
                fresh={freshResult}
                onRetry={handleRetry}
                onTrySample={handleTrySample}
              />
            </section>

            {/* Input — right on desktop, first on mobile */}
            <section aria-label="Input" className="min-w-0 border-b border-border lg:border-b-0">
              <InputPanel
                stackTrace={stackTrace}
                codeContext={codeContext}
                useMultiModel={useMultiModel}
                isLoading={isLoading}
                shareLinkCopied={shareLinkCopied}
                errorLocation={errorLocation}
                onStackTraceChange={setStackTrace}
                onCodeContextChange={setCodeContext}
                onMultiModelChange={setUseMultiModel}
                onSubmit={handleSubmit}
                onCopyShareLink={handleCopyShareLink}
                onNew={handleNew}
              />
            </section>
          </div>
        </div>

        <p className="mt-3.5 hidden items-center justify-center gap-1.5 text-xs text-muted-foreground sm:flex">
          <Kbd>Ctrl</Kbd>
          <Kbd>K</Kbd>
          command palette
        </p>
      </main>

      <Footer />

      <HistoryPanel
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        entries={entries}
        onLoad={handleLoadSession}
        onClear={handleClearHistory}
      />

      <CommandPalette
        open={commandOpen}
        onOpenChange={setCommandOpen}
        useMultiModel={useMultiModel}
        historyCount={entries.length}
        onNew={handleNew}
        onToggleMultiModel={handleToggleMultiModel}
        onClearHistory={handleClearHistory}
      />

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
