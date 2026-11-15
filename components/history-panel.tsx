"use client";

import { Clock, Trash2, History, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { relativeTime } from "@/lib/utils";
import type { HistoryEntry } from "@/lib/types";

interface HistoryPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entries: HistoryEntry[];
  onLoad: (entry: HistoryEntry) => void;
  onClear: () => void;
}

export function HistoryPanel({ open, onOpenChange, entries, onLoad, onClear }: HistoryPanelProps) {
  function handleLoad(entry: HistoryEntry) {
    onLoad(entry);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="max-w-[540px]">
        {/* Title bar */}
        <div className="flex items-center gap-2 border-b border-border py-3.5 pl-[18px] pr-3.5">
          <Clock className="h-4 w-4 text-muted-foreground" strokeWidth={1.85} />
          <DialogTitle>History</DialogTitle>
          <span className="font-mono text-xs text-muted-foreground">({entries.length} / 20)</span>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" className="ml-auto h-[30px] w-[30px] [&_svg]:size-[15px]" aria-label="Close">
              <X />
            </Button>
          </DialogClose>
        </div>

        {entries.length === 0 ? (
          <div className="flex flex-col items-center gap-2.5 px-6 py-12 text-center">
            <Clock className="h-11 w-11 text-muted-foreground/35" strokeWidth={1.25} />
            <p className="text-sm font-medium">No history yet</p>
            <p className="text-[13px] text-muted-foreground">Analyses will appear here after you submit</p>
          </div>
        ) : (
          <ul className="flex max-h-[420px] flex-col gap-0.5 overflow-y-auto p-1.5">
            {entries.map((entry) => (
              <li key={entry.id}>
                <button
                  onClick={() => handleLoad(entry)}
                  className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-accent"
                >
                  <Badge className="h-[22px] w-[84px] flex-none justify-center text-[11.5px]">{entry.language}</Badge>
                  <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      {relativeTime(entry.timestamp)}
                      {entry.useMultiModel && (
                        <span className="rounded bg-info/10 px-[5px] font-mono text-[10px] leading-4 text-info">multi</span>
                      )}
                    </span>
                    <span className="truncate font-mono text-xs">{entry.tracePreview}</span>
                  </span>
                  <History className="h-[15px] w-[15px] flex-none text-muted-foreground opacity-50 transition-all group-hover:text-primary group-hover:opacity-100" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border py-2.5 pl-2.5 pr-3">
          <Button variant="destructive" size="sm" onClick={onClear} disabled={entries.length === 0}>
            <Trash2 />
            Clear history
          </Button>
          <span className="text-[11.5px] text-muted-foreground">Stored in this browser only</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
