'use client'

import { useRef, useEffect } from 'react'
import { Terminal, Trash2 } from 'lucide-react'
import { useFileStore } from '../../lib/store/files'

export function TerminalPanel() {
  const { terminalOutput, clearTerminal } = useFileStore()
  const scrollRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [terminalOutput])
  
  return (
    <div className="h-full flex flex-col bg-background border-t border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Output</span>
        </div>
        <button
          onClick={clearTerminal}
          className="p-1 hover:bg-secondary rounded transition-colors"
          title="Clear terminal"
        >
          <Trash2 className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
      
      {/* Output */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-auto p-4 font-mono text-sm"
      >
        {terminalOutput.length === 0 ? (
          <div className="text-muted-foreground">
            <span className="text-accent">$</span> Ready for commands...
          </div>
        ) : (
          terminalOutput.map((line, index) => (
            <div 
              key={index}
              className={
                line.startsWith('>')
                  ? 'text-primary'
                  : line.startsWith('Error')
                  ? 'text-destructive'
                  : 'text-muted-foreground'
              }
            >
              {line}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
