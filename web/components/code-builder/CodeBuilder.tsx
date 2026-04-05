"use client";

import { useEffect, useState } from "react";
import { FileExplorer } from "./FileExplorer";
import { CodeEditor } from "./CodeEditor";
import { ChatPanel } from "./ChatPanel";
import { TerminalPanel } from "./TerminalPanel";
import { createSampleProject, useFileStore } from "@/lib/store/files";
import { Menu, Settings, Download, Github, Moon } from "lucide-react";

// ============================================================
// HEADER
// ============================================================

function Header() {
  const { exportFiles, getAllPaths } = useFileStore();

  const handleDownload = () => {
    const files = exportFiles();
    const content = JSON.stringify(files, null, 2);
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "project.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <header className="h-12 flex items-center justify-between px-4 bg-[var(--muted)] border-b border-[var(--border)]">
      <div className="flex items-center gap-3">
        <button className="p-2 hover:bg-[var(--border)] rounded lg:hidden">
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded bg-[var(--accent)] flex items-center justify-center">
            <span className="text-sm font-bold text-[var(--accent-foreground)]">
              AI
            </span>
          </div>
          <span className="font-semibold hidden sm:inline">Code Builder</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="text-xs text-[var(--muted-foreground)] hidden md:block">
          {getAllPaths().length} files
        </div>
        <button
          onClick={handleDownload}
          className="p-2 hover:bg-[var(--border)] rounded"
          title="Download Project"
        >
          <Download className="h-4 w-4" />
        </button>
        <a
          href="https://github.com/saazad-project/openclaude"
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 hover:bg-[var(--border)] rounded"
          title="GitHub"
        >
          <Github className="h-4 w-4" />
        </a>
        <button
          className="p-2 hover:bg-[var(--border)] rounded"
          title="Settings"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}

// ============================================================
// RESIZE HANDLE
// ============================================================

interface ResizeHandleProps {
  direction: "vertical" | "horizontal";
  onResize: (delta: number) => void;
}

function ResizeHandle({ direction, onResize }: ResizeHandleProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);

    const startPos = direction === "horizontal" ? e.clientX : e.clientY;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const currentPos =
        direction === "horizontal" ? moveEvent.clientX : moveEvent.clientY;
      onResize(currentPos - startPos);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div
      className={`
        ${direction === "horizontal" ? "w-1 cursor-col-resize" : "h-1 cursor-row-resize"}
        ${isDragging ? "bg-[var(--accent)]" : "bg-transparent hover:bg-[var(--border)]"}
        transition-colors
      `}
      onMouseDown={handleMouseDown}
    />
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export function CodeBuilder() {
  const [sidebarWidth, setSidebarWidth] = useState(220);
  const [chatWidth, setChatWidth] = useState(380);
  const [terminalHeight, setTerminalHeight] = useState(180);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize with sample project on first load
  useEffect(() => {
    if (!isInitialized) {
      const files = useFileStore.getState().getAllPaths();
      if (files.length === 0) {
        createSampleProject();
      }
      setIsInitialized(true);
    }
  }, [isInitialized]);

  // Handle resize
  const handleSidebarResize = (delta: number) => {
    setSidebarWidth((w) => Math.max(150, Math.min(400, w + delta)));
  };

  const handleChatResize = (delta: number) => {
    setChatWidth((w) => Math.max(280, Math.min(600, w - delta)));
  };

  const handleTerminalResize = (delta: number) => {
    setTerminalHeight((h) => Math.max(100, Math.min(400, h - delta)));
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />

      <div className="flex-1 flex overflow-hidden">
        {/* File Explorer */}
        <div style={{ width: sidebarWidth }} className="shrink-0 hidden lg:block">
          <FileExplorer />
        </div>
        <ResizeHandle direction="horizontal" onResize={handleSidebarResize} />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Editor + Chat */}
          <div className="flex-1 flex overflow-hidden">
            {/* Code Editor */}
            <div className="flex-1 min-w-0">
              <CodeEditor />
            </div>
            <ResizeHandle direction="horizontal" onResize={handleChatResize} />

            {/* Chat Panel */}
            <div style={{ width: chatWidth }} className="shrink-0 hidden md:block">
              <ChatPanel />
            </div>
          </div>

          <ResizeHandle direction="vertical" onResize={handleTerminalResize} />

          {/* Terminal */}
          <div style={{ height: terminalHeight }} className="shrink-0">
            <TerminalPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
