'use client'

import { useState } from 'react'
import { 
  ChevronRight, 
  ChevronDown, 
  File, 
  Folder, 
  FolderOpen,
  Plus,
  Trash2,
  FileCode,
  FileJson,
  FileText,
  Settings,
} from 'lucide-react'
import { useFileStore, type FileNode } from '../../lib/store/files'
import { cn } from '../../lib/utils'

const FILE_ICONS: Record<string, React.ReactNode> = {
  tsx: <FileCode className="w-4 h-4 text-blue-400" />,
  ts: <FileCode className="w-4 h-4 text-blue-400" />,
  jsx: <FileCode className="w-4 h-4 text-yellow-400" />,
  js: <FileCode className="w-4 h-4 text-yellow-400" />,
  json: <FileJson className="w-4 h-4 text-yellow-500" />,
  md: <FileText className="w-4 h-4 text-gray-400" />,
  css: <File className="w-4 h-4 text-purple-400" />,
  html: <File className="w-4 h-4 text-orange-400" />,
  py: <FileCode className="w-4 h-4 text-green-400" />,
  config: <Settings className="w-4 h-4 text-gray-400" />,
}

function getFileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() || ''
  if (name.includes('config')) return FILE_ICONS.config
  return FILE_ICONS[ext] || <File className="w-4 h-4 text-muted-foreground" />
}

interface FileTreeItemProps {
  node: FileNode
  depth: number
}

function FileTreeItem({ node, depth }: FileTreeItemProps) {
  const [isOpen, setIsOpen] = useState(node.isOpen ?? true)
  const { openFile, activeFile, deleteFile } = useFileStore()
  const isActive = activeFile === node.path
  
  if (node.type === 'directory') {
    return (
      <div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'w-full flex items-center gap-1.5 px-2 py-1 text-sm hover:bg-secondary/50 rounded transition-colors',
            'text-muted-foreground hover:text-foreground'
          )}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          {isOpen ? (
            <ChevronDown className="w-4 h-4 shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 shrink-0" />
          )}
          {isOpen ? (
            <FolderOpen className="w-4 h-4 text-blue-400 shrink-0" />
          ) : (
            <Folder className="w-4 h-4 text-blue-400 shrink-0" />
          )}
          <span className="truncate">{node.name}</span>
        </button>
        {isOpen && node.children?.map(child => (
          <FileTreeItem key={child.path} node={child} depth={depth + 1} />
        ))}
      </div>
    )
  }
  
  return (
    <div className="group relative">
      <button
        onClick={() => openFile(node.path)}
        className={cn(
          'w-full flex items-center gap-1.5 px-2 py-1 text-sm rounded transition-colors',
          isActive 
            ? 'bg-primary/20 text-primary' 
            : 'hover:bg-secondary/50 text-muted-foreground hover:text-foreground'
        )}
        style={{ paddingLeft: `${depth * 12 + 28}px` }}
      >
        {getFileIcon(node.name)}
        <span className="truncate">{node.name}</span>
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation()
          deleteFile(node.path)
        }}
        className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/20 rounded transition-all"
      >
        <Trash2 className="w-3 h-3 text-destructive" />
      </button>
    </div>
  )
}

export function FileExplorer() {
  const { getFileTree, createFile, files } = useFileStore()
  const [newFileName, setNewFileName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  
  const fileTree = getFileTree()
  const fileCount = Object.keys(files).length
  
  const handleCreateFile = () => {
    if (newFileName.trim()) {
      const path = newFileName.startsWith('/') ? newFileName.slice(1) : newFileName
      createFile(path, '')
      setNewFileName('')
      setIsCreating(false)
    }
  }
  
  return (
    <div className="h-full flex flex-col bg-sidebar border-r border-sidebar-border">
      <div className="flex items-center justify-between px-3 py-2 border-b border-sidebar-border">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Explorer
        </span>
        <button
          onClick={() => setIsCreating(true)}
          className="p-1 hover:bg-secondary rounded transition-colors"
          title="New File"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      
      {isCreating && (
        <div className="px-2 py-2 border-b border-sidebar-border">
          <input
            type="text"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateFile()
              if (e.key === 'Escape') setIsCreating(false)
            }}
            onBlur={() => !newFileName && setIsCreating(false)}
            placeholder="path/to/file.ts"
            className="w-full px-2 py-1 text-sm bg-input border border-border rounded focus:outline-none focus:ring-1 focus:ring-ring"
            autoFocus
          />
        </div>
      )}
      
      <div className="flex-1 overflow-auto py-1">
        {fileTree.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            <Folder className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No files yet</p>
            <p className="text-xs mt-1">Ask the AI to create files</p>
          </div>
        ) : (
          fileTree.map(node => (
            <FileTreeItem key={node.path} node={node} depth={0} />
          ))
        )}
      </div>
      
      <div className="px-3 py-2 border-t border-sidebar-border text-xs text-muted-foreground">
        {fileCount} file{fileCount !== 1 ? 's' : ''}
      </div>
    </div>
  )
}
