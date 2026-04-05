import { streamText, tool } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { z } from 'zod'
import { minimatch } from 'minimatch'

export const maxDuration = 60

// System prompt for AI code generation
const SYSTEM_PROMPT = `You are an expert AI Software Engineer. You help users build applications by:
1. Understanding their requirements
2. Creating well-structured, clean code
3. Explaining your approach clearly

When creating files, use the file_write tool with the full path and content.
When editing files, use the file_edit tool with the exact old_string to replace and the new_string.
Always write complete, working code - no placeholders or TODOs.

You have access to these tools:
- file_read: Read a file's contents
- file_write: Create or overwrite a file
- file_edit: Edit part of an existing file
- glob: Find files matching a pattern
- grep: Search for text in files

Respond conversationally and explain what you're doing.`

interface RequestBody {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  files: Record<string, string>
}

// Get API provider
function getProvider() {
  // Try LongCat keys first
  for (let i = 1; i <= 50; i++) {
    const key = process.env[`LONGCAT_KEY_${i}`]
    if (key) {
      return {
        provider: createGoogleGenerativeAI({
          apiKey: key,
          baseURL: 'https://api.longcat.dev/v1beta',
        }),
        model: 'gemini-2.5-flash-preview-05-20',
        name: `LongCat-${i}`,
      }
    }
  }
  
  // Try Gemini keys
  for (let i = 1; i <= 10; i++) {
    const key = process.env[`GEMINI_KEY_${i}`] || (i === 1 ? process.env.GEMINI_API_KEY : undefined)
    if (key) {
      return {
        provider: createGoogleGenerativeAI({ apiKey: key }),
        model: 'gemini-2.5-flash-preview-05-20',
        name: `Gemini-${i}`,
      }
    }
  }
  
  return null
}

// Tool execution functions
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
    const { messages, files = {} } = body
    
    const providerInfo = getProvider()
    
    if (!providerInfo) {
      return Response.json(
        { error: 'No API keys configured. Please add LONGCAT_KEY_1 or GEMINI_API_KEY environment variable.' },
        { status: 500 }
      )
    }
    
    const { provider, model, name } = providerInfo
    
    // Build context from files
    const fileList = Object.keys(files).length > 0 
      ? `\n\nCurrent files:\n${Object.keys(files).map(f => `- ${f}`).join('\n')}`
      : ''
    
    console.log(`[v0] Using ${name} (${model})`)
    
    const result = streamText({
      model: provider(model),
      system: SYSTEM_PROMPT + fileList,
      messages,
      maxOutputTokens: 8192,
      tools: {
        file_read: tool({
          description: 'Read the contents of a file',
          parameters: z.object({
            path: z.string().describe('The file path to read'),
          }),
          execute: async ({ path }) => {
            console.log(`[v0] file_read: ${path}`)
            return executeFileRead(files, path)
          },
        }),
        file_write: tool({
          description: 'Create or overwrite a file with new content',
          parameters: z.object({
            path: z.string().describe('The file path to write'),
            content: z.string().describe('The file content'),
          }),
          execute: async ({ path, content }) => {
            console.log(`[v0] file_write: ${path} (${content.length} chars)`)
            return { 
              success: true, 
              action: 'write',
              path, 
              content,
            }
          },
        }),
        file_edit: tool({
          description: 'Edit part of an existing file by replacing text',
          parameters: z.object({
            path: z.string().describe('The file path to edit'),
            old_string: z.string().describe('The exact text to replace'),
            new_string: z.string().describe('The new text'),
          }),
          execute: async ({ path, old_string, new_string }) => {
            console.log(`[v0] file_edit: ${path}`)
            return { 
              success: true, 
              action: 'edit',
              path, 
              old_string, 
              new_string,
            }
          },
        }),
        glob: tool({
          description: 'Find files matching a glob pattern',
          parameters: z.object({
            pattern: z.string().describe('The glob pattern'),
          }),
          execute: async ({ pattern }) => {
            console.log(`[v0] glob: ${pattern}`)
            return executeGlob(files, pattern)
          },
        }),
        grep: tool({
          description: 'Search for text in files',
          parameters: z.object({
            pattern: z.string().describe('The search pattern (regex)'),
            path: z.string().optional().describe('Optional path prefix to search in'),
          }),
          execute: async ({ pattern, path }) => {
            console.log(`[v0] grep: ${pattern}`)
            return executeGrep(files, pattern, path)
          },
        }),
      },
    })
    
    return result.toUIMessageStreamResponse()
    
  } catch (error) {
    console.error('[v0] API Error:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  const provider = getProvider()
  return Response.json({
    status: 'ok',
    provider: provider?.name || 'none',
  })
}
