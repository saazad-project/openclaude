"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Terminal, X, Minus, Maximize2, Copy, Check } from "lucide-react";

// ============================================================
// TERMINAL OUTPUT
// ============================================================

interface TerminalLine {
  id: string;
  type: "command" | "output" | "error" | "success" | "info";
  content: string;
  timestamp: Date;
}

export function TerminalPanel() {
  const [isMinimized, setIsMinimized] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sample output - in production this would come from actual execution
  const [lines] = useState<TerminalLine[]>([
    {
      id: "1",
      type: "info",
      content: "AI Code Builder v0.1.0",
      timestamp: new Date(),
    },
    {
      id: "2",
      type: "info",
      content: "Ready to build. Type a message in the chat panel to start.",
      timestamp: new Date(),
    },
  ]);

  const handleCopy = async () => {
    const text = lines.map((l) => l.content).join("\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isMinimized) {
    return (
      <div className="h-8 flex items-center justify-between px-3 bg-[var(--muted)] border-t border-[var(--border)]">
        <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
          <Terminal className="h-4 w-4" />
          <span>Terminal</span>
        </div>
        <button
          onClick={() => setIsMinimized(false)}
          className="p-1 hover:bg-[var(--border)] rounded"
        >
          <Maximize2 className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[var(--panel)] border-t border-[var(--border)]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[var(--muted)] border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4" />
          <span className="text-sm font-medium">Terminal</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="p-1 hover:bg-[var(--border)] rounded"
            title="Copy output"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-[var(--success)]" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 hover:bg-[var(--border)] rounded"
            title="Minimize"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 hover:bg-[var(--border)] rounded"
            title="Close"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Output */}
      <div className="flex-1 overflow-y-auto p-3 font-mono text-sm">
        {lines.map((line) => (
          <div
            key={line.id}
            className={cn(
              "py-0.5",
              line.type === "command" && "text-[var(--accent)]",
              line.type === "error" && "text-[var(--error)]",
              line.type === "success" && "text-[var(--success)]",
              line.type === "info" && "text-[var(--muted-foreground)]",
              line.type === "output" && "text-[var(--foreground)]"
            )}
          >
            {line.type === "command" && (
              <span className="text-[var(--success)] mr-2">$</span>
            )}
            {line.content}
          </div>
        ))}
      </div>
    </div>
  );
}
