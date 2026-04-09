"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, X, Image as ImageIcon, FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  content?: string;
  preview?: string;
}

interface FileUploadProps {
  onFilesChange: (files: UploadedFile[]) => void;
  files: UploadedFile[];
  className?: string;
}

export function FileUpload({ onFilesChange, files, className }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File): Promise<UploadedFile> => {
    const id = Math.random().toString(36).substring(7);
    const uploadedFile: UploadedFile = {
      id,
      name: file.name,
      type: file.type,
      size: file.size,
    };

    // Handle images
    if (file.type.startsWith("image/")) {
      uploadedFile.preview = URL.createObjectURL(file);
      // Convert to base64 for AI context
      const base64 = await fileToBase64(file);
      uploadedFile.content = `[Image: ${file.name}]\nBase64: ${base64}`;
    }
    // Handle text files
    else if (
      file.type.startsWith("text/") ||
      file.name.endsWith(".md") ||
      file.name.endsWith(".json") ||
      file.name.endsWith(".tsx") ||
      file.name.endsWith(".ts") ||
      file.name.endsWith(".jsx") ||
      file.name.endsWith(".js") ||
      file.name.endsWith(".css")
    ) {
      uploadedFile.content = await file.text();
    }
    // Handle other documents
    else {
      uploadedFile.content = `[File: ${file.name}] (${formatFileSize(file.size)})`;
    }

    return uploadedFile;
  }, []);

  const handleFiles = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;

      setIsProcessing(true);
      try {
        const newFiles = await Promise.all(
          Array.from(fileList).map(processFile)
        );
        onFilesChange([...files, ...newFiles]);
      } finally {
        setIsProcessing(false);
      }
    },
    [files, onFilesChange, processFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removeFile = useCallback(
    (id: string) => {
      const file = files.find((f) => f.id === id);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      onFilesChange(files.filter((f) => f.id !== id));
    },
    [files, onFilesChange]
  );

  return (
    <div className={cn("space-y-3", className)}>
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-card/50"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
          accept="image/*,.txt,.md,.json,.tsx,.ts,.jsx,.js,.css,.html"
        />

        {isProcessing ? (
          <>
            <Loader2 className="mb-2 h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Processing files...</p>
          </>
        ) : (
          <>
            <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">
              Drop files here or click to upload
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Images, code, text files
            </p>
          </>
        )}
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-2"
            >
              {/* Preview/Icon */}
              {file.preview ? (
                <img
                  src={file.preview}
                  alt={file.name}
                  className="h-10 w-10 rounded object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded bg-secondary">
                  {file.type.startsWith("image/") ? (
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(file.size)}
                </p>
              </div>

              {/* Remove */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(file.id);
                }}
                className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Hook for managing uploaded files
export function useFileUpload() {
  const [files, setFiles] = useState<UploadedFile[]>([]);

  const getContextFromFiles = useCallback(() => {
    if (files.length === 0) return "";

    return files
      .map((file) => {
        if (file.content) {
          return `--- ${file.name} ---\n${file.content}\n`;
        }
        return `--- ${file.name} (${formatFileSize(file.size)}) ---\n`;
      })
      .join("\n");
  }, [files]);

  const clearFiles = useCallback(() => {
    files.forEach((file) => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    setFiles([]);
  }, [files]);

  return {
    files,
    setFiles,
    getContextFromFiles,
    clearFiles,
  };
}
