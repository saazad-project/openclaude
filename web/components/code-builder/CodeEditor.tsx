"use client";

import { useCallback } from "react";
import Editor from "@monaco-editor/react";
import { useFileStore } from "@/lib/store/files";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================
// EDITOR TABS
// ============================================================

function EditorTabs() {
  const { openTabs, activeFile, setActiveFile, closeTab, unsavedChanges } =
    useFileStore();

  if (openTabs.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center bg-[var(--muted)] border-b border-[var(--border)] overflow-x-auto">
      {openTabs.map((path) => {
        const fileName = path.split("/").pop() || path;
        const isActive = activeFile === path;
        const hasUnsavedChanges = unsavedChanges.has(path);

        return (
          <div
            key={path}
            className={cn(
              "flex items-center gap-2 px-3 py-2 border-r border-[var(--border)] cursor-pointer group min-w-0",
              isActive
                ? "bg-[var(--panel)] text-[var(--foreground)]"
                : "text-[var(--muted-foreground)] hover:bg-[var(--panel)]"
            )}
            onClick={() => setActiveFile(path)}
          >
            <span className="text-sm truncate max-w-[120px]">
              {hasUnsavedChanges && (
                <span className="text-[var(--warning)] mr-1">*</span>
              )}
              {fileName}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeTab(path);
              }}
              className={cn(
                "p-0.5 rounded hover:bg-[var(--muted)]",
                isActive
                  ? "opacity-100"
                  : "opacity-0 group-hover:opacity-100"
              )}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// EMPTY STATE
// ============================================================

function EmptyState() {
  return (
    <div className="h-full flex items-center justify-center text-[var(--muted-foreground)]">
      <div className="text-center">
        <div className="text-4xl mb-4 opacity-20">{"</>"}</div>
        <p className="text-sm">Select a file to edit</p>
        <p className="text-xs mt-2">or create a new file from the explorer</p>
      </div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export function CodeEditor() {
  const { activeFile, getFile, writeFile, markUnsaved } = useFileStore();

  const file = activeFile ? getFile(activeFile) : null;

  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      if (activeFile && value !== undefined) {
        writeFile(activeFile, value);
        markUnsaved(activeFile);
      }
    },
    [activeFile, writeFile, markUnsaved]
  );

  return (
    <div className="h-full flex flex-col bg-[var(--panel)]">
      <EditorTabs />

      <div className="flex-1 overflow-hidden">
        {file ? (
          <Editor
            height="100%"
            language={file.language}
            value={file.content}
            onChange={handleEditorChange}
            theme="vs-dark"
            options={{
              fontSize: 14,
              fontFamily: "'Fira Code', 'Consolas', monospace",
              fontLigatures: true,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              lineNumbers: "on",
              renderLineHighlight: "line",
              cursorBlinking: "smooth",
              smoothScrolling: true,
              padding: { top: 8, bottom: 8 },
              wordWrap: "on",
              tabSize: 2,
              insertSpaces: true,
              automaticLayout: true,
            }}
          />
        ) : (
          <EmptyState />
        )}
      </div>

      {/* Status Bar */}
      {file && (
        <div className="flex items-center justify-between px-3 py-1 bg-[var(--accent)] text-[var(--accent-foreground)] text-xs">
          <div className="flex items-center gap-4">
            <span>{file.path}</span>
          </div>
          <div className="flex items-center gap-4">
            <span>{file.language}</span>
            <span>UTF-8</span>
          </div>
        </div>
      )}
    </div>
  );
}
