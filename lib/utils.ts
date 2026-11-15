import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── Error location ─────────────────────────────────────────────────────────────

export interface ErrorLocation {
  /** Source file name as it appears in the trace (basename only), if known */
  file: string | null;
  /** Line number in that source file */
  line: number;
  /** 0-based index of the trace line that mentions it, used to highlight it in the input */
  traceLine: number;
}

// One pattern per stack-frame format. Group 1 captures the file, group 2 the line number.
const FRAME_PATTERNS: RegExp[] = [
  /File "([^"]+)", line (\d+)/,                    // Python
  /\(([^():\s]+\.(?:java|kt)):(\d+)\)/,           // Java / Kotlin
  /in (\S+\.cs):line (\d+)/,                       // C#
  /([^\s()]+\.(?:[cm]?[jt]sx?)):(\d+):\d+/,       // JavaScript / TypeScript (incl. JSX/TSX)
  /([^\s()]+\.rs):(\d+):\d+/,                      // Rust
  /(\S+\.go):(\d+)/,                               // Go
  /([^\s:]+\.rb):(\d+)/,                           // Ruby
  /(\S+\.php)(?::| on line )(\d+)/,                // PHP
];

// Frames from dependencies or the runtime itself are rarely where the bug is
const LIBRARY_FRAME = /node_modules|react-dom|node:internal|\(native\)|<anonymous>|site-packages|\/usr\/lib\//;

/**
 * Finds the most relevant error location in a stack trace: the first frame in the
 * user's own code. Python tracebacks list the most recent call last, so for those
 * the last matching frame is used instead.
 */
export function findErrorLocation(trace: string): ErrorLocation | null {
  const lines = trace.split("\n");
  const frames: ErrorLocation[] = [];

  lines.forEach((text, index) => {
    if (LIBRARY_FRAME.test(text)) return;
    for (const pattern of FRAME_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        frames.push({ file: basename(match[1]), line: Number(match[2]), traceLine: index });
        return;
      }
    }
  });

  if (frames.length > 0) {
    const pythonOrder = /most recent call last/i.test(trace);
    return pythonOrder ? frames[frames.length - 1] : frames[0];
  }

  // Generic fallback: "... line 12 ..." anywhere in the trace
  const index = lines.findIndex((text) => /\bline \d+/i.test(text));
  if (index === -1) return null;
  const line = Number(lines[index].match(/\bline (\d+)/i)![1]);
  return { file: null, line, traceLine: index };
}

function basename(path: string): string {
  return path.split(/[\\/]/).pop() ?? path;
}

// ── Display helpers ────────────────────────────────────────────────────────────

const LANGUAGE_TAGS: Record<string, string> = {
  javascript: "JS",
  typescript: "TS",
  python: "PY",
  java: "JAVA",
  kotlin: "KT",
  "c#": "C#",
  csharp: "C#",
  go: "GO",
  golang: "GO",
  rust: "RS",
  ruby: "RB",
  php: "PHP",
  "c++": "C++",
  swift: "SWIFT",
};

/** Short tag for a language, used in session tabs (e.g. "JavaScript" → "JS") */
export function languageTag(language: string): string {
  return LANGUAGE_TAGS[language.trim().toLowerCase()] ?? language.slice(0, 4).toUpperCase();
}

/** Formats a timestamp as a human-readable relative time string */
export function relativeTime(timestamp: number, now: number = Date.now()): string {
  const diff = now - timestamp;
  const m = Math.floor(diff / 60_000);
  const h = Math.floor(diff / 3_600_000);
  const d = Math.floor(diff / 86_400_000);
  if (diff < 60_000) return "just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d === 1) return "yesterday";
  return `${d}d ago`;
}
