import { z } from 'zod'

// Tool schemas for AI SDK
export const toolSchemas = {
  file_read: {
    description: 'Read the contents of a file at the specified path',
    parameters: z.object({
      path: z.string().describe('The file path to read'),
    }),
  },
  
  file_write: {
    description: 'Create a new file or completely overwrite an existing file with new content',
    parameters: z.object({
      path: z.string().describe('The file path to write to'),
      content: z.string().describe('The complete file content to write'),
    }),
  },
  
  file_edit: {
    description: 'Make a targeted edit to an existing file by replacing specific text',
    parameters: z.object({
      path: z.string().describe('The file path to edit'),
      old_string: z.string().describe('The exact text to find and replace'),
      new_string: z.string().describe('The new text to replace with'),
    }),
  },
  
  glob: {
    description: 'Find files matching a glob pattern (e.g., **/*.tsx, src/**/*.ts)',
    parameters: z.object({
      pattern: z.string().describe('The glob pattern to match files'),
    }),
  },
  
  grep: {
    description: 'Search for text patterns in files using regex',
    parameters: z.object({
      pattern: z.string().describe('The regex pattern to search for'),
      path: z.string().optional().describe('Optional path to limit search scope'),
    }),
  },
}

export type ToolName = keyof typeof toolSchemas
export type ToolResult = {
  success: boolean
  data?: unknown
  error?: string
}
