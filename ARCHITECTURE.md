# OpenClaude Web - Architecture & Data Flow

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         BROWSER / CLIENT                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Next.js 16 Web Application                 │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │                                                           │   │
│  │  ┌──────────────────┐  ┌──────────────────────────┐    │   │
│  │  │  Chat Interface  │  │   Preview Panel          │    │   │
│  │  │                  │  │ ┌────────────────────┐   │    │   │
│  │  │ • Message list   │  │ │  File Tree         │   │    │   │
│  │  │ • Input textarea │  │ │  • app/page.tsx    │   │    │   │
│  │  │ • Send button    │  │ │  • lib/utils.ts    │   │    │   │
│  │  │ • Clear history  │  │ │  • styles.css      │   │    │   │
│  │  │                  │  │ └────────────────────┘   │    │   │
│  │  └──────────────────┘  │ ┌────────────────────┐   │    │   │
│  │         │              │ │ Code Editor        │   │    │   │
│  │         │              │ │ • Syntax highlighting   │    │   │
│  │         │              │ │ • Line numbers     │   │    │   │
│  │         │              │ └────────────────────┘   │    │   │
│  │         │              │ ┌────────────────────┐   │    │   │
│  │         │              │ │ Live Preview       │   │    │   │
│  │         │              │ │ • React iframe     │   │    │   │
│  │         │              │ │ • Device sizes     │   │    │   │
│  │         │              │ └────────────────────┘   │    │   │
│  │         │              └──────────────────────────┘    │   │
│  │         │                         ▲                     │   │
│  │    ┌────┘                         │                     │   │
│  │    ▼                              │                     │   │
│  │ ┌──────────────────────────────┐  │                     │   │
│  │ │  useChat Hook                │  │                     │   │
│  │ │ • Manages messages           │  │                     │   │
│  │ │ • Handles streaming          │  │                     │   │
│  │ │ • Parse code responses       │  │                     │   │
│  │ └──────────────────────────────┘  │                     │   │
│  │              │                      │                     │   │
│  └──────────────┼──────────────────────┼──────────────────────┘   │
│                 │ HTTP POST            │ SSE Events               │
└─────────────────┼──────────────────────┼─────────────────────────┘
                  │                      │
┌─────────────────┼──────────────────────┼─────────────────────────┐
│                 ▼                      ▼                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │          NEXT.JS SERVER (Node.js Runtime)               │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │                                                           │   │
│  │  ┌────────────────────────────────────────────────────┐ │   │
│  │  │  /api/chat Route                                   │ │   │
│  │  │ • Parse request body                              │ │   │
│  │  │ • Add system prompt                               │ │   │
│  │  │ • Add context if files uploaded                   │ │   │
│  │  │ • Create streaming response                       │ │   │
│  │  └────────────────────────────────────────────────────┘ │   │
│  │                      │                                   │   │
│  │                      ▼                                   │   │
│  │  ┌────────────────────────────────────────────────────┐ │   │
│  │  │  Longcat AI Client (lib/longcat.ts)               │ │   │
│  │  │ • Create OpenAI-compatible client                 │ │   │
│  │  │ • Read API key from environment                   │ │   │
│  │  │ • Set correct base URL                            │ │   │
│  │  └────────────────────────────────────────────────────┘ │   │
│  │                      │                                   │   │
│  │                      ▼                                   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                        │                                         │
└────────────────────────┼─────────────────────────────────────────┘
                         │ HTTPS POST
         ┌───────────────┴───────────────┐
         │                               │
         ▼                               ▼
    ┌─────────────┐            ┌──────────────────┐
    │   LONGCAT   │            │  Environment     │
    │   AI API    │            │  Variables       │
    │             │            │                  │
    │ • Chat      │            │ • API_KEY        │
    │   complete- │            │ • API_URL        │
    │   ions      │            │ • MODEL_NAME     │
    │ • Stream    │            │                  │
    │   response  │            └──────────────────┘
    │             │
    └─────────────┘


