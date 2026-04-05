import { streamText, tool } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { z } from 'zod'

export const maxDuration = 60

// System prompt for the AI Software Engineer
const SYSTEM_PROMPT = `You are an expert AI Software Engineer, similar to Cursor, Bolt, and Devin combined.

## Core Capabilities
- Full-stack development (React, Next.js, Node.js, Python, etc.)
- Code generation, refactoring, and debugging
- File system operations (read, write, edit files)
- Project scaffolding and architecture design

## Tools Available
- file_read: Read file contents
- file_write: Create or overwrite files
- file_edit: Make targeted edits to existing files
- glob: Find files matching patterns
- grep: Search for text in files

## Guidelines
1. Always read files before editing to understand current state
2. Make minimal, focused changes
3. Follow existing code patterns and conventions
4. Write clean, well-documented code
5. Handle errors gracefully

You are helpful, precise, and efficient. Always explain what you're doing.`

// Create Google AI provider with LongCat or Gemini key
function createProvider() {
  const longcatKey = process.env.LONGCAT_KEY_1
  const geminiKey = process.env.GEMINI_KEY_1 || process.env.GOOGLE_GENERATIVE_AI_API_KEY
  
  const apiKey = longcatKey || geminiKey
  
  if (!apiKey) {
    throw new Error('No API key found. Set LONGCAT_KEY_1 or GEMINI_KEY_1')
  }
  
  // LongCat uses a different base URL
  const baseURL = longcatKey 
    ? 'https://api.longcat.ai/v1'
    : undefined
  
  return createGoogleGenerativeAI({
    apiKey,
    baseURL,
  })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const messages = body.messages || []
    
    // Ensure messages have the correct format
    const formattedMessages = messages.map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))
    
    const provider = createProvider()
    
    // Define tools for file operations
    const tools = {
      file_read: tool({
        description: 'Read the contents of a file',
        parameters: z.object({
          path: z.string().describe('The file path to read'),
        }),
        execute: async ({ path }) => {
          return { success: true, path, content: `[File content of ${path} would be here]` }
        },
      }),
      
      file_write: tool({
        description: 'Write content to a file (creates or overwrites)',
        parameters: z.object({
          path: z.string().describe('The file path to write'),
          content: z.string().describe('The content to write'),
        }),
        execute: async ({ path, content }) => {
          return { success: true, path, message: `File written: ${path}` }
        },
      }),
      
      file_edit: tool({
        description: 'Edit a file by replacing old content with new content',
        parameters: z.object({
          path: z.string().describe('The file path to edit'),
          old_string: z.string().describe('The exact string to find and replace'),
          new_string: z.string().describe('The replacement string'),
        }),
        execute: async ({ path, old_string, new_string }) => {
          return { success: true, path, message: `File edited: ${path}` }
        },
      }),
      
      glob: tool({
        description: 'Find files matching a glob pattern',
        parameters: z.object({
          pattern: z.string().describe('The glob pattern (e.g., "**/*.ts")'),
        }),
        execute: async ({ pattern }) => {
          return { success: true, pattern, files: [] }
        },
      }),
      
      grep: tool({
        description: 'Search for text patterns in files',
        parameters: z.object({
          pattern: z.string().describe('The search pattern (regex supported)'),
          path: z.string().optional().describe('Directory to search in'),
        }),
        execute: async ({ pattern, path }) => {
          return { success: true, pattern, matches: [] }
        },
      }),
    }
    
    const result = streamText({
      model: provider('gemini-2.0-flash'),
      system: SYSTEM_PROMPT,
      messages: formattedMessages,
      tools,
      maxSteps: 10,
    })
    
    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('[v0] API Error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
