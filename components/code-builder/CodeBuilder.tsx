'use client'

import { useState } from 'react'
import { 
  PanelLeftClose, 
  PanelLeftOpen, 
  PanelRightClose, 
  PanelRightOpen,
  Maximize2,
  Minimize2,
  Code2,
} from 'lucide-react'
import { FileExplorer } from './FileExplorer'
import { CodeEditor } from './CodeEditor'
import { ChatPanel } from './ChatPanel'
import { TerminalPanel } from './TerminalPanel'
import { cn } from '@/lib/utils'

export function CodeBuilder() {
  const [showExplorer, setShowExplorer] = useState(true)
  const [showChat, setShowChat] = useState(true)
  const [showTerminal, setShowTerminal] = useState(true)
  const [terminalHeight, setTerminalHeight] = useState(200)
  
  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <Code2 className="w-6 h-6 text-primary" />
          <h1 className="font-semibold">AI Code Builder</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowExplorer(!showExplorer)}
            className={cn(
              'p-2 rounded transition-colors',
              showExplorer ? 'bg-secondary' : 'hover:bg-secondary/50'
            )}
            title={showExplorer ? 'Hide Explorer' : 'Show Explorer'}
          >
            {showExplorer ? (
              <PanelLeftClose className="w-4 h-4" />
            ) : (
              <PanelLeftOpen className="w-4 h-4" />
            )}
          </button>
          
          <button
            onClick={() => setShowTerminal(!showTerminal)}
            className={cn(
              'p-2 rounded transition-colors',
              showTerminal ? 'bg-secondary' : 'hover:bg-secondary/50'
            )}
            title={showTerminal ? 'Hide Terminal' : 'Show Terminal'}
          >
            {showTerminal ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
          
          <button
            onClick={() => setShowChat(!showChat)}
            className={cn(
              'p-2 rounded transition-colors',
              showChat ? 'bg-secondary' : 'hover:bg-secondary/50'
            )}
            title={showChat ? 'Hide Chat' : 'Show Chat'}
          >
            {showChat ? (
              <PanelRightClose className="w-4 h-4" />
            ) : (
              <PanelRightOpen className="w-4 h-4" />
            )}
          </button>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Explorer */}
        {showExplorer && (
          <div className="w-64 shrink-0">
            <FileExplorer />
          </div>
        )}
        
        {/* Editor Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Code Editor */}
          <div className="flex-1 min-h-0">
            <CodeEditor />
          </div>
          
          {/* Terminal */}
          {showTerminal && (
            <div style={{ height: terminalHeight }}>
              <TerminalPanel />
            </div>
          )}
        </div>
        
        {/* Chat Panel */}
        {showChat && (
          <div className="w-96 shrink-0">
            <ChatPanel />
          </div>
        )}
      </div>
    </div>
  )
}
