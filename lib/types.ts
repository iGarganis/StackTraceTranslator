// Shared client-side types used by both the output panel and the history system.
// Kept separate from lib/llm/schema.ts (which runs server-side) so client
// components can import this file without pulling in server-only modules.

import type { LLMResponse } from "@/lib/llm/schema";
import type { ModelId } from "@/lib/llm/models";

// What /api/explain sends back to the client
export type AppResponse =
  | {
      multiModel: false;
      model: ModelId;
      result: LLMResponse;
      fallback?: boolean;
      fallbackReason?: string;
    }
  | {
      multiModel: true;
      results: Record<ModelId, LLMResponse>;
      // true = both models broadly agree on the diagnosis
      agreement: boolean;
    };

export interface AnalysisError {
  message: string;
  // HTTP status of the failed request; absent for network errors
  status?: number;
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  language: string;
  // First 60 chars of the stack trace — shown in session tabs and history
  tracePreview: string;
  stackTrace: string;
  codeContext?: string;
  useMultiModel: boolean;
  response: AppResponse;
}
