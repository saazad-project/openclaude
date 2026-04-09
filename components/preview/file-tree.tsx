"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, File, Folder } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GeneratedFile } from "@/lib/longcat";

interface FileTreeProps {
  files: GeneratedFile[];
  selectedFile: GeneratedFile | null;
  onFileSelect: (file: GeneratedFile) => void;
}

interface TreeNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children: TreeNode[];
  file?: GeneratedFile;
}

export function FileTree({ files, selectedFile, onFileSelect }: FileTreeProps) {
  const tree = buildTree(files);

  return (
    <div className="h-full overflow-auto p-4">
      <h3 className="mb-4 text-sm font-medium text-foreground">Generated Files</h3>
      <div className="space-y-1">
        {tree.map((node) => (
          <TreeNodeItem
            key={node.path}
            node={node}
            selectedFile={selectedFile}
            onFileSelect={onFileSelect}
            depth={0}
          />
        ))}
      </div>
    </div>
  );
}

interface TreeNodeItemProps {
  node: TreeNode;
  selectedFile: GeneratedFile | null;
  onFileSelect: (file: GeneratedFile) => void;
  depth: number;
}

function TreeNodeItem({
  node,
  selectedFile,
  onFileSelect,
  depth,
}: TreeNodeItemProps) {
  const [isOpen, setIsOpen] = useState(true);

  if (node.isDirectory) {
    return (
      <div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          {isOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          <Folder className="h-4 w-4 text-primary" />
          <span>{node.name}</span>
        </button>
        {isOpen && (
          <div>
            {node.children.map((child) => (
              <TreeNodeItem
                key={child.path}
                node={child}
                selectedFile={selectedFile}
                onFileSelect={onFileSelect}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  const isSelected = selectedFile?.path === node.file?.path;
  const fileExtension = node.name.split(".").pop() || "";
  const fileColor = getFileColor(fileExtension);

  return (
    <button
      onClick={() => node.file && onFileSelect(node.file)}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
        isSelected
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      )}
      style={{ paddingLeft: `${depth * 12 + 8}px` }}
    >
      <File className={cn("h-4 w-4", fileColor)} />
      <span className="truncate">{node.name}</span>
    </button>
  );
}

function buildTree(files: GeneratedFile[]): TreeNode[] {
  const root: TreeNode[] = [];

  files.forEach((file) => {
    const parts = file.path.split("/");
    let currentLevel = root;

    parts.forEach((part, index) => {
      const isLast = index === parts.length - 1;
      const existingNode = currentLevel.find((n) => n.name === part);

      if (existingNode) {
        if (!isLast) {
          currentLevel = existingNode.children;
        }
      } else {
        const newNode: TreeNode = {
          name: part,
          path: parts.slice(0, index + 1).join("/"),
          isDirectory: !isLast,
          children: [],
          file: isLast ? file : undefined,
        };
        currentLevel.push(newNode);
        if (!isLast) {
          currentLevel = newNode.children;
        }
      }
    });
  });

  // Sort directories first, then files
  const sortTree = (nodes: TreeNode[]): TreeNode[] => {
    return nodes
      .sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      })
      .map((node) => ({
        ...node,
        children: sortTree(node.children),
      }));
  };

  return sortTree(root);
}

function getFileColor(extension: string): string {
  const colors: Record<string, string> = {
    tsx: "text-blue-400",
    ts: "text-blue-400",
    jsx: "text-yellow-400",
    js: "text-yellow-400",
    css: "text-pink-400",
    html: "text-orange-400",
    json: "text-green-400",
    md: "text-gray-400",
  };
  return colors[extension] || "text-gray-400";
}
