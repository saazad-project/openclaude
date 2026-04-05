import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getLanguageFromPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() || "";
  const languageMap: Record<string, string> = {
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    json: "json",
    md: "markdown",
    css: "css",
    scss: "scss",
    html: "html",
    py: "python",
    rs: "rust",
    go: "go",
    java: "java",
    c: "c",
    cpp: "cpp",
    h: "c",
    hpp: "cpp",
    sql: "sql",
    yaml: "yaml",
    yml: "yaml",
    xml: "xml",
    sh: "shell",
    bash: "shell",
    txt: "plaintext",
  };
  return languageMap[ext] || "plaintext";
}

export function getFileIcon(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() || "";
  const iconMap: Record<string, string> = {
    ts: "typescript",
    tsx: "react",
    js: "javascript",
    jsx: "react",
    json: "json",
    md: "markdown",
    css: "css",
    html: "html",
    py: "python",
    rs: "rust",
    go: "go",
  };
  return iconMap[ext] || "file";
}
