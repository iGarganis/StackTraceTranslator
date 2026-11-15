"use client";

import { useState, useEffect } from "react";
import { createHighlighter, type Highlighter } from "shiki";

// Singleton — we only pay the Shiki initialization cost once per page load.
// Without this, every CodeBlock mount would re-parse the WASM grammar engine.
let highlighterPromise: Promise<Highlighter> | null = null;

function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ["github-light-default", "github-dark-default"],
      langs: ["python", "javascript", "typescript", "java", "csharp", "go", "rust", "ruby", "php", "bash", "json", "text"],
    });
  }
  return highlighterPromise;
}

export function useShiki(): Highlighter | null {
  const [highlighter, setHighlighter] = useState<Highlighter | null>(null);

  useEffect(() => {
    getHighlighter().then(setHighlighter);
  }, []);

  return highlighter;
}

// Map LLM-returned language strings to Shiki language IDs
export function normalizeLanguage(lang: string): string {
  const map: Record<string, string> = {
    python: "python",
    javascript: "javascript",
    js: "javascript",
    typescript: "typescript",
    ts: "typescript",
    java: "java",
    "c#": "csharp",
    csharp: "csharp",
    "c++": "cpp",
    cpp: "cpp",
    go: "go",
    golang: "go",
    rust: "rust",
    ruby: "ruby",
    php: "php",
    bash: "bash",
    shell: "bash",
    sh: "bash",
    json: "json",
  };
  return map[lang.toLowerCase()] ?? "bash";
}
