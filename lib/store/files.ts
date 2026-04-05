'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { minimatch } from 'minimatch'

export interface FileNode {
  name: string
  path: string
  type: 'file' | 'directory'
  content?: string
  children?: FileNode[]
  isOpen?: boolean
}

interface FileStore {
  files: Record<string, string>
  openFiles: string[]
  activeFile: string | null
  terminalOutput: string[]
  
  // File operations
  createFile: (path: string, content: string) => void
  updateFile: (path: string, content: string) => void
  deleteFile: (path: string) => void
  readFile: (path: string) => string | null
  fileExists: (path: string) => boolean
  
  // Editor state
  openFile: (path: string) => void
  closeFile: (path: string) => void
  setActiveFile: (path: string | null) => void
  
  // Terminal
  addTerminalOutput: (output: string) => void
  clearTerminal: () => void
  
  // Utilities
  glob: (pattern: string) => string[]
  grep: (pattern: string, path?: string) => Array<{ file: string; line: number; content: string }>
  getFileTree: () => FileNode[]
  
  // Bulk operations
  loadProject: (files: Record<string, string>) => void
  clearProject: () => void
}

function buildFileTree(files: Record<string, string>): FileNode[] {
  const root: FileNode[] = []
  
  const sortedPaths = Object.keys(files).sort()
  
  for (const filePath of sortedPaths) {
    const parts = filePath.split('/').filter(Boolean)
    let currentLevel = root
    let currentPath = ''
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      currentPath = currentPath ? `${currentPath}/${part}` : part
      const isFile = i === parts.length - 1
      
      let existing = currentLevel.find(n => n.name === part)
      
      if (!existing) {
        existing = {
          name: part,
          path: currentPath,
          type: isFile ? 'file' : 'directory',
          content: isFile ? files[filePath] : undefined,
          children: isFile ? undefined : [],
          isOpen: true,
        }
        currentLevel.push(existing)
      }
      
      if (!isFile && existing.children) {
        currentLevel = existing.children
      }
    }
  }
  
  return root
}

export const useFileStore = create<FileStore>()(
  persist(
    (set, get) => ({
      files: {},
      openFiles: [],
      activeFile: null,
      terminalOutput: [],
      
      createFile: (path, content) => {
        set(state => ({
          files: { ...state.files, [path]: content },
        }))
        get().openFile(path)
        get().addTerminalOutput(`Created: ${path}`)
      },
      
      updateFile: (path, content) => {
        set(state => ({
          files: { ...state.files, [path]: content },
        }))
      },
      
      deleteFile: (path) => {
        set(state => {
          const { [path]: _, ...rest } = state.files
          return {
            files: rest,
            openFiles: state.openFiles.filter(f => f !== path),
            activeFile: state.activeFile === path ? null : state.activeFile,
          }
        })
        get().addTerminalOutput(`Deleted: ${path}`)
      },
      
      readFile: (path) => {
        return get().files[path] ?? null
      },
      
      fileExists: (path) => {
        return path in get().files
      },
      
      openFile: (path) => {
        set(state => ({
          openFiles: state.openFiles.includes(path) 
            ? state.openFiles 
            : [...state.openFiles, path],
          activeFile: path,
        }))
      },
      
      closeFile: (path) => {
        set(state => {
          const newOpenFiles = state.openFiles.filter(f => f !== path)
          return {
            openFiles: newOpenFiles,
            activeFile: state.activeFile === path 
              ? newOpenFiles[newOpenFiles.length - 1] || null
              : state.activeFile,
          }
        })
      },
      
      setActiveFile: (path) => {
        set({ activeFile: path })
      },
      
      addTerminalOutput: (output) => {
        set(state => ({
          terminalOutput: [...state.terminalOutput.slice(-100), output],
        }))
      },
      
      clearTerminal: () => {
        set({ terminalOutput: [] })
      },
      
      glob: (pattern) => {
        const files = Object.keys(get().files)
        return files.filter(f => minimatch(f, pattern))
      },
      
      grep: (pattern, path) => {
        const results: Array<{ file: string; line: number; content: string }> = []
        const regex = new RegExp(pattern, 'gi')
        const files = get().files
        
        for (const [filePath, content] of Object.entries(files)) {
          if (path && !filePath.startsWith(path)) continue
          
          const lines = content.split('\n')
          lines.forEach((line, index) => {
            if (regex.test(line)) {
              results.push({
                file: filePath,
                line: index + 1,
                content: line.trim(),
              })
            }
            regex.lastIndex = 0 // Reset regex state
          })
        }
        
        return results
      },
      
      getFileTree: () => {
        return buildFileTree(get().files)
      },
      
      loadProject: (files) => {
        set({ files, openFiles: [], activeFile: null })
        get().addTerminalOutput(`Loaded project with ${Object.keys(files).length} files`)
      },
      
      clearProject: () => {
        set({ files: {}, openFiles: [], activeFile: null })
        get().addTerminalOutput('Project cleared')
      },
    }),
    {
      name: 'code-builder-files',
      partialize: (state) => ({ 
        files: state.files,
        openFiles: state.openFiles,
        activeFile: state.activeFile,
      }),
    }
  )
)
