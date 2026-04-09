"use client";

import { useState } from "react";
import { Check, Copy, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/lib/longcat";

interface MessageBubbleProps {
  message: ChatMessage;
  isStreaming?: boolean;
}

export function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "message-enter flex gap-3",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          isUser
            ? "bg-primary/10 text-primary"
            : "bg-gradient-to-br from-primary/20 to-primary/5"
        )}
      >
        {isUser ? (
          <User className="h-4 w-4" />
        ) : (
          <span className="text-xs font-bold text-primary">OC</span>
        )}
      </div>

      {/* Content */}
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-card border border-border"
        )}
      >
        <MessageContent
          content={message.content}
          isUser={isUser}
          isStreaming={isStreaming}
        />
        {message.files && message.files.length > 0 && (
          <div className="mt-3 border-t border-border/50 pt-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Generated {message.files.length} file(s)
            </p>
            <div className="flex flex-wrap gap-2">
              {message.files.map((file, index) => (
                <span
                  key={index}
                  className="rounded-md bg-secondary px-2 py-1 font-mono text-xs text-secondary-foreground"
                >
                  {file.path}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface MessageContentProps {
  content: string;
  isUser: boolean;
  isStreaming?: boolean;
}

function MessageContent({ content, isUser, isStreaming }: MessageContentProps) {
  // Parse content for code blocks
  const parts = parseContent(content);

  return (
    <div className={cn("text-sm leading-relaxed", isStreaming && "streaming-cursor")}>
      {parts.map((part, index) => {
        if (part.type === "code") {
          return (
            <CodeBlock
              key={index}
              code={part.content}
              language={part.language}
            />
          );
        }
        return (
          <span
            key={index}
            className={cn(
              "whitespace-pre-wrap",
              !isUser && "text-foreground"
            )}
          >
            {part.content}
          </span>
        );
      })}
    </div>
  );
}

interface CodeBlockProps {
  code: string;
  language?: string;
}

function CodeBlock({ code, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 overflow-hidden rounded-lg border border-border bg-background">
      <div className="flex items-center justify-between border-b border-border bg-card px-3 py-2">
        <span className="font-mono text-xs text-muted-foreground">
          {language || "code"}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              Copy
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-sm">
        <code className="font-mono text-foreground">{code}</code>
      </pre>
    </div>
  );
}

interface ContentPart {
  type: "text" | "code";
  content: string;
  language?: string;
}

function parseContent(content: string): ContentPart[] {
  const parts: ContentPart[] = [];
  const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;

  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Add text before code block
    if (match.index > lastIndex) {
      const text = content.slice(lastIndex, match.index).trim();
      if (text) {
        parts.push({ type: "text", content: text });
      }
    }

    // Add code block
    parts.push({
      type: "code",
      content: match[2].trim(),
      language: match[1] || "code",
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    const text = content.slice(lastIndex).trim();
    if (text) {
      parts.push({ type: "text", content: text });
    }
  }

  // If no parts were found, return the whole content as text
  if (parts.length === 0) {
    parts.push({ type: "text", content });
  }

  return parts;
}
