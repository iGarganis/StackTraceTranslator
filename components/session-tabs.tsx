"use client";

import { useRef, useEffect } from "react";
import { Plus, X, Terminal } from "lucide-react";
import { cn, languageTag, relativeTime } from "@/lib/utils";
import type { HistoryEntry } from "@/lib/types";

interface SessionTabsProps {
  entries: HistoryEntry[];
  activeId: string | null;
  onSelect: (entry: HistoryEntry) => void;
  onRemove: (id: string) => void;
  onNew: () => void;
}

export function SessionTabs({ entries, activeId, onSelect, onRemove, onNew }: SessionTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  // Track IDs that existed on mount so only genuinely new tabs animate
  const seenIdsRef = useRef<Set<string>>(new Set());
  if (seenIdsRef.current.size === 0 && entries.length > 0) {
    entries.forEach((e) => seenIdsRef.current.add(e.id));
  }

  // When a session becomes active, scroll its tab into view
  useEffect(() => {
    if (!activeId || !scrollRef.current) return;
    const activeTab = scrollRef.current.querySelector(`[data-id="${activeId}"]`);
    activeTab?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
  }, [activeId]);

  return (
    <div className="flex h-11 border-b border-border bg-surface">
      <div
        ref={scrollRef}
        role="tablist"
        className="scrollbar-none flex min-w-0 flex-1 overflow-x-auto"
      >
        {entries.length === 0 && (
          <div className="flex items-center gap-2 px-4 text-[13px] text-muted-foreground">
            <Terminal className="h-3.5 w-3.5" />
            No sessions yet — submit a trace to start
          </div>
        )}

        {entries.map((entry) => {
          const isActive = entry.id === activeId;
          const isNewTab = !seenIdsRef.current.has(entry.id);
          if (isNewTab) seenIdsRef.current.add(entry.id);
          const preview =
            entry.tracePreview.length > 22 ? entry.tracePreview.slice(0, 22) + "…" : entry.tracePreview;

          return (
            <div
              key={entry.id}
              data-id={entry.id}
              title={`${entry.language} · ${relativeTime(entry.timestamp)}\n${entry.tracePreview}`}
              className={cn(
                "group relative flex max-w-[228px] flex-none items-center gap-0.5 border-r border-border pl-1 pr-1.5",
                "transition-colors duration-150",
                isNewTab && "animate-slide-in",
                isActive
                  ? "bg-card text-foreground"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
              )}
            >
              <button
                role="tab"
                aria-selected={isActive}
                onClick={() => onSelect(entry)}
                className="flex h-full min-w-0 items-center gap-2 pl-2 pr-1"
              >
                <span
                  className={cn(
                    "rounded px-[5px] py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide",
                    isActive ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                  )}
                >
                  {languageTag(entry.language)}
                </span>
                <span className="truncate font-mono text-xs">{preview}</span>
              </button>

              <button
                onClick={() => onRemove(entry.id)}
                aria-label="Close session"
                title="Close session"
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground transition-opacity duration-150 hover:bg-accent",
                  isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                )}
              >
                <X className="h-3 w-3" strokeWidth={2.25} />
              </button>

              {isActive && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-primary" />}
            </div>
          );
        })}
      </div>

      {/* New session — pinned to the right */}
      <button
        onClick={onNew}
        title="New session"
        className="flex flex-none items-center gap-1.5 border-l border-border px-3.5 text-[13px] font-medium text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-accent-foreground"
      >
        <Plus className="h-3.5 w-3.5" />
        New
      </button>
    </div>
  );
}
