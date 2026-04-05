/**
 * Virtual Filesystem Store
 * Zustand-based in-memory file system for the Code Builder
 */

import { create } from "zustand";
import { minimatch } from "minimatch";
import { getLanguageFromPath } from "@/lib/utils";
import { nanoid } from "nanoid";

// ============================================================
// TYPES
// ============================================================

export interface VirtualFile {
  id: string;
  path: string;
  content: string;
  language: string;
  createdAt: number;
  updatedAt: number;
}

export interface GrepResult {
  file: string;
  line: number;
  content: string;
}

export interface FileStore {
  // State
  files: Map<string, VirtualFile>;
  openTabs: string[];
  activeFile: string | null;
  unsavedChanges: Set<string>;

  // File Operations
  createFile: (path: string, content: string) => void;
  readFile: (path: string) => string | null;
  writeFile: (path: string, content: string) => void;
  editFile: (
    path: string,
    oldString: string,
    newString: string
  ) => { success: boolean; error?: string };
  deleteFile: (path: string) => void;
  renameFile: (oldPath: string, newPath: string) => void;

  // Search Operations
  glob: (pattern: string) => string[];
  grep: (pattern: string, path?: string) => GrepResult[];

  // Tab Management
  openTab: (path: string) => void;
  closeTab: (path: string) => void;
  setActiveFile: (path: string | null) => void;

  // Batch Operations
  importFiles: (files: { path: string; content: string }[]) => void;
  exportFiles: () => { path: string; content: string }[];
  clearAll: () => void;

  // Helpers
  getFile: (path: string) => VirtualFile | undefined;
  getAllPaths: () => string[];
  getDirectoryTree: () => DirectoryNode;
  markUnsaved: (path: string) => void;
  markSaved: (path: string) => void;
}

export interface DirectoryNode {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: DirectoryNode[];
  language?: string;
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function normalizePath(path: string): string {
  // Ensure path starts with /
  if (!path.startsWith("/")) {
    path = "/" + path;
  }
  // Remove trailing slash
  if (path.length > 1 && path.endsWith("/")) {
    path = path.slice(0, -1);
  }
  // Normalize multiple slashes
  path = path.replace(/\/+/g, "/");
  return path;
}

function buildDirectoryTree(paths: string[]): DirectoryNode {
  const root: DirectoryNode = {
    name: "/",
    path: "/",
    type: "directory",
    children: [],
  };

  for (const filePath of paths) {
    const parts = filePath.split("/").filter(Boolean);
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      const currentPath = "/" + parts.slice(0, i + 1).join("/");

      let child = current.children?.find((c) => c.name === part);

      if (!child) {
        child = {
          name: part,
          path: currentPath,
          type: isLast ? "file" : "directory",
          children: isLast ? undefined : [],
          language: isLast ? getLanguageFromPath(currentPath) : undefined,
        };
        current.children?.push(child);
      }

      if (!isLast) {
        current = child;
      }
    }
  }

  // Sort children: directories first, then files, alphabetically
  const sortChildren = (node: DirectoryNode) => {
    if (node.children) {
      node.children.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === "directory" ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
      node.children.forEach(sortChildren);
    }
  };

  sortChildren(root);
  return root;
}

// ============================================================
// STORE
// ============================================================

