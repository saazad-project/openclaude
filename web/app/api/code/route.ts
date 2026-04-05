/**
 * AI Code Builder API Route
 * Handles streaming AI responses with tool calls
 */

import { streamText, type Message } from "ai";
import { buildSystemPrompt } from "@/lib/ai/prompts";
import { getAvailableModel, handleProviderError, markProviderSuccess } from "@/lib/ai/provider";
import { selectProvider } from "@/lib/ai/key-rotation";

export const maxDuration = 60;

// ============================================================
// TOOL DEFINITIONS (JSON Schema for AI SDK)
// ============================================================

const toolDefinitions = {
  FileRead: {
    description: "Read the contents of a file at the specified path. Always read before editing.",
    parameters: {
      type: "object" as const,
      properties: {
        path: {
          type: "string",
          description: "The absolute path of the file to read (e.g., /src/app.tsx)",
        },
      },
      required: ["path"],
    },
  },
  FileWrite: {
    description: "Create a new file or completely overwrite an existing file.",
    parameters: {
      type: "object" as const,
      properties: {
        path: {
          type: "string",
          description: "The absolute path of the file to create/overwrite",
        },
        content: {
          type: "string",
          description: "The content to write to the file",
        },
      },
      required: ["path", "content"],
    },
  },
  FileEdit: {
    description:
      "Edit an existing file by replacing specific text. The old_string must be an exact match found in the file.",
    parameters: {
      type: "object" as const,
      properties: {
        path: {
          type: "string",
          description: "The absolute path of the file to edit",
        },
        old_string: {
          type: "string",
          description: "The exact text to find and replace (must be unique in the file)",
        },
        new_string: {
          type: "string",
          description: "The replacement text",
        },
      },
      required: ["path", "old_string", "new_string"],
    },
  },
  Glob: {
    description: 'Find files matching a glob pattern (e.g., "**/*.tsx", "src/**/*.ts").',
    parameters: {
      type: "object" as const,
      properties: {
        pattern: {
          type: "string",
          description: 'Glob pattern to match files (e.g., "**/*.tsx")',
        },
      },
      required: ["pattern"],
    },
  },
  Grep: {
    description:
      "Search for a pattern in file contents. Returns matching lines with file paths.",
    parameters: {
      type: "object" as const,
      properties: {
        pattern: {
          type: "string",
          description: "Regex pattern to search for in file contents",
        },
        path: {
          type: "string",
          description: "Optional path to limit search scope",
        },
      },
      required: ["pattern"],
    },
  },
};

// ============================================================
// REQUEST HANDLER
// ============================================================

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, projectFiles } = body as {
      messages: Message[];
      projectFiles?: string[];
    };

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Invalid request: messages array required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Build system prompt with project context
    const systemPrompt = buildSystemPrompt(projectFiles);

    // Get available model with key rotation
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      const providerConfig = selectProvider();
      
      if (!providerConfig) {
        return new Response(
          JSON.stringify({ 
            error: "No API keys available. Please configure LONGCAT_KEYS or GEMINI_KEYS environment variables." 
          }),
          { status: 503, headers: { "Content-Type": "application/json" } }
        );
      }

      try {
        const { model, config } = getAvailableModel();

        const result = streamText({
          model,
          system: systemPrompt,
          messages,
          tools: toolDefinitions,
          maxSteps: 10, // Allow up to 10 tool calls per request
          onFinish: () => {
            markProviderSuccess(config);
          },
        });

        return result.toDataStreamResponse();
      } catch (error) {
        const shouldRetry = handleProviderError(providerConfig, error);
        if (!shouldRetry) {
          throw error;
        }
        attempts++;
        console.log(`[API] Retrying with different key (attempt ${attempts}/${maxAttempts})`);
      }
    }

    return new Response(
      JSON.stringify({ error: "All API keys exhausted. Please try again later." }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[API] Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
