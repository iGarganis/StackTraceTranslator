"use client";

import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { Plus, Sun, Moon, Layers, Trash2, Search } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  useMultiModel: boolean;
  historyCount: number;
  onNew: () => void;
  onToggleMultiModel: () => void;
  onClearHistory: () => void;
}

interface Command {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  run: () => void;
  danger?: boolean;
}

export function CommandPalette({
  open,
  onOpenChange,
  useMultiModel,
  historyCount,
  onNew,
  onToggleMultiModel,
  onClearHistory,
}: CommandPaletteProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme !== "light";
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset search and focus the input every time the palette opens
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  const commands: Command[] = [
    { id: "new", label: "New analysis", icon: Plus, run: onNew },
    {
      id: "multi-model",
      label: useMultiModel ? "Disable multi-model" : "Enable multi-model",
      icon: Layers,
      run: onToggleMultiModel,
    },
    {
      id: "theme",
      label: isDark ? "Switch to light mode" : "Switch to dark mode",
      icon: isDark ? Sun : Moon,
      run: () => setTheme(isDark ? "light" : "dark"),
    },
    ...(historyCount > 0
      ? [
          {
            id: "clear-history",
            label: `Clear history (${historyCount} ${historyCount === 1 ? "entry" : "entries"})`,
            icon: Trash2,
            run: onClearHistory,
            danger: true,
          },
        ]
      : []),
  ];

  const filtered = commands.filter((c) => c.label.toLowerCase().includes(query.trim().toLowerCase()));

  function run(command: Command | undefined) {
    if (!command) return;
    onOpenChange(false);
    command.run();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    const n = Math.max(filtered.length, 1);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((s) => (s + 1) % n);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((s) => (s - 1 + n) % n);
    } else if (e.key === "Enter") {
      e.preventDefault();
      run(filtered[selected]);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="top-40 max-w-[480px]" onKeyDown={handleKeyDown}>
        <DialogTitle className="sr-only">Command palette</DialogTitle>

        {/* Search */}
        <div className="flex h-12 items-center gap-2.5 border-b border-border px-3.5">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(0);
            }}
            placeholder="Type a command…"
            aria-label="Search commands"
            className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground focus-visible:outline-none"
          />
          <Kbd className="border-b">Esc</Kbd>
        </div>

        {/* Commands */}
        <div role="listbox" className="p-1.5">
          {filtered.length === 0 ? (
            <p className="px-4 py-9 text-center text-[13px] text-muted-foreground">No commands found.</p>
          ) : (
            <>
              <p className="px-2.5 pb-1 pt-2 text-[11px] font-medium text-muted-foreground">Actions</p>
              {filtered.map((command, i) => {
                const Icon = command.icon;
                const isSelected = i === selected;
                return (
                  <button
                    key={command.id}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => run(command)}
                    onMouseMove={() => setSelected(i)}
                    className={cn(
                      "flex h-[38px] w-full items-center gap-2.5 rounded-[7px] px-2.5 text-left text-[13.5px] transition-colors",
                      isSelected && "bg-accent",
                      command.danger ? "text-destructive" : "text-foreground"
                    )}
                  >
                    <Icon className="h-[15px] w-[15px]" />
                    <span className="flex-1">{command.label}</span>
                    {isSelected && <span className="font-mono text-[11px] text-muted-foreground">↵</span>}
                  </button>
                );
              })}
            </>
          )}
        </div>

        {/* Keyboard hints */}
        <div className="flex h-9 items-center gap-3.5 border-t border-border bg-surface px-3.5 text-[11.5px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Kbd>↑</Kbd> <Kbd>↓</Kbd> navigate
          </span>
          <span className="flex items-center gap-1">
            <Kbd>↵</Kbd> run
          </span>
          <span className="ml-auto">
            <Kbd>Ctrl K</Kbd> toggle
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
