// Single source of truth for the models the app calls and how the UI labels them.
// Client-safe: no SDK imports, so components can use the labels too.
// When Groq retires a model, change it here only.
//
// Both models run on Groq, but come from different vendors with different
// training data, so multi-model mode still gets two independent opinions.

export const PROVIDER = "Groq";

export const MODELS = {
  primary: {
    name: "GPT-OSS",
    apiId: "openai/gpt-oss-120b",
    label: "gpt-oss-120b",
  },
  secondary: {
    name: "Qwen",
    apiId: "qwen/qwen3.8-27b",
    label: "qwen3.8-27b",
  },
} as const;

export type ModelId = keyof typeof MODELS;
