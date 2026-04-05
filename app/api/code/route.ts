export const maxDuration = 60

const LONGCAT_API_KEY = process.env.LONGCAT_API_KEY
const LONGCAT_API_URL = 'https://api.longcat.chat'

export async function POST(req: Request) {
  try {
    if (!LONGCAT_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'LONGCAT_API_KEY environment variable is not set' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const body = await req.json()
    const messages = body.messages || []

    // Format messages for LongCat API
    const formattedMessages = messages.map((msg: any) => ({
      role: msg.role || 'user',
      content: msg.content || '',
    }))

    // Call LongCat Chat API
    const response = await fetch(`${LONGCAT_API_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LONGCAT_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gemini-2.0-flash',
        messages: formattedMessages,
        stream: true,
        temperature: 0.7,
        max_tokens: 2048,
        system: `You are an AI Software Engineer assistant that helps users build, debug, and deploy code. 
You have access to file operations and can:
- Create and modify files
- Generate code from specifications
- Debug code and suggest fixes
- Explain programming concepts
- Help with architecture and design

Always provide clear, well-formatted code examples and explain your reasoning.`,
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('[v0] LongCat API Error:', response.status, errorData)
      return new Response(
        JSON.stringify({ 
          error: `LongCat API Error: ${response.status}`,
          details: errorData 
        }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Stream the response
    const reader = response.body?.getReader()
    if (!reader) {
      return new Response(
        JSON.stringify({ error: 'No response body from LongCat API' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const decoder = new TextDecoder()
          let buffer = ''

          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
              const trimmed = line.trim()
              if (!trimmed || trimmed === ':' || trimmed === '[DONE]') continue

              if (trimmed.startsWith('data:')) {
                const jsonStr = trimmed.slice(5).trim()
                if (jsonStr === '[DONE]') {
                  controller.enqueue(encoder.encode('data: [DONE]\n\n'))
                  continue
                }

                try {
                  const parsed = JSON.parse(jsonStr)
                  if (parsed.choices?.[0]?.delta?.content) {
                    const chunk = {
                      type: 'text-delta',
                      delta: parsed.choices[0].delta.content,
                    }
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`))
                  }
                } catch (e) {
                  // Skip invalid JSON lines
                }
              }
            }
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch (error) {
          console.error('[v0] Stream Error:', error)
          controller.error(error)
        }
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
