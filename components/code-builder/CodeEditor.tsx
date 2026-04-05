'use client'

import { useCallback } from 'react'
import Editor from '@monaco-editor/react'
import { X, FileCode } from 'lucide-react'
import { useFileStore } from '../../lib/store/files'
import { getLanguageFromPath, cn } from '../../lib/utils'

export function CodeEditor() {
  const { 
    files, 
    openFiles, 
    activeFile, 
    updateFile, 
    closeFile, 
    setActiveFile 
  } = useFileStore()
  
  const activeContent = activeFile ? files[activeFile] || '' : ''
  const language = activeFile ? getLanguageFromPath(activeFile) : 'plaintext'
  
  const handleEditorChange = useCallback((value: string | undefined) => {
    if (activeFile && value !== undefined) {
      updateFile(activeFile, value)
    }
  }, [activeFile, updateFile])
  
  if (openFiles.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-card text-muted-foreground">
        <FileCode className="w-16 h-16 mb-4 opacity-30" />
        <h3 className="text-lg font-medium mb-2">No file open</h3>
        <p className="text-sm text-center max-w-xs">
          Select a file from the explorer or ask the AI to create one
        </p>
      </div>
    )
  }
  
  return (
    <div className="h-full flex flex-col bg-card">
      {/* Tab bar */}
      <div className="flex items-center border-b border-border bg-background/50 overflow-x-auto">
        {openFiles.map(filePath => {
          const fileName = filePath.split('/').pop() || filePath
          const isActive = filePath === activeFile
          
          return (
            <div
              key={filePath}
              className={cn(
                'flex items-center gap-2 px-3 py-2 border-r border-border cursor-pointer group transition-colors min-w-0',
                isActive 
                  ? 'bg-card text-foreground' 
                  : 'bg-background/30 text-muted-foreground hover:bg-background/50'
              )}
              onClick={() => setActiveFile(filePath)}
            >
              <span className="text-sm truncate max-w-[150px]">{fileName}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  closeFile(filePath)
                }}
                className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-secondary rounded transition-all shrink-0"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )
        })}
      </div>
      
      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          language={language}
          value={activeContent}
          onChange={handleEditorChange}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: 'var(--font-mono)',
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            padding: { top: 16 },
            renderWhitespace: 'selection',
            bracketPairColorization: { enabled: true },
            guides: {
              bracketPairs: true,
              indentation: true,
            },
          }}
        />
      </div>
    </div>
  )
}
