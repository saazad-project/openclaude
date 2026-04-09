"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Code,
  Eye,
  RefreshCw,
  Smartphone,
  Monitor,
  Tablet,
  ExternalLink,
  Download,
  FolderTree,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { GeneratedFile } from "@/lib/longcat";
import { FileTree } from "./file-tree";
import { CodeEditor } from "./code-editor";

interface PreviewPanelProps {
  files: GeneratedFile[];
  isGenerating?: boolean;
}

type ViewMode = "preview" | "code" | "files";
type DeviceSize = "mobile" | "tablet" | "desktop";

const deviceSizes: Record<DeviceSize, { width: string; icon: React.ReactNode }> = {
  mobile: { width: "375px", icon: <Smartphone className="h-4 w-4" /> },
  tablet: { width: "768px", icon: <Tablet className="h-4 w-4" /> },
  desktop: { width: "100%", icon: <Monitor className="h-4 w-4" /> },
};

export function PreviewPanel({ files, isGenerating }: PreviewPanelProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("preview");
  const [deviceSize, setDeviceSize] = useState<DeviceSize>("desktop");
  const [selectedFile, setSelectedFile] = useState<GeneratedFile | null>(null);
  const [previewKey, setPreviewKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Select first file when files change
  useEffect(() => {
    if (files.length > 0 && !selectedFile) {
      setSelectedFile(files[0]);
    }
  }, [files, selectedFile]);

  // Update preview when files change
  useEffect(() => {
    setPreviewKey((prev) => prev + 1);
  }, [files]);

  const refreshPreview = useCallback(() => {
    setPreviewKey((prev) => prev + 1);
  }, []);

  const downloadFiles = useCallback(() => {
    // Create a zip-like download of all files
    files.forEach((file) => {
      const blob = new Blob([file.content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.path.split("/").pop() || "file";
      a.click();
      URL.revokeObjectURL(url);
    });
  }, [files]);

  const openInNewTab = useCallback(() => {
    const previewHtml = generatePreviewHtml(files);
    const blob = new Blob([previewHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  }, [files]);

  return (
    <div className="flex h-full flex-col bg-background border-l border-border">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <div className="flex items-center gap-1">
          {(["preview", "code", "files"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                viewMode === mode
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              {mode === "preview" && <Eye className="h-3.5 w-3.5" />}
              {mode === "code" && <Code className="h-3.5 w-3.5" />}
              {mode === "files" && <FolderTree className="h-3.5 w-3.5" />}
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {viewMode === "preview" && (
            <>
              {/* Device size toggle */}
              <div className="flex items-center gap-1 rounded-md border border-border p-0.5">
                {(Object.keys(deviceSizes) as DeviceSize[]).map((size) => (
                  <button
                    key={size}
                    onClick={() => setDeviceSize(size)}
                    className={cn(
                      "rounded p-1.5 transition-colors",
                      deviceSize === size
                        ? "bg-secondary text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    title={size}
                  >
                    {deviceSizes[size].icon}
                  </button>
                ))}
              </div>

              <button
                onClick={refreshPreview}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                title="Refresh preview"
              >
                <RefreshCw className="h-4 w-4" />
              </button>

              <button
                onClick={openInNewTab}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                title="Open in new tab"
              >
                <ExternalLink className="h-4 w-4" />
              </button>
            </>
          )}

          {files.length > 0 && (
            <button
              onClick={downloadFiles}
              className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              title="Download files"
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {files.length === 0 ? (
          <EmptyState isGenerating={isGenerating} />
        ) : (
          <>
            {viewMode === "preview" && (
              <PreviewIframe
                key={previewKey}
                ref={iframeRef}
                files={files}
                deviceWidth={deviceSizes[deviceSize].width}
              />
            )}

            {viewMode === "code" && (
              <CodeEditor
                file={selectedFile || files[0]}
                files={files}
                onFileSelect={setSelectedFile}
              />
            )}

            {viewMode === "files" && (
              <FileTree
                files={files}
                selectedFile={selectedFile}
                onFileSelect={(file) => {
                  setSelectedFile(file);
                  setViewMode("code");
                }}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

interface PreviewIframeProps {
  files: GeneratedFile[];
  deviceWidth: string;
}

const PreviewIframe = ({
  files,
  deviceWidth,
  ref,
}: PreviewIframeProps & { ref?: React.Ref<HTMLIFrameElement> }) => {
  const [previewHtml, setPreviewHtml] = useState("");

  useEffect(() => {
    const html = generatePreviewHtml(files);
    setPreviewHtml(html);
  }, [files]);

  return (
    <div className="flex h-full items-start justify-center overflow-auto bg-card/50 p-4">
      <div
        className="h-full overflow-hidden rounded-lg border border-border bg-white shadow-lg transition-all duration-300"
        style={{ width: deviceWidth, maxWidth: "100%" }}
      >
        <iframe
          ref={ref}
          srcDoc={previewHtml}
          className="h-full w-full border-0"
          title="Preview"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </div>
  );
};

function EmptyState({ isGenerating }: { isGenerating?: boolean }) {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      {isGenerating ? (
        <>
          <div className="mb-4 h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <h3 className="mb-2 text-lg font-medium text-foreground">
            Generating code...
          </h3>
          <p className="text-sm text-muted-foreground">
            Your preview will appear here shortly
          </p>
        </>
      ) : (
        <>
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-card border border-border">
            <Eye className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mb-2 text-lg font-medium text-foreground">
            No preview yet
          </h3>
          <p className="max-w-sm text-sm text-muted-foreground">
            Start a conversation to generate code and see a live preview here
          </p>
        </>
      )}
    </div>
  );
}

// Generate preview HTML from files
function generatePreviewHtml(files: GeneratedFile[]): string {
  // Find the main component file
  const mainFile = files.find(
    (f) =>
      f.path.includes("page.tsx") ||
      f.path.includes("page.jsx") ||
      f.path.includes("App.tsx") ||
      f.path.includes("index.tsx")
  );

  if (!mainFile) {
    // If no main file, just show the first file
    if (files.length > 0) {
      return createBasicHtml(files[0].content);
    }
    return createBasicHtml("<p>No preview available</p>");
  }

  // Extract the component code and create a standalone preview
  const componentCode = mainFile.content;
  
  // Check if it's HTML
  if (componentCode.trim().startsWith("<!DOCTYPE") || componentCode.trim().startsWith("<html")) {
    return componentCode;
  }

  // For React components, create a preview wrapper
  return createReactPreviewHtml(componentCode, files);
}

function createBasicHtml(content: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; }
  </style>
</head>
<body class="bg-gray-900 text-white min-h-screen">
  ${content}
</body>
</html>`;
}

function createReactPreviewHtml(componentCode: string, files: GeneratedFile[]): string {
  // Collect all component code
  const allCode = files.map((f) => f.content).join("\n\n");
  
  // Create a simplified version for preview
  // This extracts JSX from the component
  const jsxMatch = componentCode.match(/return\s*\(\s*([\s\S]*?)\s*\);?\s*\}?\s*$/);
  const jsx = jsxMatch ? jsxMatch[1] : componentCode;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            background: 'hsl(0 0% 4%)',
            foreground: 'hsl(0 0% 98%)',
            card: 'hsl(0 0% 7%)',
            primary: 'hsl(24 95% 53%)',
            secondary: 'hsl(0 0% 12%)',
            muted: 'hsl(0 0% 12%)',
            border: 'hsl(0 0% 15%)',
          }
        }
      }
    }
  </script>
  <style>
    body { 
      font-family: system-ui, -apple-system, sans-serif;
      background: hsl(0 0% 4%);
      color: hsl(0 0% 98%);
      min-height: 100vh;
    }
  </style>
</head>
<body class="dark">
  <div id="root">
    <!-- Static preview of the component -->
    <div class="min-h-screen">
      ${extractStaticHtml(jsx)}
    </div>
  </div>
</body>
</html>`;
}

// Extract static HTML from JSX for preview
function extractStaticHtml(jsx: string): string {
  return jsx
    // Remove className conversion
    .replace(/className=/g, "class=")
    // Remove JSX expressions that are just variables
    .replace(/\{[a-zA-Z_][a-zA-Z0-9_]*\}/g, "...")
    // Simplify complex expressions
    .replace(/\{[^}]+\}/g, "")
    // Clean up empty attributes
    .replace(/class=""/g, "")
    // Remove onClick and other handlers
    .replace(/on[A-Z][a-zA-Z]*=\{[^}]*\}/g, "");
}
