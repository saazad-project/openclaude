import { z } from 'zod'

export const maxDuration = 60

// Demo mode - simulates AI responses without requiring external API
// Replace with real API integration when you have the correct endpoint

const DEMO_RESPONSES: Record<string, string> = {
  default: `I'm your AI Software Engineer assistant! I can help you with:

- **Code Generation**: Create new files, components, and features
- **Code Editing**: Modify existing code with precision
- **Debugging**: Find and fix issues in your code
- **Architecture**: Design and scaffold projects

Try asking me to:
- "Create a React component for a login form"
- "Add a new API endpoint for user authentication"
- "Refactor this code to use TypeScript"

Note: This is demo mode. To enable full AI capabilities, configure your API endpoint.`,
  
  hello: `Hello! I'm ready to help you build amazing software. What would you like to create today?`,
  
  react: `Here's a React component example:

\`\`\`tsx
import { useState } from 'react'

export function Counter() {
  const [count, setCount] = useState(0)
  
  return (
    <div className="flex flex-col items-center gap-4 p-6">
      <h2 className="text-2xl font-bold">Count: {count}</h2>
      <div className="flex gap-2">
        <button 
          onClick={() => setCount(c => c - 1)}
          className="px-4 py-2 bg-red-500 text-white rounded"
        >
          -
        </button>
        <button 
          onClick={() => setCount(c => c + 1)}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          +
        </button>
      </div>
    </div>
  )
}
\`\`\`

Would you like me to save this to a file?`,

  login: `Here's a login form component:

\`\`\`tsx
'use client'
import { useState } from 'react'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // Add your authentication logic here
    console.log('Login:', { email, password })
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md">
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg"
          required
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  )
}
\`\`\`

I can save this to \`components/LoginForm.tsx\` if you'd like!`,
}

function getResponse(message: string): string {
  const lower = message.toLowerCase()
  
  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
    return DEMO_RESPONSES.hello
  }
  if (lower.includes('react') || lower.includes('component') || lower.includes('counter')) {
    return DEMO_RESPONSES.react
  }
  if (lower.includes('login') || lower.includes('auth') || lower.includes('form')) {
    return DEMO_RESPONSES.login
  }
  
  return DEMO_RESPONSES.default
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const messages = body.messages || []
    
    // Get the last user message
    const lastMessage = messages[messages.length - 1]
    const userMessage = lastMessage?.content || ''
    
    // Get demo response
    const response = getResponse(userMessage)
    
    // Simulate streaming by returning chunks
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        // Send the response in chunks to simulate streaming
        const words = response.split(' ')
        
        for (let i = 0; i < words.length; i++) {
          const chunk = (i === 0 ? '' : ' ') + words[i]
          const data = JSON.stringify({
            type: 'text-delta',
            delta: chunk,
          })
          controller.enqueue(encoder.encode(`data: ${data}\n\n`))
          
          // Small delay to simulate streaming
          await new Promise(resolve => setTimeout(resolve, 20))
        }
        
        // Send done signal
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      },
    })
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('[v0] API Error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
