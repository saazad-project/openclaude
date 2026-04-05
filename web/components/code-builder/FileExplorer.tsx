"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useFileStore, type DirectoryNode } from "@/lib/store/files";
import {
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  FolderOpen,
  FileCode,
  FileJson,
  FileText,
  Plus,
  Trash2,
} from "lucide-react";

// ============================================================
// FILE ICON COMPONENT
// ============================================================

function FileIcon({ name, className }: { name: string; className?: string }) {
  const ext = name.split(".").pop()?.toLowerCase() || "";

  switch (ext) {
    case "tsx":
    case "jsx":
    case "ts":
    case "js":
      return <FileCode className={cn("text-[#519aba]", className)} />;
    case "json":
      return <FileJson className={cn("text-[#cbcb41]", className)} />;
    case "md":
      return <FileText className={cn("text-[#519aba]", className)} />;
    case "css":
    case "scss":
      return <FileCode className={cn("text-[#563d7c]", className)} />;
    default:
      return <File className={cn("text-[var(--muted-foreground)]", className)} />;
  }
}

// ============================================================
// TREE NODE COMPONENT
// ============================================================

interface TreeNodeProps {
  node: DirectoryNode;
  depth: number;
}

function TreeNode({ node, depth }: TreeNodeProps) {
  const [isOpen, setIsOpen] = useState(depth < 2);
  const { activeFile, openTab, deleteFile, unsavedChanges } = useFileStore();

  const isActive = activeFile === node.path;
  const hasUnsavedChanges = unsavedChanges.has(node.path);

  const handleClick = () => {
    if (node.type === "directory") {
      setIsOpen(!isOpen);
    } else {
      openTab(node.path);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Delete ${node.name}?`)) {
      deleteFile(node.path);
    }
  };

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-1 px-2 py-1 cursor-pointer hover:bg-[var(--muted)] group",
          isActive && "bg-[var(--accent)] text-[var(--accent-foreground)]"
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={handleClick}
      >
        {node.type === "directory" ? (
          <>
            {isOpen ? (
              <ChevronDown className="h-4 w-4 shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0" />
            )}
            {isOpen ? (
              <FolderOpen className="h-4 w-4 shrink-0 text-[#dcb67a]" />
            ) : (
              <Folder className="h-4 w-4 shrink-0 text-[#dcb67a]" />
            )}
          </>
        ) : (
          <>
            <span className="w-4" />
            <FileIcon name={node.name} className="h-4 w-4 shrink-0" />
          </>
        )}
        <span className="truncate text-sm flex-1">
          {node.name}
          {hasUnsavedChanges && (
            <span className="text-[var(--warning)] ml-1">*</span>
          )}
        </span>
        {node.type === "file" && (
          <button
            onClick={handleDelete}
            className="opacity-0 group-hover:opacity-100 hover:text-[var(--error)] p-1"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>
      {node.type === "directory" && isOpen && node.children && (
        <div>
          {node.children.map((child) => (
            <TreeNode key={child.path} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// NEW FILE DIALOG
// ============================================================

function NewFileDialog({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (path: string) => void;
}) {
  const [path, setPath] = useState("/");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (path.trim()) {
      onCreate(path.trim());
      onClose();
    }
  };

  return (
    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-[var(--panel)] border border-[var(--border)] rounded-lg p-4 w-80"
      >
        <h3 className="text-sm font-medium mb-3">New File</h3>
        <input
          type="text"
          value={path}
          onChange={(e) => setPath(e.target.value)}
          placeholder="/src/components/MyComponent.tsx"
          className="w-full px-3 py-2 bg-[var(--input)] border border-[var(--border)] rounded text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          autoFocus
        />
        <div className="flex justify-end gap-2 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-sm rounded hover:bg-[var(--muted)]"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-3 py-1.5 text-sm bg-[var(--accent)] text-[var(--accent-foreground)] rounded hover:opacity-90"
          >
            Create
          </button>
        </div>
      </form>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export function FileExplorer() {
  const [showNewFile, setShowNewFile] = useState(false);
  const { getDirectoryTree, createFile, getAllPaths } = useFileStore();

  const tree = getDirectoryTree();
  const fileCount = getAllPaths().length;

  const handleCreateFile = (path: string) => {
    createFile(path, "// New file\n");
  };

  return (
    <div className="h-full flex flex-col bg-[var(--sidebar)] border-r border-[var(--border)]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)]">
        <span className="text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
          Explorer
        </span>
        <button
          onClick={() => setShowNewFile(true)}
          className="p-1 hover:bg-[var(--muted)] rounded"
          title="New File"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-auto py-1">
        {fileCount === 0 ? (
          <div className="px-3 py-4 text-sm text-[var(--muted-foreground)] text-center">
            No files yet.
            <br />
            <button
              onClick={() => setShowNewFile(true)}
              className="text-[var(--accent)] hover:underline mt-2"
            >
              Create a file
            </button>
          </div>
        ) : (
          tree.children?.map((child) => (
            <TreeNode key={child.path} node={child} depth={0} />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-[var(--border)] text-xs text-[var(--muted-foreground)]">
        {fileCount} file{fileCount !== 1 ? "s" : ""}
      </div>

      {/* New File Dialog */}
      {showNewFile && (
        <NewFileDialog
          onClose={() => setShowNewFile(false)}
          onCreate={handleCreateFile}
        />
      )}
    </div>
  );
}
