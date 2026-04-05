/**
 * AI Tool Definitions
 * Compatible with Vercel AI SDK
 */

import { z } from "zod";
import { tool } from "ai";
import type { FileStore } from "@/lib/store/files";

// ============================================================
// TOOL SCHEMAS
// ============================================================

export const FileReadSchema = z.object({
  path: z.string().describe("The absolute path of the file to read"),
});

export const FileWriteSchema = z.object({
  path: z.string().describe("The absolute path of the file to create/overwrite"),
  content: z.string().describe("The content to write to the file"),
});

export const FileEditSchema = z.object({
  path: z.string().describe("The absolute path of the file to edit"),
  old_string: z
    .string()
    .describe("The exact text to find and replace (must be unique in the file)"),
  new_string: z.string().describe("The replacement text"),
});

export const GlobSchema = z.object({
  pattern: z.string().describe('Glob pattern to match files (e.g., "**/*.tsx")'),
});

export const GrepSchema = z.object({
  pattern: z.string().describe("Regex pattern to search for in file contents"),
  path: z
    .string()
    .optional()
    .describe("Optional path to limit search scope"),
});

// ============================================================
// TOOL IMPLEMENTATIONS
// ============================================================

export function createTools(fileStore: FileStore) {
  return {
    FileRead: tool({
      description: "Read the contents of a file at the specified path. Always read before editing.",
      parameters: FileReadSchema,
      execute: async ({ path }) => {
        const content = fileStore.readFile(path);
        if (content === null) {
          return { success: false, error: `File not found: ${path}` };
        }
        return { success: true, content, path };
      },
    }),

    FileWrite: tool({
      description: "Create a new file or completely overwrite an existing file.",
      parameters: FileWriteSchema,
      execute: async ({ path, content }) => {
        fileStore.writeFile(path, content);
        return { success: true, path, message: `File written: ${path}` };
      },
    }),

    FileEdit: tool({
      description:
        "Edit an existing file by replacing specific text. The old_string must be an exact match found in the file.",
      parameters: FileEditSchema,
      execute: async ({ path, old_string, new_string }) => {
        const result = fileStore.editFile(path, old_string, new_string);
        if (!result.success) {
          return {
            success: false,
            error: result.error,
            hint: "Try reading the file first to get the exact content",
          };
        }
        return { success: true, path, message: "File edited successfully" };
      },
    }),

    Glob: tool({
      description: 'Find files matching a glob pattern (e.g., "**/*.tsx", "src/**/*.ts").',
      parameters: GlobSchema,
      execute: async ({ pattern }) => {
        const files = fileStore.glob(pattern);
        return {
          success: true,
          files,
          count: files.length,
          message: `Found ${files.length} file(s) matching "${pattern}"`,
        };
      },
    }),

    Grep: tool({
      description: "Search for a pattern in file contents. Returns matching lines with file paths and line numbers.",
      parameters: GrepSchema,
      execute: async ({ pattern, path }) => {
        const results = fileStore.grep(pattern, path);
        return {
          success: true,
          results,
          count: results.length,
          message: `Found ${results.length} match(es) for "${pattern}"`,
        };
      },
    }),
  };
}

// ============================================================
// TOOL RESULT FORMATTING
// ============================================================

export function formatToolResult(
  toolName: string,
  result: unknown
): string {
  if (typeof result !== "object" || result === null) {
    return String(result);
  }

  const r = result as Record<string, unknown>;

  if (!r.success) {
    return `Error: ${r.error || "Unknown error"}`;
  }

  switch (toolName) {
    case "FileRead":
      return `--- ${r.path} ---\n${r.content}`;

    case "FileWrite":
    case "FileEdit":
      return String(r.message);

    case "Glob":
      if (Array.isArray(r.files) && r.files.length > 0) {
        return `Found ${r.count} files:\n${(r.files as string[]).map((f) => `  ${f}`).join("\n")}`;
      }
      return "No files found matching the pattern.";

    case "Grep":
      if (Array.isArray(r.results) && r.results.length > 0) {
        return `Found ${r.count} matches:\n${(r.results as { file: string; line: number; content: string }[])
          .map((m) => `${m.file}:${m.line}: ${m.content}`)
          .join("\n")}`;
      }
      return "No matches found.";

    default:
      return JSON.stringify(result, null, 2);
  }
}
