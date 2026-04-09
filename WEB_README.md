# OpenClaude Web - AI Coding Assistant

A modern, v0.app/bolt.new style single-page AI coding assistant powered by OpenClaude and Longcat AI.

## Features

- 🎨 **Split-pane Interface** - Chat on the left, live preview on the right
- 🔥 **Live Preview** - Real-time iframe preview with hot reload
- 📁 **File Management** - Interactive file tree and code editor
- 📎 **File Upload** - Support for images and documents as AI context
- ⚡ **Streaming Responses** - Real-time AI responses with Server-Sent Events
- 🎯 **Longcat AI Integration** - OpenAI-compatible API with streaming support

## Quick Start

### 1. Environment Setup

Copy the example environment file and add your Longcat AI credentials:

```bash
cp .env.example .env
```

Edit `.env` and add your Longcat AI configuration:

```env
# Longcat AI Configuration
LONGCAT_API_KEY=your_longcat_api_key_here
LONGCAT_API_URL=https://api.longcat.ai/v1
LONGCAT_MODEL=gpt-4o
```

### 2. Install Dependencies

```bash
npm install
# or
bun install
```

### 3. Run Development Server

```bash
npm run dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
openclaude/
├── app/                        # Next.js 15 App Router
│   ├── api/
│   │   └── chat/
│   │       └── route.ts       # Streaming chat API with Longcat AI
│   ├── globals.css            # Tailwind CSS + Design tokens
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Main application page
├── components/
│   ├── chat/
│   │   ├── chat-interface.tsx # Chat UI component
│   │   └── message-bubble.tsx # Message rendering
│   ├── preview/
│   │   ├── preview-panel.tsx  # Split-pane preview container
│   │   ├── file-tree.tsx      # File explorer
│   │   └── code-editor.tsx    # Code viewer/editor
│   ├── upload/
│   │   └── file-upload.tsx    # File upload component
│   └── ui/                    # shadcn/ui components
├── lib/
│   ├── longcat.ts             # Longcat AI client
│   ├── hooks/
│   │   └── use-chat.ts        # Chat state management
│   └── utils.ts               # Utility functions
└── src/                       # Original OpenClaude CLI source

```

## Technology Stack

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **AI Provider**: Longcat AI (OpenAI-compatible)
- **Language**: TypeScript
- **Runtime**: Node.js 20+

## API Routes

### POST `/api/chat`

Streaming chat endpoint with Server-Sent Events (SSE).

**Request Body:**
```json
{
  "messages": [
    { "role": "user", "content": "Create a landing page" }
  ],
  "files": [
    { "name": "design.png", "type": "image/png", "content": "base64..." }
  ]
}
```

**Response:**
Server-Sent Events stream with JSON chunks:
```
data: {"type":"content","content":"Creating"}
data: {"type":"content","content":" a landing"}
data: {"type":"done"}
```

## Development

### Running the CLI (Original OpenClaude)

The original OpenClaude CLI is still available:

```bash
npm run dev:cli
# or
bun run dev:cli
```

### Building for Production

```bash
npm run build:next
npm run start
```

### Type Checking

```bash
npm run typecheck
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `LONGCAT_API_KEY` | Longcat AI API key | Required |
| `LONGCAT_API_URL` | Longcat AI base URL | `https://api.longcat.ai/v1` |
| `LONGCAT_MODEL` | Model to use | `gpt-4o` |
| `NEXT_PUBLIC_MAX_FILE_SIZE` | Max file upload size (bytes) | `10485760` (10MB) |

## License

See LICENSE file for details.
