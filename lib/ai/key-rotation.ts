// Key Rotation Manager for LongCat and Gemini APIs
// Supports up to 50 LongCat keys and 6 Gemini keys with automatic failover

interface KeyConfig {
  key: string
  provider: 'longcat' | 'gemini'
  lastUsed: number
  errorCount: number
  cooldownUntil: number
}

interface KeyStats {
  totalKeys: number
  availableKeys: number
  cooldownKeys: number
}

class KeyRotationManager {
  private keys: KeyConfig[] = []
  private currentIndex = 0
  private readonly COOLDOWN_MS = 60000 // 1 minute cooldown after error
  private readonly MAX_ERRORS = 3 // Max errors before cooldown
  
  constructor() {
    this.loadKeys()
  }
  
  private loadKeys() {
    // Load LongCat keys (LONGCAT_KEY_1 through LONGCAT_KEY_50)
    for (let i = 1; i <= 50; i++) {
      const key = process.env[\`LONGCAT_KEY_\${i}\`]
      if (key) {
        this.keys.push({
          key,
          provider: 'longcat',
          lastUsed: 0,
          errorCount: 0,
          cooldownUntil: 0,
        })
      }
    }
    
    // Load Gemini keys (GEMINI_KEY_1 through GEMINI_KEY_6)
    for (let i = 1; i <= 6; i++) {
      const key = process.env[\`GEMINI_KEY_\${i}\`]
      if (key) {
        this.keys.push({
          key,
          provider: 'gemini',
          lastUsed: 0,
          errorCount: 0,
          cooldownUntil: 0,
        })
      }
    }
    
    // Fallback: check for single GEMINI_API_KEY
    const singleGemini = process.env.GEMINI_API_KEY
    if (singleGemini && !this.keys.some(k => k.key === singleGemini)) {
      this.keys.push({
        key: singleGemini,
        provider: 'gemini',
        lastUsed: 0,
        errorCount: 0,
        cooldownUntil: 0,
      })
    }
    
    console.log(\`[KeyRotation] Loaded \${this.keys.length} API keys\`)
  }
  
  getNextKey(): { key: string; provider: 'longcat' | 'gemini' } | null {
    if (this.keys.length === 0) {
      return null
    }
    
    const now = Date.now()
    const availableKeys = this.keys.filter(k => k.cooldownUntil < now)
    
    if (availableKeys.length === 0) {
      // All keys in cooldown, find the one that will be available soonest
      const soonest = this.keys.reduce((min, k) => 
        k.cooldownUntil < min.cooldownUntil ? k : min
      )
      console.log(\`[KeyRotation] All keys in cooldown, using \${soonest.provider} key\`)
      return { key: soonest.key, provider: soonest.provider }
    }
    
    // Round-robin through available keys
    this.currentIndex = (this.currentIndex + 1) % availableKeys.length
    const selected = availableKeys[this.currentIndex]
    selected.lastUsed = now
    
    return { key: selected.key, provider: selected.provider }
  }
  
  reportError(key: string) {
    const config = this.keys.find(k => k.key === key)
    if (config) {
      config.errorCount++
      if (config.errorCount >= this.MAX_ERRORS) {
        config.cooldownUntil = Date.now() + this.COOLDOWN_MS
        config.errorCount = 0
        console.log(\`[KeyRotation] Key put in cooldown for \${this.COOLDOWN_MS}ms\`)
      }
    }
  }
  
  reportSuccess(key: string) {
    const config = this.keys.find(k => k.key === key)
    if (config) {
      config.errorCount = 0
    }
  }
  
  getStats(): KeyStats {
    const now = Date.now()
    return {
      totalKeys: this.keys.length,
      availableKeys: this.keys.filter(k => k.cooldownUntil < now).length,
      cooldownKeys: this.keys.filter(k => k.cooldownUntil >= now).length,
    }
  }
  
  hasKeys(): boolean {
    return this.keys.length > 0
  }
  
  getLongCatCount(): number {
    return this.keys.filter(k => k.provider === 'longcat').length
  }
  
  getGeminiCount(): number {
    return this.keys.filter(k => k.provider === 'gemini').length
  }
}

// Singleton instance
export const keyManager = new KeyRotationManager()

// Model configurations
export const MODELS = {
  longcat: {
    name: 'LongCat-Flash-Thinking',
    model: 'longcat-flash-thinking',
    baseUrl: 'https://api.longcat.ai/v1',
    maxTokens: 32768,
    contextWindow: 1000000,
  },
  gemini: {
    name: 'Gemini 2.5 Flash',
    model: 'gemini-2.5-flash-preview-05-20',
    maxTokens: 65536,
    contextWindow: 1000000,
  },
} as const

export type ModelProvider = keyof typeof MODELS
