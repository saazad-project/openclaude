"use client";

import { useState, useCallback, useRef } from "react";
import { generateId } from "@/lib/utils";
import type { ChatMessage, GeneratedFile, CodeGenerationResponse } from "@/lib/longcat";
import { parseCodeResponse } from "@/lib/longcat";

interface UseChatOptions {
  onCodeGenerated?: (response: CodeGenerationResponse) => void;
  onError?: (error: Error) => void;
}

export function useChat(options: UseChatOptions = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (content: string, context?: string) => {
      if (!content.trim() || isLoading) return;

      // Add user message
      const userMessage: ChatMessage = {
        id: generateId(),
        role: "user",
        content: content.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setStreamingContent("");

      // Create abort controller for cancellation
      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [...messages, userMessage].map((m) => ({
              role: m.role,
              content: m.content,
            })),
            context,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let fullContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;

              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  fullContent += parsed.content;
                  setStreamingContent(fullContent);
                }
              } catch {
                // Ignore parsing errors for incomplete chunks
              }
            }
          }
        }

        // Create assistant message
        const assistantMessage: ChatMessage = {
          id: generateId(),
          role: "assistant",
          content: fullContent,
          timestamp: new Date(),
        };

        // Try to parse code from the response
        const codeResponse = parseCodeResponse(fullContent);
        if (codeResponse) {
          assistantMessage.files = codeResponse.files;
          setGeneratedFiles(codeResponse.files);
          options.onCodeGenerated?.(codeResponse);
        }

        setMessages((prev) => [...prev, assistantMessage]);
        setStreamingContent("");
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          // Request was cancelled
          return;
        }

        const errorMessage =
          error instanceof Error ? error.message : "An error occurred";
        options.onError?.(new Error(errorMessage));

        // Add error message
        setMessages((prev) => [
          ...prev,
          {
            id: generateId(),
            role: "assistant",
            content: `Error: ${errorMessage}`,
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [messages, isLoading, options]
  );

  const cancelStream = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
    setStreamingContent("");
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setGeneratedFiles([]);
    setStreamingContent("");
  }, []);

  return {
    messages,
    isLoading,
    streamingContent,
    generatedFiles,
    sendMessage,
    cancelStream,
    clearMessages,
    setGeneratedFiles,
  };
}
