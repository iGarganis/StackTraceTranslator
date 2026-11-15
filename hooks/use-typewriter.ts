"use client";

import { useState, useEffect, useRef } from "react";

const WORD_INTERVAL_MS = 28; // roughly 35 words/sec — fast but visibly animated

export function useTypewriter(text: string, active: boolean, onComplete?: () => void) {
  const [displayed, setDisplayed] = useState(active ? "" : text);
  const indexRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!active) {
      setDisplayed(text);
      return;
    }

    indexRef.current = 0;
    setDisplayed("");

    const words = text.split(" ");

    intervalRef.current = setInterval(() => {
      indexRef.current += 1;
      if (indexRef.current >= words.length) {
        setDisplayed(text);
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
        onCompleteRef.current?.();
        return;
      }
      setDisplayed(words.slice(0, indexRef.current).join(" ") + " ");
    }, WORD_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [text, active]);

  return displayed;
}
