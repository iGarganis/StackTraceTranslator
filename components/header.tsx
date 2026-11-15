"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, Github, Terminal, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SITE } from "@/lib/site";

interface HeaderProps {
  historyCount: number;
  onHistoryOpen: () => void;
}

export function Header({ historyCount, onHistoryOpen }: HeaderProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme !== "light";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1248px] items-center justify-between gap-4 px-3 sm:px-6">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2.5 text-foreground">
          <span className="flex h-7 w-7 items-center justify-center rounded-[7px] border border-primary/30 bg-primary/10 text-primary">
            <Terminal className="h-[15px] w-[15px]" strokeWidth={2.25} />
          </span>
          <span className="whitespace-nowrap text-sm font-semibold tracking-tight">{SITE.name}</span>
        </a>

        {/* Actions */}
        <nav className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={onHistoryOpen}
            aria-label="History"
            title="History"
          >
            <Clock strokeWidth={1.85} />
            {historyCount > 0 && (
              <span className="absolute right-0.5 top-[3px] flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 font-mono text-[10px] font-semibold text-primary-foreground ring-2 ring-background">
                {historyCount}
              </span>
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            <Sun strokeWidth={1.85} className="hidden animate-fade-up dark:block" />
            <Moon strokeWidth={1.85} className="block animate-fade-up dark:hidden" />
          </Button>

          <Button variant="ghost" size="icon" asChild>
            <a href={SITE.repoUrl} target="_blank" rel="noopener noreferrer" aria-label="GitHub">
              <Github strokeWidth={1.85} />
            </a>
          </Button>
        </nav>
      </div>
    </header>
  );
}
