"use client";

import { useState, useEffect } from "react";
import { Copy, Check } from "lucide-react";
import { useShiki, normalizeLanguage } from "@/hooks/use-shiki";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CodeBlockProps {
  code: string;
  language: string;
  compact?: boolean;
}

// Both themes are emitted as CSS variables only (--shiki-light / --shiki-dark);
// globals.css applies the set that matches the current theme.
const THEMES = { light: "github-light-default", dark: "github-dark-default" } as const;
const OPTIONS = { themes: THEMES, defaultColor: false } as const;

export function CodeBlock({ code, language, compact = false }: CodeBlockProps) {
  const highlighter = useShiki();
  const [html, setHtml] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!highlighter || !code) return;
    try {
      setHtml(highlighter.codeToHtml(code, { lang: normalizeLanguage(language), ...OPTIONS }));
    } catch {
      // Unrecognized language: fall back to plain text
      setHtml(highlighter.codeToHtml(code, { lang: "text", ...OPTIONS }));
    }
  }, [highlighter, code, language]);

  async function copyCode() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-code-bg">
      {/* Header bar: language + copy */}
      <div className="flex h-[34px] items-center justify-between border-b border-border bg-surface pl-3 pr-1.5">
        <span className="font-mono text-[11px] text-muted-foreground">{language.toLowerCase()}</span>
        <Button
          variant="ghost"
          size="xs"
          onClick={copyCode}
          className={cn(copied && "text-success hover:text-success")}
        >
          {copied ? <Check strokeWidth={2.25} /> : <Copy />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>

      {html ? (
        <div
          className={cn(
            "overflow-x-auto font-mono leading-[1.7] [&_code]:font-mono [&_pre]:m-0 [&_pre]:px-4 [&_pre]:py-3.5",
            compact ? "text-[11.5px]" : "text-[12.5px]"
          )}
          // Safe: Shiki only emits syntax-colored spans; the code itself is passed as plain text
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <div className="flex flex-col gap-2.5 p-4">
          <div className="shimmer h-3 w-3/4 rounded" />
          <div className="shimmer h-3 w-1/2 rounded" />
          <div className="shimmer h-3 w-2/3 rounded" />
        </div>
      )}
    </div>
  );
}
