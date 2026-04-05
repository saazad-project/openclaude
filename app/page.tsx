'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface FileNode {
  name: string
  path: string
  type: 'file' | 'folder'
  content?: string
  children?: FileNode[]
}

export default function CodeBuilder() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [files, setFiles] = useState<FileNode[]>([
    {
      name: 'src',
      path: '/src',
      type: 'folder',
      children: [
        { name: 'index.ts', path: '/src/index.ts', type: 'file', content: '// Start coding here\nconsole.log("Hello World!")' },
      ]
    },
    { name: 'package.json', path: '/package.json', type: 'file', content: '{\n  "name": "my-project",\n  "version": "1.0.0"\n}' },
  ])
  const [activeFile, setActiveFile] = useState<string>('/src/index.ts')
  const [fileContent, setFileContent] = useState('// Start coding here\nconsole.log("Hello World!")')
  const [terminalOutput, setTerminalOutput] = useState<string[]>(['$ Ready to build...'])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const getFilesAsRecord = (): Record<string, string> => {
    const record: Record<string, string> = {}
    const traverse = (nodes: FileNode[]) => {
      for (const node of nodes) {
        if (node.type === 'file' && node.content) {
          record[node.path] = node.content
        }
        if (node.children) traverse(node.children)
      }
    }
    traverse(files)
    return record
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setTerminalOutput(prev => [...prev, `$ Processing: "${input.slice(0, 50)}..."`])

    try {
      const response = await fetch('/api/code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          files: getFilesAsRecord(),
        }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to get response')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let assistantContent = ''

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
      }
      setMessages(prev => [...prev, assistantMessage])

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('data:')) {
            const data = line.slice(5).trim()
            if (data === '[DONE]') continue
            try {
              const parsed = JSON.parse(data)
              if (parsed.type === 'text-delta' && parsed.delta) {
                assistantContent += parsed.delta
                setMessages(prev => 
                  prev.map(m => 
                    m.id === assistantMessage.id 
                      ? { ...m, content: assistantContent }
                      : m
                  )
                )
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }

      setTerminalOutput(prev => [...prev, '$ Done!'])
    } catch (error) {
      console.error('Error:', error)
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}. Please check API keys are configured.`,
      }])
      setTerminalOutput(prev => [...prev, '$ Error occurred'])
    } finally {
      setIsLoading(false)
    }
  }

  const findFileContent = (path: string, nodes: FileNode[]): string | undefined => {
    for (const node of nodes) {
      if (node.path === path) return node.content
      if (node.children) {
        const found = findFileContent(path, node.children)
        if (found) return found
      }
    }
    return undefined
  }

  const handleFileClick = (path: string) => {
    setActiveFile(path)
    const content = findFileContent(path, files)
    setFileContent(content || '')
  }

  const renderFileTree = (nodes: FileNode[], depth = 0) => {
    return nodes.map(node => (
      <div key={node.path}>
        <button
          onClick={() => node.type === 'file' && handleFileClick(node.path)}
          className={`w-full text-left px-2 py-1 hover:bg-white/5 flex items-center gap-2 transition-colors ${
            activeFile === node.path ? 'bg-white/10' : ''
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          <span className="opacity-60">
            {node.type === 'folder' ? '📁' : '📄'}
          </span>
          <span className="text-sm">{node.name}</span>
        </button>
        {node.type === 'folder' && node.children && renderFileTree(node.children, depth + 1)}
      </div>
    ))
  }

  return (
    <div className="h-screen flex flex-col" style={{ background: '#0d1117', color: '#c9d1d9' }}>
      {/* Header */}
      <header className="h-12 border-b border-white/10 flex items-center px-4" style={{ background: '#161b22' }}>
        <h1 className="font-semibold text-lg">AI Code Builder</h1>
        <span className="ml-2 text-xs opacity-50">Powered by LongCat AI</span>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Explorer */}
        <aside className="w-64 border-r border-white/10 overflow-y-auto" style={{ background: '#161b22' }}>
          <div className="p-2 text-xs font-semibold opacity-50 uppercase tracking-wider">
            Explorer
          </div>
          {renderFileTree(files)}
        </aside>

        {/* Editor */}
        <main className="flex-1 flex flex-col">
          {/* Tabs */}
          <div className="h-9 border-b border-white/10 flex items-center px-2" style={{ background: '#161b22' }}>
            <div className="px-3 py-1 text-sm border-t-2 border-t-blue-500" style={{ background: '#0d1117' }}>
              {activeFile.split('/').pop()}
            </div>
          </div>

          {/* Code Area */}
          <div className="flex-1 overflow-auto p-4" style={{ background: '#0d1117' }}>
            <pre className="font-mono text-sm whitespace-pre-wrap">
              <code>{fileContent}</code>
            </pre>
          </div>

          {/* Terminal */}
          <div className="h-32 border-t border-white/10 overflow-y-auto" style={{ background: '#161b22' }}>
            <div className="p-2 text-xs font-semibold opacity-50 uppercase tracking-wider border-b border-white/10">
              Terminal
            </div>
            <div className="p-2 font-mono text-xs">
              {terminalOutput.map((line, i) => (
                <div key={i} className="opacity-60">{line}</div>
              ))}
            </div>
          </div>
        </main>

        {/* Chat Panel */}
        <aside className="w-96 border-l border-white/10 flex flex-col" style={{ background: '#161b22' }}>
          <div className="p-2 text-xs font-semibold opacity-50 uppercase tracking-wider border-b border-white/10">
            AI Assistant
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center opacity-50 text-sm py-8">
                <p>Ask me to build something!</p>
                <p className="mt-2 text-xs">Try: &quot;Create a React counter component&quot;</p>
              </div>
            )}
            {messages.map(message => (
              <div
                key={message.id}
                className={`p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white ml-8'
                    : 'bg-white/10 mr-8'
                }`}
              >
                <div className="text-xs font-semibold mb-1 opacity-70">
                  {message.role === 'user' ? 'You' : 'AI'}
                </div>
                <div className="text-sm whitespace-pre-wrap">{message.content}</div>
              </div>
            ))}
            {isLoading && (
              <div className="bg-white/10 p-3 rounded-lg mr-8">
                <div className="text-xs font-semibold mb-1 opacity-70">AI</div>
                <div className="text-sm opacity-50">Thinking...</div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-white/10">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask AI to build something..."
                className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-500 disabled:opacity-50 transition-colors"
              >
                Send
              </button>
            </div>
          </form>
        </aside>
      </div>
    </div>
  )
}
