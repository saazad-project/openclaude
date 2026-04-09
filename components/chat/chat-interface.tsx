"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Square, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/lib/longcat";
import { MessageBubble } from "./message-bubble";

interface ChatInterfaceProps {
  messages: ChatMessage[];
  streamingContent: string;
  isLoading: boolean;
  onSendMessage: (message: string, context?: string) => void;
  onCancelStream: () => void;
  onClearMessages: () => void;
  uploadedFiles?: File[];
}

export function ChatInterface({
  messages,
  streamingContent,
  isLoading,
  onSendMessage,
  onCancelStream,
  onClearMessages,
}: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <span className="text-sm font-bold text-primary">OC</span>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground">OpenClaude</h1>
            <p className="text-xs text-muted-foreground">AI Coding Assistant</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={onClearMessages}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 && !streamingContent ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5">
              <span className="text-2xl font-bold text-primary">OC</span>
            </div>
            <h2 className="mb-2 text-xl font-semibold text-foreground">
              What would you like to build?
            </h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              Describe your project and I&apos;ll generate the code with a live preview.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {[
                "Create a landing page",
                "Build a dashboard",
                "Design a form",
                "Make a card component",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {streamingContent && (
              <MessageBubble
                message={{
                  id: "streaming",
                  role: "assistant",
                  content: streamingContent,
                  timestamp: new Date(),
                }}
                isStreaming
              />
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border p-4">
        <form onSubmit={handleSubmit} className="relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what you want to build..."
            rows={1}
            className={cn(
              "w-full resize-none rounded-xl border border-border bg-card px-4 py-3 pr-12",
              "text-sm text-foreground placeholder:text-muted-foreground",
              "focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary",
              "transition-colors"
            )}
            disabled={isLoading}
          />
          <div className="absolute bottom-2 right-2">
            {isLoading ? (
              <button
                type="button"
                onClick={onCancelStream}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
              >
                <Square className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                  input.trim()
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                <Send className="h-4 w-4" />
              </button>
            )}
          </div>
        </form>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
