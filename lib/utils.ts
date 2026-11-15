import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Extracts the most likely error line number from a stack trace.
// Tries common patterns: Python, Java/Kotlin, JS/TS, C#, Ruby, Go.
export function extractErrorLine(trace: string): number | null {
  const patterns = [
    /File ".+?", line (\d+)/,           // Python
    /\.java:(\d+)\)/,                    // Java / Kotlin
    /\.kt:(\d+)\)/,
    /\.ts:(\d+):\d+/,                    // TypeScript
    /\.js:(\d+):\d+/,                    // JavaScript
    /\.cs\):line (\d+)/,                 // C#
    /:(\d+):in /,                        // Ruby
    /\.go:(\d+)/,                        // Go
    /line (\d+)/i,                       // generic fallback
  ];

  for (const pattern of patterns) {
    const match = trace.match(pattern);
    if (match) return parseInt(match[1], 10);
  }
  return null;
}

// Formats a timestamp as a human-readable relative time string.
export function relativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const m = Math.floor(diff / 60_000);
  const h = Math.floor(diff / 3_600_000);
  const d = Math.floor(diff / 86_400_000);
  if (diff < 60_000) return "just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d === 1) return "yesterday";
  return `${d}d ago`;
}
