"use client";

import { CheckCircle2, AlertTriangle, Info, Loader2 } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { ResultCard } from "@/components/result-card";
import { MODELS, PROVIDER } from "@/lib/llm/models";
import { cn } from "@/lib/utils";
import type { AnalysisError, AppResponse } from "@/lib/types";
export type { AppResponse } from "@/lib/types";

interface OutputPanelProps {
  response: AppResponse | null;
  isLoading: boolean;
  error: AnalysisError | null;
  useMultiModel: boolean;
  fresh?: boolean;
  onRetry?: () => void;
  onTrySample?: () => void;
}

export function OutputPanel({
  response,
  isLoading,
  error,
  useMultiModel,
  fresh = false,
  onRetry,
  onTrySample,
}: OutputPanelProps) {
  if (isLoading) return <LoadingSkeleton multi={useMultiModel} />;

  if (error) {
    return (
      <div role="alert" className="flex animate-fade-up gap-3 rounded-[10px] border border-destructive/35 bg-destructive/[0.08] px-4 py-3.5">
        <AlertTriangle className="mt-px h-[18px] w-[18px] flex-none text-destructive" />
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold">Analysis failed</p>
          <p className="text-[13.5px] leading-normal text-muted-foreground">{error.message}</p>
          {error.status && (
            <p className="mt-1 font-mono text-[11px] text-destructive/85">HTTP {error.status}</p>
          )}
        </div>
      </div>
    );
  }

  if (!response) return <EmptyState onTrySample={onTrySample} />;

  if (response.multiModel) {
    const { results, agreement } = response;
    return (
      <div className="flex flex-col gap-4">
        <div
          role="status"
          className={cn(
            "flex animate-fade-up items-center gap-2.5 rounded-lg border px-3 py-2.5 text-[13px]",
            agreement ? "border-success/30 bg-success/[0.08]" : "border-warning/30 bg-warning/[0.08]"
          )}
        >
          {agreement ? (
            <CheckCircle2 className="h-[15px] w-[15px] shrink-0 text-success" />
          ) : (
            <AlertTriangle className="h-[15px] w-[15px] shrink-0 text-warning" />
          )}
          <span className="font-medium">
            {agreement ? "Both models agree on the diagnosis" : "Models disagree — review both responses"}
          </span>
          <span className="ml-auto hidden text-xs text-muted-foreground sm:inline">
            {agreement ? "Same root cause" : "Different root cause"}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          <ResultCard
            result={results.primary}
            model="primary"
            framed
            fresh={fresh}
            onRetry={onRetry}
          />
          <ResultCard result={results.secondary} model="secondary" framed fresh={fresh} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {response.fallback && (
        <div
          role="status"
          className="flex animate-fade-up items-center gap-2.5 rounded-lg border border-warning/30 bg-warning/[0.08] px-3 py-2.5 text-[13px]"
        >
          <Info className="h-[15px] w-[15px] shrink-0 text-warning" />
          <span>
            <span className="font-medium">{response.fallbackReason}</span>{" "}
            <span className="text-muted-foreground">
              — showing result from {MODELS[response.model].name} ({MODELS[response.model].label}) only
            </span>
          </span>
        </div>
      )}
      <ResultCard
        result={response.result}
        model={response.model}
        fresh={fresh}
        onRetry={onRetry}
      />
    </div>
  );
}

function LoadingSkeleton({ multi }: { multi: boolean }) {
  return (
    <div aria-busy="true" className="flex flex-col gap-6">
      <div className="flex items-center gap-2.5">
        <Loader2 className="h-[15px] w-[15px] animate-spin text-primary" strokeWidth={2.25} />
        <span className="text-sm font-medium">Analyzing</span>
        <span className="font-mono text-xs text-muted-foreground">
          {multi
            ? `${MODELS.primary.label} + ${MODELS.secondary.label}`
            : `${PROVIDER.toLowerCase()} / ${MODELS.primary.label}`}
        </span>
      </div>

      <div className="flex gap-2">
        <div className="shimmer h-6 w-16 rounded-md" />
        <div className="shimmer h-6 w-[120px] rounded-md" />
      </div>

      {["64%", "48%", "72%"].map((w) => (
        <div key={w} className="flex flex-col gap-2.5">
          <div className="shimmer h-2.5 w-24 rounded" />
          <div className="shimmer h-3 w-full rounded" />
          <div className="shimmer h-3 w-[92%] rounded" />
          <div className="shimmer h-3 rounded" style={{ width: w }} />
        </div>
      ))}

      <div className="overflow-hidden rounded-lg border border-border">
        <div className="h-[34px] border-b border-border bg-surface" />
        <div className="flex flex-col gap-2.5 bg-code-bg p-4">
          <div className="shimmer h-3 w-[46%] rounded" />
          <div className="shimmer ml-6 h-3 w-[78%] rounded" />
          <div className="shimmer ml-6 h-3 w-[60%] rounded" />
          <div className="shimmer ml-6 h-3 w-[34%] rounded" />
        </div>
      </div>
    </div>
  );
}
