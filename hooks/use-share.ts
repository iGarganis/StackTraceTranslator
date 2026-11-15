"use client";

import { useEffect, useCallback, useState } from "react";

interface ShareData {
  stackTrace: string;
  codeContext?: string;
}

// btoa() requires ASCII. encodeURIComponent converts any Unicode (stack traces
// often have non-ASCII chars) to percent-encoded ASCII first, making it safe.
function encode(data: ShareData): string {
  return btoa(encodeURIComponent(JSON.stringify(data)));
}

function decode(encoded: string): ShareData | null {
  try {
    return JSON.parse(decodeURIComponent(atob(encoded))) as ShareData;
  } catch {
    return null;
  }
}

interface UseShareOptions {
  onLoad: (data: ShareData) => void;
}

export function useShare({ onLoad }: UseShareOptions) {
  const [copied, setCopied] = useState(false);

  // On first render, check if the URL hash contains shared data and prefill the form
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (!hash.startsWith("#data=")) return;

    const encoded = hash.slice("#data=".length);
    const data = decode(encoded);
    if (data?.stackTrace) {
      onLoad(data);
      // Clean the hash so reloading doesn't re-trigger the prefill
      window.history.replaceState(null, "", window.location.pathname);
    }
    // onLoad is intentionally excluded from deps — we only want this to run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const copyShareLink = useCallback(
    (stackTrace: string, codeContext?: string) => {
      if (!stackTrace.trim()) return;
      const encoded = encode({ stackTrace, codeContext });
      const url = `${window.location.origin}${window.location.pathname}#data=${encoded}`;
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    },
    []
  );

  return { copyShareLink, copied };
}
