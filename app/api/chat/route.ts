import { createLongcatClient, CODE_SYSTEM_PROMPT, LONGCAT_MODEL } from "@/lib/longcat";

export const runtime = "edge";

export async function POST(request: Request) {
  try {
    const { messages, context } = await request.json();

    const client = createLongcatClient();

    // Build the messages array with system prompt
    const chatMessages = [
      { role: "system" as const, content: CODE_SYSTEM_PROMPT },
      ...messages.map((msg: { role: string; content: string }) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
    ];

    // Add context if provided (file uploads, etc.)
    if (context) {
      const contextMessage = {
        role: "user" as const,
        content: `Context:\n${context}\n\nPlease consider this context when responding.`,
      };
      chatMessages.splice(1, 0, contextMessage);
    }

    // Create streaming response
    const stream = await client.chat.completions.create({
      model: LONGCAT_MODEL,
      messages: chatMessages,
      stream: true,
      temperature: 0.7,
      max_tokens: 8192,
    });

    // Create a readable stream for the response
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
              );
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "An error occurred",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
