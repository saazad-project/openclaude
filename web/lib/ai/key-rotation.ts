/**
 * Multi-API Key Rotation Manager
 * Supports 50+ LongCat accounts + Gemini accounts
 * Auto-rotates when rate limited
 */

interface KeyStats {
  key: string;
  provider: "longcat" | "gemini";
  requestCount: number;
  lastUsed: number;
  rateLimitedUntil: number;
}

class KeyRotationManager {
  private keys: KeyStats[] = [];
  private currentIndex: number = 0;

  constructor(keys: string[], provider: "longcat" | "gemini") {
    this.keys = keys
      .filter((k) => k && k.length > 0)
      .map((key) => ({
        key,
        provider,
        requestCount: 0,
        lastUsed: 0,
        rateLimitedUntil: 0,
      }));
  }

  get availableKeys(): number {
    return this.keys.filter((k) => !this.isRateLimited(k)).length;
  }

  get totalKeys(): number {
    return this.keys.length;
  }

  private isRateLimited(keyStats: KeyStats): boolean {
    return keyStats.rateLimitedUntil > Date.now();
  }

  getCurrentKey(): string | null {
    if (this.keys.length === 0) return null;

    // Find first non-rate-limited key starting from current index
    const startIndex = this.currentIndex;
    let attempts = 0;

    while (attempts < this.keys.length) {
      const keyStats = this.keys[this.currentIndex];

      if (!this.isRateLimited(keyStats)) {
        keyStats.lastUsed = Date.now();
        keyStats.requestCount++;
        return keyStats.key;
      }

      this.rotateToNext();
      attempts++;
    }

    // All keys rate limited - return the one that will be available soonest
    const sortedByExpiry = [...this.keys].sort(
      (a, b) => a.rateLimitedUntil - b.rateLimitedUntil
    );
    return sortedByExpiry[0]?.key || null;
  }

  markRateLimited(key: string, durationMs: number = 60000): void {
    const keyStats = this.keys.find((k) => k.key === key);
    if (keyStats) {
      keyStats.rateLimitedUntil = Date.now() + durationMs;
      console.log(
        `[KeyRotation] Key ${key.slice(0, 8)}... rate limited for ${durationMs / 1000}s`
      );
      this.rotateToNext();
    }
  }

  markSuccess(key: string): void {
    const keyStats = this.keys.find((k) => k.key === key);
    if (keyStats) {
      // Reset rate limit if request succeeded
      keyStats.rateLimitedUntil = 0;
    }
  }

  rotateToNext(): void {
    if (this.keys.length > 0) {
      this.currentIndex = (this.currentIndex + 1) % this.keys.length;
    }
  }

  getStats(): { available: number; total: number; rateLimited: number } {
    const rateLimited = this.keys.filter((k) => this.isRateLimited(k)).length;
    return {
      available: this.keys.length - rateLimited,
      total: this.keys.length,
      rateLimited,
    };
  }
}

// ============================================================
// SINGLETON INSTANCES
// ============================================================

let longcatManager: KeyRotationManager | null = null;
let geminiManager: KeyRotationManager | null = null;

function getLongCatKeys(): string[] {
  const keys: string[] = [];
  // Support up to 50 LongCat keys
  for (let i = 1; i <= 50; i++) {
    const key = process.env[`LONGCAT_KEY_${i}`];
    if (key) keys.push(key);
  }
  // Also support comma-separated list
  const listKey = process.env.LONGCAT_KEYS;
  if (listKey) {
    keys.push(...listKey.split(",").map((k) => k.trim()));
  }
  return keys;
}

function getGeminiKeys(): string[] {
  const keys: string[] = [];
  // Support up to 10 Gemini keys
  for (let i = 1; i <= 10; i++) {
    const key = process.env[`GEMINI_KEY_${i}`];
    if (key) keys.push(key);
  }
  // Also support the standard key
  const standardKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (standardKey) keys.push(standardKey);
  // Also support comma-separated list
  const listKey = process.env.GEMINI_KEYS;
  if (listKey) {
    keys.push(...listKey.split(",").map((k) => k.trim()));
  }
  return keys;
}

export function getLongCatManager(): KeyRotationManager {
  if (!longcatManager) {
    longcatManager = new KeyRotationManager(getLongCatKeys(), "longcat");
  }
  return longcatManager;
}

export function getGeminiManager(): KeyRotationManager {
  if (!geminiManager) {
    geminiManager = new KeyRotationManager(getGeminiKeys(), "gemini");
  }
  return geminiManager;
}

// ============================================================
// PROVIDER SELECTOR
// ============================================================

export type Provider = "longcat" | "gemini";

export interface ProviderConfig {
  provider: Provider;
  apiKey: string;
  model: string;
  baseURL: string;
}

export function selectProvider(preferredProvider?: Provider): ProviderConfig | null {
  const longcat = getLongCatManager();
  const gemini = getGeminiManager();

  // Try preferred provider first
  if (preferredProvider === "longcat" && longcat.availableKeys > 0) {
    const key = longcat.getCurrentKey();
    if (key) {
      return {
        provider: "longcat",
        apiKey: key,
        model: "longcat-flash-thinking",
        baseURL: "https://api.longcat.cloud/v1",
      };
    }
  }

  if (preferredProvider === "gemini" && gemini.availableKeys > 0) {
    const key = gemini.getCurrentKey();
    if (key) {
      return {
        provider: "gemini",
        apiKey: key,
        model: "gemini-2.5-flash-preview-05-20",
        baseURL: "https://generativelanguage.googleapis.com/v1beta",
      };
    }
  }

  // Fallback: Try LongCat first (more tokens), then Gemini
  if (longcat.availableKeys > 0) {
    const key = longcat.getCurrentKey();
    if (key) {
      return {
        provider: "longcat",
        apiKey: key,
        model: "longcat-flash-thinking",
        baseURL: "https://api.longcat.cloud/v1",
      };
    }
  }

  if (gemini.availableKeys > 0) {
    const key = gemini.getCurrentKey();
    if (key) {
      return {
        provider: "gemini",
        apiKey: key,
        model: "gemini-2.5-flash-preview-05-20",
        baseURL: "https://generativelanguage.googleapis.com/v1beta",
      };
    }
  }

  return null;
}

export function markProviderRateLimited(config: ProviderConfig): void {
  if (config.provider === "longcat") {
    getLongCatManager().markRateLimited(config.apiKey, 60000);
  } else {
    getGeminiManager().markRateLimited(config.apiKey, 60000);
  }
}

export function markProviderSuccess(config: ProviderConfig): void {
  if (config.provider === "longcat") {
    getLongCatManager().markSuccess(config.apiKey);
  } else {
    getGeminiManager().markSuccess(config.apiKey);
  }
}

export function getProviderStats(): {
  longcat: { available: number; total: number; rateLimited: number };
  gemini: { available: number; total: number; rateLimited: number };
} {
  return {
    longcat: getLongCatManager().getStats(),
    gemini: getGeminiManager().getStats(),
  };
}
