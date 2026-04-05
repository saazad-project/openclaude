"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "ai/react";
import { useFileStore } from "@/lib/store/files";
import { cn } from "@/lib/utils";
import {
  Send,
  Bot,
  User,
  Loader2,
  FileCode,
  Search,
  FolderSearch,
  PenLine,
  FileOutput,
} from "lucide-react";

// ============================================================
// TOOL CALL BADGE
// ============================================================

interface ToolCallBadgeProps {
  name: string;
  args: Record<string, unknown>;
  status: "pending" | "success" | "error";
}

function ToolCallBadge({ name, args, status }: ToolCallBadgeProps) {
  const icons: Record<string, React.ReactNode> = {
    FileRead: <FileCode className="h-3 w-3" />,
    FileWrite: <FileOutput className="h-3 w-3" />,
    FileEdit: <PenLine className="h-3 w-3" />,
    Glob: <FolderSearch className="h-3 w-3" />,
    Grep: <Search className="h-3 w-3" />,
  };

  const statusColors = {
    pending: "bg-[var(--warning)]/20 border-[var(--warning)]",
    success: "bg-[var(--success)]/20 border-[var(--success)]",
    error: "bg-[var(--error)]/20 border-[var(--error)]",
  };

  const displayArg =
    (args.path as string) ||
    (args.pattern as string) ||
    Object.values(args)[0]?.toString().slice(0, 30);

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs border",
        statusColors[status]
      )}
    >
      {status === "pending" ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        icons[name] || <FileCode className="h-3 w-3" />
      )}
      <span className="font-medium">{name}</span>
      {displayArg && (
        <span className="text-[var(--muted-foreground)] truncate max-w-[150px]">
          {displayArg}
        </span>
      )}
    </div>
  );
}

// ============================================================
// MESSAGE COMPONENT
// ============================================================

interface MessageProps {
  role: "user" | "assistant";
  content: string;
  toolInvocations?: Array<{
    toolCallId: string;
    toolName: string;
    args: Record<string, unknown>;
    state: "partial-call" | "call" | "result";
    result?: unknown;
  }>;
}

function Message({ role, content, toolInvocations }: MessageProps) {
  const isUser = role === "user";

  return (
    <div className={cn("flex gap-3 p-4", isUser && "bg-[var(--muted)]")}>
      <div
        className={cn(
          "h-7 w-7 rounded-full flex items-center justify-center shrink-0",
          isUser ? "bg-[var(--accent)]" : "bg-[var(--success)]/20"
        )}
      >
        {isUser ? (
          <User className="h-4 w-4 text-[var(--accent-foreground)]" />
        ) : (
          <Bot className="h-4 w-4 text-[var(--success)]" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        {/* Tool invocations */}
        {toolInvocations && toolInvocations.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {toolInvocations.map((tool) => (
              <ToolCallBadge
                key={tool.toolCallId}
                name={tool.toolName}
                args={tool.args}
                status={
                  tool.state === "result"
                    ? (tool.result as { success?: boolean })?.success
                      ? "success"
                      : "error"
                    : "pending"
                }
              />
            ))}
          </div>
        )}

        {/* Message content */}
        {content && (
          <div className="prose prose-invert prose-sm max-w-none">
            <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
              {content}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export function ChatPanel() {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { getAllPaths } = useFileStore();

  const { messages, isLoading, append, setMessages } = useChat({
    api: "/api/code",
    body: {
      projectFiles: getAllPaths(),
    },
    onError: (error) => {
      console.error("Chat error:", error);
    },
  });

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const message = input.trim();
    setInput("");
    inputRef.current?.focus();

    await append({
      role: "user",
      content: message,
    });
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[var(--panel)] border-l border-[var(--border)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-[var(--success)]" />
          <span className="font-medium text-sm">AI Assistant</span>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            Clear
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center p-4">
            <div className="text-center max-w-sm">
              <Bot className="h-12 w-12 mx-auto mb-4 text-[var(--success)] opacity-50" />
              <h3 className="font-medium mb-2">AI Code Builder</h3>
              <p className="text-sm text-[var(--muted-foreground)]">
                I can help you build complete applications. Describe what you
                want to create and I&apos;ll write the code.
              </p>
              <div className="mt-4 space-y-2 text-left">
                <div className="text-xs text-[var(--muted-foreground)]">
                  Try saying:
                </div>
                <button
                  onClick={() =>
                    setInput("Create a Next.js todo app with Tailwind CSS")
                  }
                  className="block w-full text-left text-sm p-2 rounded bg-[var(--muted)] hover:bg-[var(--border)] transition-colors"
                >
                  &quot;Create a Next.js todo app with Tailwind CSS&quot;
                </button>
                <button
                  onClick={() =>
                    setInput("Build a REST API with Express and TypeScript")
                  }
                  className="block w-full text-left text-sm p-2 rounded bg-[var(--muted)] hover:bg-[var(--border)] transition-colors"
                >
                  &quot;Build a REST API with Express and TypeScript&quot;
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            {messages.map((message) => (
              <Message
                key={message.id}
                role={message.role as "user" | "assistant"}
                content={message.content}
                toolInvocations={message.toolInvocations}
              />
            ))}
            {isLoading && (
              <div className="flex items-center gap-3 p-4">
                <div className="h-7 w-7 rounded-full bg-[var(--success)]/20 flex items-center justify-center">
                  <Loader2 className="h-4 w-4 text-[var(--success)] animate-spin" />
                </div>
                <span className="text-sm text-[var(--muted-foreground)]">
                  Thinking...
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="p-3 border-t border-[var(--border)]"
      >
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what you want to build..."
            rows={2}
            className="flex-1 px-3 py-2 bg-[var(--input)] border border-[var(--border)] rounded-lg text-sm resize-none focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-4 bg-[var(--accent)] text-[var(--accent-foreground)] rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
        <div className="mt-2 text-xs text-[var(--muted-foreground)]">
          Press Enter to send, Shift+Enter for new line
        </div>
      </form>
    </div>
  );
}
