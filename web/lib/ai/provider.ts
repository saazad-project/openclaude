/**
 * AI Provider - LongCat + Gemini with automatic failover
 */

import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import {
  selectProvider,
  markProviderRateLimited,
  markProviderSuccess,
  type ProviderConfig,
} from "./key-rotation";

// ============================================================
// CREATE MODEL INSTANCE
// ============================================================

export function createModel(config: ProviderConfig) {
  if (config.provider === "gemini") {
    const google = createGoogleGenerativeAI({
      apiKey: config.apiKey,
    });
    return google(config.model);
  }

  // LongCat uses OpenAI-compatible API
  const openai = createOpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
  });
  return openai(config.model);
}

// ============================================================
// GET AVAILABLE MODEL
// ============================================================

export function getAvailableModel(preferredProvider?: "longcat" | "gemini") {
  const config = selectProvider(preferredProvider);
  if (!config) {
    throw new Error("No API keys available. Please configure LONGCAT_KEYS or GEMINI_KEYS.");
  }
  return {
    model: createModel(config),
    config,
  };
}

// ============================================================
// ERROR HANDLING
// ============================================================

export function handleProviderError(config: ProviderConfig, error: unknown): boolean {
  const errorMessage = error instanceof Error ? error.message : String(error);

  // Check for rate limit errors
  if (
    errorMessage.includes("rate limit") ||
    errorMessage.includes("429") ||
    errorMessage.includes("quota") ||
    errorMessage.includes("exceeded")
  ) {
    markProviderRateLimited(config);
    return true; // Should retry with different key
  }

  // Check for auth errors (bad key)
  if (
    errorMessage.includes("401") ||
    errorMessage.includes("403") ||
    errorMessage.includes("invalid") ||
    errorMessage.includes("unauthorized")
  ) {
    // Mark as rate limited for longer (bad key)
    markProviderRateLimited(config);
    return true; // Should retry with different key
  }

  return false; // Don't retry
}

export { markProviderSuccess };
