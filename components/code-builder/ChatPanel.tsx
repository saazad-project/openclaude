'use client'

import { useState, useRef, useEffect } from 'react'
import { useChat } from 'ai/react'
import { Send, Bot, User, Loader2, Wrench, CheckCircle, XCircle, Sparkles } from 'lucide-react'
import { useFileStore } from '@/lib/store/files'
import { cn } from '@/lib/utils'

export function ChatPanel() {
  const { files, createFile, updateFile, readFile, addTerminalOutput } = useFileStore()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [inputValue, setInputValue] = useState('')
  
  const { messages, isLoading, append } = useChat({
    api: '/api/code',
    body: { files },
    onToolCall: async ({ toolCall }) => {
      const { toolName, args } = toolCall
      
      addTerminalOutput(`> Tool: ${toolName}`)
      
      // Handle file operations on the client side
      if (toolName === 'file_write') {
        const { path, content } = args as { path: string; content: string }
        if (readFile(path) !== null) {
          updateFile(path, content)
        } else {
          createFile(path, content)
        }
        addTerminalOutput(`  Created/Updated: ${path}`)
      } else if (toolName === 'file_edit') {
        const { path, old_string, new_string } = args as { 
          path: string; old_string: string; new_string: string 
        }
        const currentContent = readFile(path)
        if (currentContent !== null) {
          const newContent = currentContent.replace(old_string, new_string)
          updateFile(path, newContent)
          addTerminalOutput(`  Edited: ${path}`)
        }
      }
    },
    onFinish: () => {
      addTerminalOutput('> Task completed')
    },
    onError: (error) => {
      addTerminalOutput(`> Error: ${error.message}`)
    },
  })
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || isLoading) return
    
    append({ role: 'user', content: inputValue })
    setInputValue('')
  }
  
  return (
    <div className="h-full flex flex-col bg-card border-l border-border">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-background/50">
        <Sparkles className="w-5 h-5 text-primary" />
        <span className="font-medium">AI Assistant</span>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <Bot className="w-12 h-12 mb-4 opacity-30" />
            <p className="text-sm text-center max-w-xs">
              Ask me to build, edit, or debug code. I can create entire projects from scratch.
            </p>
            <div className="mt-4 space-y-2 text-xs">
              <p className="text-center opacity-70">Try asking:</p>
              <div className="space-y-1">
                <button 
                  onClick={() => setInputValue('Create a React counter component')}
                  className="block w-full text-left px-3 py-1.5 rounded bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  &quot;Create a React counter component&quot;
                </button>
                <button 
                  onClick={() => setInputValue('Build a Next.js API route for user auth')}
                  className="block w-full text-left px-3 py-1.5 rounded bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  &quot;Build a Next.js API route for user auth&quot;
                </button>
                <button 
                  onClick={() => setInputValue('Create a todo app with TypeScript')}
                  className="block w-full text-left px-3 py-1.5 rounded bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  &quot;Create a todo app with TypeScript&quot;
                </button>
              </div>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="space-y-2">
              <div className={cn(
                'flex gap-3',
                message.role === 'user' ? 'flex-row-reverse' : ''
              )}>
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                  message.role === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-secondary text-secondary-foreground'
                )}>
                  {message.role === 'user' ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>
                <div className={cn(
                  'flex-1 px-4 py-3 rounded-lg text-sm',
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground ml-12'
                    : 'bg-secondary/50 mr-12'
                )}>
                  <div className="prose prose-sm prose-invert max-w-none">
                    {message.content}
                  </div>
                </div>
              </div>
              
              {/* Tool calls visualization */}
              {message.toolInvocations && message.toolInvocations.length > 0 && (
                <div className="ml-11 space-y-1">
                  {message.toolInvocations.map((tool, index) => (
                    <div 
                      key={index}
                      className="flex items-center gap-2 px-3 py-1.5 rounded bg-muted/50 text-xs"
                    >
                      <Wrench className="w-3 h-3 text-muted-foreground" />
                      <span className="font-mono text-muted-foreground">
                        {tool.toolName}
                      </span>
                      {tool.state === 'result' ? (
                        <CheckCircle className="w-3 h-3 text-accent ml-auto" />
                      ) : tool.state === 'call' ? (
                        <Loader2 className="w-3 h-3 animate-spin ml-auto" />
                      ) : (
                        <XCircle className="w-3 h-3 text-destructive ml-auto" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
            <div className="flex-1 px-4 py-3 rounded-lg bg-secondary/50 mr-12">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Thinking</span>
                <span className="animate-pulse">...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-border">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask me to build something..."
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
