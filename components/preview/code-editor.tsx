"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GeneratedFile } from "@/lib/longcat";

interface CodeEditorProps {
  file: GeneratedFile;
  files: GeneratedFile[];
  onFileSelect: (file: GeneratedFile) => void;
}

export function CodeEditor({ file, files, onFileSelect }: CodeEditorProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(file.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex h-full flex-col">
      {/* File tabs */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-border bg-card/50 px-2">
        {files.map((f) => (
          <button
            key={f.path}
            onClick={() => onFileSelect(f)}
            className={cn(
              "flex shrink-0 items-center gap-2 border-b-2 px-3 py-2 text-xs font-medium transition-colors",
              f.path === file.path
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <FileIcon extension={f.path.split(".").pop() || ""} />
            {f.path.split("/").pop()}
          </button>
        ))}
      </div>

      {/* Code content */}
      <div className="flex-1 overflow-auto">
        <div className="relative">
          {/* Copy button */}
          <button
            onClick={handleCopy}
            className="absolute right-4 top-4 z-10 flex items-center gap-1.5 rounded-md bg-secondary px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-secondary/80 hover:text-foreground transition-colors"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copy
              </>
            )}
          </button>

          {/* Line numbers + code */}
          <div className="flex">
            {/* Line numbers */}
            <div className="shrink-0 select-none border-r border-border bg-card/30 px-4 py-4 text-right font-mono text-xs text-muted-foreground">
              {file.content.split("\n").map((_, i) => (
                <div key={i} className="leading-6">
                  {i + 1}
                </div>
              ))}
            </div>

            {/* Code */}
            <pre className="flex-1 overflow-x-auto p-4">
              <code className="font-mono text-sm leading-6 text-foreground">
                <SyntaxHighlight
                  code={file.content}
                  language={file.language || file.path.split(".").pop() || ""}
                />
              </code>
            </pre>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border bg-card/50 px-4 py-2 text-xs text-muted-foreground">
        <span>{file.path}</span>
        <span>
          {file.content.split("\n").length} lines |{" "}
          {new Blob([file.content]).size} bytes
        </span>
      </div>
    </div>
  );
}

function FileIcon({ extension }: { extension: string }) {
  const colors: Record<string, string> = {
    tsx: "text-blue-400",
    ts: "text-blue-400",
    jsx: "text-yellow-400",
    js: "text-yellow-400",
    css: "text-pink-400",
    html: "text-orange-400",
    json: "text-green-400",
  };

  return (
    <div className={cn("h-3 w-3 rounded-sm", colors[extension] || "text-gray-400")}>
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-full w-full">
        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
      </svg>
    </div>
  );
}

// Simple syntax highlighting
function SyntaxHighlight({ code, language }: { code: string; language: string }) {
  const lines = code.split("\n");

  return (
    <>
      {lines.map((line, i) => (
        <div key={i} className="leading-6">
          {highlightLine(line, language)}
        </div>
      ))}
    </>
  );
}

function highlightLine(line: string, language: string): React.ReactNode {
  if (!line.trim()) return " ";

  const tokens: { text: string; type: string }[] = [];
  let remaining = line;

  // Keywords
  const keywords = [
    "import",
    "export",
    "default",
    "from",
    "const",
    "let",
    "var",
    "function",
    "return",
    "if",
    "else",
    "for",
    "while",
    "class",
    "interface",
    "type",
    "extends",
    "implements",
    "async",
    "await",
    "try",
    "catch",
    "throw",
    "new",
  ];

  // Simple tokenization
  const patterns = [
    { regex: /^(\/\/.*$)/, type: "comment" },
    { regex: /^(\/\*[\s\S]*?\*\/)/, type: "comment" },
    { regex: /^("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/, type: "string" },
    { regex: /^(\d+\.?\d*)/, type: "number" },
    { regex: new RegExp(`^\\b(${keywords.join("|")})\\b`), type: "keyword" },
    { regex: /^([a-zA-Z_$][a-zA-Z0-9_$]*)/, type: "identifier" },
    { regex: /^([{}[\]().,;:])/, type: "punctuation" },
    { regex: /^([+\-*/%=<>!&|^~?:]+)/, type: "operator" },
    { regex: /^(\s+)/, type: "whitespace" },
    { regex: /^(<[^>]+>)/, type: "jsx" },
  ];

  while (remaining) {
    let matched = false;
    for (const { regex, type } of patterns) {
      const match = remaining.match(regex);
      if (match) {
        tokens.push({ text: match[0], type });
        remaining = remaining.slice(match[0].length);
        matched = true;
        break;
      }
    }
    if (!matched) {
      tokens.push({ text: remaining[0], type: "text" });
      remaining = remaining.slice(1);
    }
  }

  const colorMap: Record<string, string> = {
    keyword: "text-pink-400",
    string: "text-green-400",
    number: "text-orange-400",
    comment: "text-gray-500",
    identifier: "text-foreground",
    punctuation: "text-gray-400",
    operator: "text-cyan-400",
    jsx: "text-blue-400",
    whitespace: "",
    text: "text-foreground",
  };

  return (
    <>
      {tokens.map((token, i) => (
        <span key={i} className={colorMap[token.type] || ""}>
          {token.text}
        </span>
      ))}
    </>
  );
}