export const useFileStore = create<FileStore>((set, get) => ({
  // Initial state
  files: new Map(),
  openTabs: [],
  activeFile: null,
  unsavedChanges: new Set(),

  // File Operations
  createFile: (path, content) => {
    const normalizedPath = normalizePath(path);
    const file: VirtualFile = {
      id: nanoid(),
      path: normalizedPath,
      content,
      language: getLanguageFromPath(normalizedPath),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    set((state) => {
      const newFiles = new Map(state.files);
      newFiles.set(normalizedPath, file);
      return { files: newFiles };
    });

    // Auto-open the file
    get().openTab(normalizedPath);
  },

  readFile: (path) => {
    const normalizedPath = normalizePath(path);
    const file = get().files.get(normalizedPath);
    return file?.content ?? null;
  },

  writeFile: (path, content) => {
    const normalizedPath = normalizePath(path);
    const existing = get().files.get(normalizedPath);

    if (existing) {
      set((state) => {
        const newFiles = new Map(state.files);
        newFiles.set(normalizedPath, {
          ...existing,
          content,
          updatedAt: Date.now(),
        });
        return { files: newFiles };
      });
    } else {
      get().createFile(normalizedPath, content);
    }
  },

  editFile: (path, oldString, newString) => {
    const normalizedPath = normalizePath(path);
    const file = get().files.get(normalizedPath);

    if (!file) {
      return { success: false, error: `File not found: ${normalizedPath}` };
    }

    const occurrences = file.content.split(oldString).length - 1;

    if (occurrences === 0) {
      return {
        success: false,
        error: `String not found in file. The exact text to replace was not found.`,
      };
    }

    if (occurrences > 1) {
      return {
        success: false,
        error: `String is not unique. Found ${occurrences} occurrences. Please provide more context.`,
      };
    }

    const newContent = file.content.replace(oldString, newString);

    set((state) => {
      const newFiles = new Map(state.files);
      newFiles.set(normalizedPath, {
        ...file,
        content: newContent,
        updatedAt: Date.now(),
      });
      const newUnsaved = new Set(state.unsavedChanges);
      newUnsaved.add(normalizedPath);
      return { files: newFiles, unsavedChanges: newUnsaved };
    });

    return { success: true };
  },

  deleteFile: (path) => {
    const normalizedPath = normalizePath(path);

    set((state) => {
      const newFiles = new Map(state.files);
      newFiles.delete(normalizedPath);

      const newTabs = state.openTabs.filter((t) => t !== normalizedPath);
      const newActive =
        state.activeFile === normalizedPath
          ? newTabs[0] || null
          : state.activeFile;

      const newUnsaved = new Set(state.unsavedChanges);
      newUnsaved.delete(normalizedPath);

      return {
        files: newFiles,
        openTabs: newTabs,
        activeFile: newActive,
        unsavedChanges: newUnsaved,
      };
    });
  },

  renameFile: (oldPath, newPath) => {
    const normalizedOldPath = normalizePath(oldPath);
    const normalizedNewPath = normalizePath(newPath);
    const file = get().files.get(normalizedOldPath);

    if (!file) return;

    set((state) => {
      const newFiles = new Map(state.files);
      newFiles.delete(normalizedOldPath);
      newFiles.set(normalizedNewPath, {
        ...file,
        path: normalizedNewPath,
        language: getLanguageFromPath(normalizedNewPath),
        updatedAt: Date.now(),
      });

      const newTabs = state.openTabs.map((t) =>
        t === normalizedOldPath ? normalizedNewPath : t
      );
      const newActive =
        state.activeFile === normalizedOldPath
          ? normalizedNewPath
          : state.activeFile;

      return { files: newFiles, openTabs: newTabs, activeFile: newActive };
    });
  },

  // Search Operations
  glob: (pattern) => {
    const paths = get().getAllPaths();
    return paths.filter((path) => minimatch(path, pattern, { matchBase: true }));
  },

  grep: (pattern, searchPath) => {
    const results: GrepResult[] = [];
    const regex = new RegExp(pattern, "gi");

    const files = get().files;
    for (const [path, file] of files) {
      if (searchPath && !path.startsWith(normalizePath(searchPath))) {
        continue;
      }

      const lines = file.content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (regex.test(lines[i])) {
          results.push({
            file: path,
            line: i + 1,
            content: lines[i].trim(),
          });
        }
        regex.lastIndex = 0; // Reset regex state
      }
    }

    return results;
  },

  // Tab Management
  openTab: (path) => {
    const normalizedPath = normalizePath(path);

    set((state) => {
      if (state.openTabs.includes(normalizedPath)) {
        return { activeFile: normalizedPath };
      }
      return {
        openTabs: [...state.openTabs, normalizedPath],
        activeFile: normalizedPath,
      };
    });
  },

  closeTab: (path) => {
    const normalizedPath = normalizePath(path);

    set((state) => {
      const newTabs = state.openTabs.filter((t) => t !== normalizedPath);
      let newActive = state.activeFile;

      if (state.activeFile === normalizedPath) {
        const index = state.openTabs.indexOf(normalizedPath);
        newActive = newTabs[Math.max(0, index - 1)] || null;
      }

      return { openTabs: newTabs, activeFile: newActive };
    });
  },

  setActiveFile: (path) => {
    set({ activeFile: path ? normalizePath(path) : null });
  },

  // Batch Operations
  importFiles: (files) => {
    files.forEach(({ path, content }) => {
      get().createFile(path, content);
    });
  },

  exportFiles: () => {
    const files = get().files;
    return Array.from(files.values()).map((f) => ({
      path: f.path,
      content: f.content,
    }));
  },

  clearAll: () => {
    set({
      files: new Map(),
      openTabs: [],
      activeFile: null,
      unsavedChanges: new Set(),
    });
  },

  // Helpers
  getFile: (path) => {
    return get().files.get(normalizePath(path));
  },

  getAllPaths: () => {
    return Array.from(get().files.keys());
  },

  getDirectoryTree: () => {
    return buildDirectoryTree(get().getAllPaths());
  },

  markUnsaved: (path) => {
    set((state) => {
      const newUnsaved = new Set(state.unsavedChanges);
      newUnsaved.add(normalizePath(path));
      return { unsavedChanges: newUnsaved };
    });
  },

  markSaved: (path) => {
    set((state) => {
      const newUnsaved = new Set(state.unsavedChanges);
      newUnsaved.delete(normalizePath(path));
      return { unsavedChanges: newUnsaved };
    });
  },
}));

// ============================================================
// SAMPLE PROJECT
// ============================================================

export function createSampleProject() {
  const store = useFileStore.getState();

  store.createFile(
    "/package.json",
    JSON.stringify(
      {
        name: "my-app",
        version: "0.1.0",
        private: true,
        scripts: {
          dev: "next dev",
          build: "next build",
          start: "next start",
        },
        dependencies: {
          next: "^15.0.0",
          react: "^19.0.0",
          "react-dom": "^19.0.0",
        },
      },
      null,
      2
    )
  );

  store.createFile(
    "/src/app/page.tsx",
    `export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">Welcome to My App</h1>
      <p className="mt-4 text-lg text-gray-600">
        Start editing to see your changes.
      </p>
    </main>
  );
}
`
  );

  store.createFile(
    "/src/app/layout.tsx",
    `export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`
  );
}
