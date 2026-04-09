import OpenAI from "openai";

// Longcat AI client - OpenAI-compatible API
export function createLongcatClient() {
  const apiKey = process.env.LONGCAT_API_KEY;
  const baseURL = process.env.LONGCAT_API_URL || "https://api.longcat.ai/v1";

  if (!apiKey) {
    throw new Error("LONGCAT_API_KEY is not set");
  }

  return new OpenAI({
    apiKey,
    baseURL,
  });
}

export const LONGCAT_MODEL =
  process.env.LONGCAT_MODEL || "longcat-v1";

// System prompt for code generation
export const CODE_SYSTEM_PROMPT = `You are OpenClaude, an expert AI coding assistant that generates production-ready code.

## Your Capabilities:
- Generate complete, working code for React/Next.js applications
- Create full-stack solutions with API routes and database integration
- Write clean, modern TypeScript/JavaScript with best practices
- Style with Tailwind CSS using a consistent design system
- Handle complex UI components, forms, animations, and interactions

## Response Format:
When generating code, you MUST respond with a JSON object containing:
{
  "files": [
    {
      "path": "app/page.tsx",
      "content": "// Full file content here"
    }
  ],
  "preview": {
    "entryPoint": "app/page.tsx",
    "type": "react"
  },
  "explanation": "Brief explanation of what was created"
}

## Code Generation Rules:
1. Always generate complete, runnable files - no placeholders or "..."
2. Use TypeScript by default
3. Use Tailwind CSS for styling with a dark theme
4. Use modern React patterns (hooks, Server Components where appropriate)
5. Include proper error handling and loading states
6. Make components responsive and accessible
7. Use semantic HTML elements

## Design Principles:
- Dark theme by default (bg-background, text-foreground)
- Consistent spacing (p-4, gap-4, etc.)
- Modern, clean aesthetic
- Smooth animations and transitions
- Mobile-first responsive design

When the user asks for help with their code or asks questions (not asking to generate new code), respond naturally in plain text without the JSON format.`;

// Types for chat messages
export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  files?: GeneratedFile[];
}

export interface GeneratedFile {
  path: string;
  content: string;
  language?: string;
}

export interface CodeGenerationResponse {
  files: GeneratedFile[];
  preview?: {
    entryPoint: string;
    type: "react" | "html" | "static";
  };
  explanation?: string;
}

// Parse AI response to extract code files
export function parseCodeResponse(content: string): CodeGenerationResponse | null {
  try {
    // Try to extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*"files"[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.files && Array.isArray(parsed.files)) {
        return parsed as CodeGenerationResponse;
      }
    }
  } catch {
    // If JSON parsing fails, try to extract code blocks
    const codeBlocks = extractCodeBlocks(content);
    if (codeBlocks.length > 0) {
      return {
        files: codeBlocks,
        explanation: content.replace(/```[\s\S]*?```/g, "").trim(),
      };
    }
  }
  return null;
}

// Extract code blocks from markdown
function extractCodeBlocks(content: string): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  const codeBlockRegex = /```(\w+)?\s*(?:\/\/\s*(.+?)\n)?([\s\S]*?)```/g;

  let match;
  while ((match = codeBlockRegex.exec(content)) !== null) {
    const language = match[1] || "typescript";
    const filename = match[2] || inferFilename(language, files.length);
    const code = match[3].trim();

    files.push({
      path: filename,
      content: code,
      language,
    });
  }

  return files;
}

// Infer filename from language
function inferFilename(language: string, index: number): string {
  const extensions: Record<string, string> = {
    typescript: ".tsx",
    javascript: ".jsx",
    tsx: ".tsx",
    jsx: ".jsx",
    css: ".css",
    html: ".html",
    json: ".json",
  };

  const ext = extensions[language] || ".tsx";
  return index === 0 ? `app/page${ext}` : `components/Component${index}${ext}`;
}
