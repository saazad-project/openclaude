import { streamText, tool } from 'ai'
import { getAIProvider, getProviderStats } from '@/lib/ai/provider'
import { keyManager } from '@/lib/ai/key-rotation'
import { SYSTEM_PROMPT, buildContextPrompt } from '@/lib/ai/prompts'
import { toolSchemas } from '@/lib/ai/tools'
import { minimatch } from 'minimatch'

export const maxDuration = 60

interface RequestBody {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  files: Record<string, string>
}

// Tool execution functions (server-side)
function executeFileRead(files: Record<string, string>, path: string) {
  if (path in files) {
    return { success: true, content: files[path] }
  }
  return { success: false, error: `File not found: ${path}` }
}

function executeGlob(files: Record<string, string>, pattern: string) {
  const matches = Object.keys(files).filter(f => minimatch(f, pattern))
  return { success: true, files: matches }
}

function executeGrep(files: Record<string, string>, pattern: string, path?: string) {
  const results: Array<{ file: string; line: number; content: string }> = []
  const regex = new RegExp(pattern, 'gi')
  
  for (const [filePath, content] of Object.entries(files)) {
    if (path && !filePath.startsWith(path)) continue
    
    const lines = content.split('\n')
    lines.forEach((line, index) => {
      if (regex.test(line)) {
        results.push({
          file: filePath,
          line: index + 1,
          content: line.trim().substring(0, 200),
        })
      }
      regex.lastIndex = 0
    })
  }
  
  return { success: true, results }
}

export async function POST(request: Request) {
  try {
    const body: RequestBody = await request.json()
    const { messages, files } = body
    
    const providerInfo = getAIProvider()
    
    if (!providerInfo) {
      return Response.json(
        { error: 'No API keys configured. Please add GEMINI_API_KEY or LONGCAT_KEY_* environment variables.' },
        { status: 500 }
      )
    }
    
    const { provider, model, name } = providerInfo
    const contextPrompt = buildContextPrompt(files)
    
    console.log(`[API] Using ${name} (${model})`)
    console.log(`[API] Stats:`, getProviderStats())
    
    const result = streamText({
      model: provider(model),
      system: SYSTEM_PROMPT + contextPrompt,
      messages,
      maxTokens: 8192,
      tools: {
        file_read: tool({
          description: toolSchemas.file_read.description,
          parameters: toolSchemas.file_read.parameters,
          execute: async ({ path }) => {
            console.log(`[Tool] file_read: ${path}`)
            return executeFileRead(files, path)
          },
        }),
        file_write: tool({
          description: toolSchemas.file_write.description,
          parameters: toolSchemas.file_write.parameters,
          execute: async ({ path, content }) => {
            console.log(`[Tool] file_write: ${path} (${content.length} chars)`)
            // Return the write instruction - client will apply it
            return { 
              success: true, 
              action: 'write',
              path, 
              content,
              message: `File written: ${path}` 
            }
          },
        }),
        file_edit: tool({
          description: toolSchemas.file_edit.description,
          parameters: toolSchemas.file_edit.parameters,
          execute: async ({ path, old_string, new_string }) => {
            console.log(`[Tool] file_edit: ${path}`)
            // Return the edit instruction - client will apply it
            return { 
              success: true, 
              action: 'edit',
              path, 
              old_string, 
              new_string,
              message: `File edited: ${path}` 
            }
          },
        }),
        glob: tool({
          description: toolSchemas.glob.description,
          parameters: toolSchemas.glob.parameters,
          execute: async ({ pattern }) => {
            console.log(`[Tool] glob: ${pattern}`)
            return executeGlob(files, pattern)
          },
        }),
        grep: tool({
          description: toolSchemas.grep.description,
          parameters: toolSchemas.grep.parameters,
          execute: async ({ pattern, path }) => {
            console.log(`[Tool] grep: ${pattern} in ${path || 'all files'}`)
            return executeGrep(files, pattern, path)
          },
        }),
      },
      onFinish: () => {
        // Report success to key manager
        const keyInfo = keyManager.getNextKey()
        if (keyInfo) {
          keyManager.reportSuccess(keyInfo.key)
        }
      },
    })
    
    return result.toDataStreamResponse()
    
  } catch (error) {
    console.error('[API] Error:', error)
    
    // Report error to key manager for rotation
    const keyInfo = keyManager.getNextKey()
    if (keyInfo) {
      keyManager.reportError(keyInfo.key)
    }
    
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return Response.json({
    status: 'ok',
    ...getProviderStats(),
  })
}
