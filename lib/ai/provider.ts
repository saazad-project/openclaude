import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOpenAI } from '@ai-sdk/openai'
import { keyManager, MODELS, type ModelProvider } from './key-rotation'

export interface AIProvider {
  provider: ReturnType<typeof createGoogleGenerativeAI> | ReturnType<typeof createOpenAI>
  model: string
  name: string
}

export function getAIProvider(): AIProvider | null {
  const keyInfo = keyManager.getNextKey()
  
  if (!keyInfo) {
    console.error('[AIProvider] No API keys available')
    return null
  }
  
  const { key, provider: providerType } = keyInfo
  
  if (providerType === 'longcat') {
    const openai = createOpenAI({
      apiKey: key,
      baseURL: MODELS.longcat.baseUrl,
    })
    
    return {
      provider: openai,
      model: MODELS.longcat.model,
      name: MODELS.longcat.name,
    }
  }
  
  // Gemini provider
  const google = createGoogleGenerativeAI({
    apiKey: key,
  })
  
  return {
    provider: google,
    model: MODELS.gemini.model,
    name: MODELS.gemini.name,
  }
}

export function getProviderStats() {
  return {
    ...keyManager.getStats(),
    longcatKeys: keyManager.getLongCatCount(),
    geminiKeys: keyManager.getGeminiCount(),
    hasKeys: keyManager.hasKeys(),
  }
}
