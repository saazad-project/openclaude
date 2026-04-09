"use client";

import { useState, useCallback } from "react";
import { Menu, X, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChat } from "@/lib/hooks/use-chat";
import { ChatInterface } from "@/components/chat/chat-interface";
import { PreviewPanel } from "@/components/preview/preview-panel";
import { FileUpload, useFileUpload } from "@/components/upload/file-upload";
import type { CodeGenerationResponse } from "@/lib/longcat";

export default function HomePage() {
  const [showMobileChat, setShowMobileChat] = useState(true);
  const [showUploadPanel, setShowUploadPanel] = useState(false);

  const { files: uploadedFiles, setFiles: setUploadedFiles, getContextFromFiles, clearFiles } = useFileUpload();

  const handleCodeGenerated = useCallback((response: CodeGenerationResponse) => {
    // Code was generated, files are already stored in the chat hook
    console.log("[v0] Code generated:", response.files.length, "files");
  }, []);

  const {
    messages,
    isLoading,
    streamingContent,
    generatedFiles,
    sendMessage,
    cancelStream,
    clearMessages,
  } = useChat({
    onCodeGenerated: handleCodeGenerated,
    onError: (error) => {
      console.error("[v0] Chat error:", error);
    },
  });

  const handleSendMessage = useCallback(
    (message: string) => {
      const context = getContextFromFiles();
      sendMessage(message, context || undefined);
      // Clear uploaded files after sending
      if (uploadedFiles.length > 0) {
        clearFiles();
        setShowUploadPanel(false);
      }
    },
    [sendMessage, getContextFromFiles, uploadedFiles.length, clearFiles]
  );

  const handleClearMessages = useCallback(() => {
    clearMessages();
    clearFiles();
  }, [clearMessages, clearFiles]);

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Mobile Header */}
      <header className="flex items-center justify-between border-b border-border px-4 py-3 lg:hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <span className="text-sm font-bold text-primary">OC</span>
          </div>
          <span className="text-sm font-semibold text-foreground">OpenClaude</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowUploadPanel(!showUploadPanel)}
            className={cn(
              "rounded-md p-2 transition-colors",
              showUploadPanel
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary"
            )}
          >
            <Upload className="h-5 w-5" />
          </button>
          <button
            onClick={() => setShowMobileChat(!showMobileChat)}
            className="rounded-md p-2 text-muted-foreground hover:bg-secondary transition-colors"
          >
            {showMobileChat ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </header>

      {/* Mobile Upload Panel */}
      {showUploadPanel && (
        <div className="border-b border-border p-4 lg:hidden">
          <FileUpload files={uploadedFiles} onFilesChange={setUploadedFiles} />
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {/* Desktop Layout - Grid-based split pane */}
        <div className="hidden h-full grid-cols-2 gap-0 lg:grid">
          {/* Chat Panel */}
          <div className="flex flex-col border-r border-border">
            {/* Desktop Upload Toggle */}
            <div className="border-b border-border">
              <button
                onClick={() => setShowUploadPanel(!showUploadPanel)}
                className={cn(
                  "flex w-full items-center gap-2 px-4 py-2 text-xs font-medium transition-colors",
                  showUploadPanel
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <Upload className="h-3.5 w-3.5" />
                {uploadedFiles.length > 0
                  ? `${uploadedFiles.length} file(s) attached`
                  : "Attach files for context"}
              </button>
            </div>

            {/* Desktop Upload Panel */}
            {showUploadPanel && (
              <div className="border-b border-border p-4">
                <FileUpload files={uploadedFiles} onFilesChange={setUploadedFiles} />
              </div>
            )}

            {/* Chat Interface */}
            <div className="flex-1 overflow-hidden">
              <ChatInterface
                messages={messages}
                streamingContent={streamingContent}
                isLoading={isLoading}
                onSendMessage={handleSendMessage}
                onCancelStream={cancelStream}
                onClearMessages={handleClearMessages}
              />
            </div>
          </div>

          {/* Preview Panel */}
          <div className="overflow-hidden">
            <PreviewPanel files={generatedFiles} isGenerating={isLoading} />
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="flex h-full lg:hidden">
          {showMobileChat ? (
            <div className="w-full">
              <ChatInterface
                messages={messages}
                streamingContent={streamingContent}
                isLoading={isLoading}
                onSendMessage={handleSendMessage}
                onCancelStream={cancelStream}
                onClearMessages={handleClearMessages}
              />
            </div>
          ) : (
            <div className="w-full">
              <PreviewPanel files={generatedFiles} isGenerating={isLoading} />
            </div>
          )}
        </div>
      </main>

      {/* Mobile Tab Bar */}
      <nav className="flex border-t border-border lg:hidden">
        <button
          onClick={() => setShowMobileChat(true)}
          className={cn(
            "flex flex-1 flex-col items-center gap-1 py-3 text-xs transition-colors",
            showMobileChat
              ? "text-primary"
              : "text-muted-foreground"
          )}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          Chat
        </button>
        <button
          onClick={() => setShowMobileChat(false)}
          className={cn(
            "flex flex-1 flex-col items-center gap-1 py-3 text-xs transition-colors",
            !showMobileChat
              ? "text-primary"
              : "text-muted-foreground"
          )}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
          Preview
        </button>
      </nav>
    </div>
  );
}