Response Flow:
┌────────────────────────────────────────────────────────────┐
│ 1. User types message and clicks Send                       │
├────────────────────────────────────────────────────────────┤
│ 2. useChat.sendMessage() called                             │
├────────────────────────────────────────────────────────────┤
│ 3. fetch() POST to /api/chat with messages + context        │
├────────────────────────────────────────────────────────────┤
│ 4. Server receives request                                  │
├────────────────────────────────────────────────────────────┤
│ 5. System prompt + user messages combined                   │
├────────────────────────────────────────────────────────────┤
│ 6. Call to Longcat AI API with stream: true                 │
├────────────────────────────────────────────────────────────┤
│ 7. Stream response back as Server-Sent Events               │
├────────────────────────────────────────────────────────────┤
│ 8. Client receives streaming chunks                         │
├────────────────────────────────────────────────────────────┤
│ 9. Parse each chunk and update state                        │
├────────────────────────────────────────────────────────────┤
│ 10. UI updates in real-time showing response                │
├────────────────────────────────────────────────────────────┤
│ 11. Parse JSON code if response contains files              │
├────────────────────────────────────────────────────────────┤
│ 12. Display generated code in preview panel                 │
└────────────────────────────────────────────────────────────┘
```

## 🔄 Component Interaction Diagram

```
app/page.tsx (Main Page)
│
├─→ [State] showMobileChat, showUploadPanel
│
├─→ useChat() hook
│   ├─→ [State] messages, isLoading, streamingContent
│   ├─→ [State] generatedFiles
│   └─→ sendMessage(message, context)
│
├─→ FileUpload component
│   ├─→ [State] files
│   └─→ getContextFromFiles()
│
├─→ ChatInterface component
│   ├─→ MessageBubble (for each message)
│   │   └─→ Render user/assistant messages
│   └─→ Input form
│
└─→ PreviewPanel component
    ├─→ FileTree component
    │   └─→ List files in tree structure
    ├─→ CodeEditor component
    │   └─→ Display selected file with syntax highlight
    └─→ Live Preview (iframe)
        └─→ Render React component from app/page.tsx file
```

## 📡 Data Structure Flows

### Chat Message Structure
```ts
interface ChatMessage {
  id: string;              // Unique identifier
  role: "user" | "assistant" | "system";
  content: string;         // Message text
  timestamp: Date;         // When sent
  files?: GeneratedFile[]; // Optional generated files
}
```

### Code Generation Response
```ts
interface CodeGenerationResponse {
  files: [
    {
      path: "app/page.tsx",
      content: "export default function..."
    }
  ];
  preview: {
    entryPoint: "app/page.tsx";
    type: "react";
  };
  explanation: "A button component...";
}
```

### File Upload Context
```ts
interface UploadedFile {
  name: string;
  type: string;        // MIME type
  size: number;        // Bytes
  data: string;        // Base64 encoded
  preview?: string;    // For images
}
```

## 🌐 API Contract

### Request Format
```json
POST /api/chat
{
  "messages": [
    {"role": "user", "content": "Build a button"},
    {"role": "assistant", "content": "Sure, here's..."}
  ],
  "context": "File context from uploads"
}
```

### Response Format (Server-Sent Events)
```
data: {"content":"Here"}
data: {"content":" is"}
data: {"content":" the"}
data: {"content":" code"}
data: [DONE]
```

## 🔐 Environment & Security Flow

```
.env.local (Local - Not committed)
├─ LONGCAT_API_KEY
├─ LONGCAT_API_URL
└─ LONGCAT_MODEL

        ↓ (At build/runtime)

process.env (Node.js server only)
├─ Never exposed to browser
├─ Only readable in /api routes
└─ Safe in lib/longcat.ts (server module)

        ↓ (API calls)

HTTPS encrypted → Longcat AI API
```

## 📱 Mobile vs Desktop Layout

### Desktop (lg breakpoint)
```
┌─────────────────────────────────────────┐
│          Main Content                    │
├─────────────┬───────┬───────────────────┤
│   Chat      │ Resize│  Preview Panel    │
│             │Handle │                   │
│             │       │                   │
└─────────────┴───────┴───────────────────┘
```

### Mobile
```
┌──────────────────────────┐
│      Header              │
├──────────────────────────┤
│                          │
│   Chat or Preview        │
│   (Tab selected)         │
│                          │
├──────────────────────────┤
│ [Chat] | [Preview]       │
│ Tab Navigation           │
└──────────────────────────┘
```

## 🎨 State Management Flow

```
Global State (Per component)
└─ HomePage (app/page.tsx)
   ├─ [showMobileChat] → ChatInterface/PreviewPanel visibility
   ├─ [showUploadPanel] → FileUpload visibility
   └─ useChat hook
      ├─ [messages] → Chat history
      ├─ [isLoading] → Loading indicator
      ├─ [streamingContent] → Real-time response
      └─ [generatedFiles] → Code to display

   └─ useFileUpload hook
      ├─ [files] → Uploaded files
      └─ [getContextFromFiles] → Formatted for AI
```

## ⚡ Performance Optimizations

```
Browser
├─ useCallback for stable function references
├─ useEffect dependencies properly managed
└─ Memoization of heavy components

Network
├─ SSE streaming (no long polling)
├─ Chunked response processing
└─ Early abort on user cancel

Server
├─ Edge runtime for fast responses
├─ Stream creation for memory efficiency
└─ Proper error handling

Build
├─ Next.js static optimization
├─ Code splitting per route
└─ Tree shaking of unused code
```

This architecture provides a scalable, maintainable, and performant foundation for an AI-powered coding assistant!
