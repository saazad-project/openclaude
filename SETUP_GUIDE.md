# OpenClaude Web Setup Guide

## 🎉 What's Been Built

Your OpenClaude repository has been transformed into a **v0.app/bolt.new style AI coding assistant** with:

- ✅ **Next.js 15** web application with App Router
- ✅ **Longcat AI integration** with streaming chat API
- ✅ **Split-pane interface** (Chat + Live Preview)
- ✅ **File upload support** for images and documents
- ✅ **Live code preview** with iframe
- ✅ **File tree explorer** and code editor
- ✅ **Modern dark theme** with Tailwind CSS 4
- ✅ **Original CLI preserved** - all existing OpenClaude functionality intact

## 🚀 Quick Start

### Step 1: Set Up Environment Variables

You've already added these in Vercel, but create a local `.env` file:

```bash
LONGCAT_API_KEY=your_actual_api_key
LONGCAT_API_URL=https://api.longcat.ai/v1
LONGCAT_MODEL=gpt-4o
```

### Step 2: Install Dependencies

```bash
npm install
```

Dependencies will auto-install based on your imports. The key additions:
- `next` (16.2.3) - Framework
- `react` & `react-dom` (19.2.4) - UI library
- `tailwindcss` (4.2.2) - Styling
- `react-markdown` - Markdown rendering
- `react-resizable-panels` - Split-pane layout
- `lucide-react` - Icons

### Step 3: Run the Development Server

```bash
npm run dev
```

This will start Next.js on **http://localhost:3000**

### Step 4: Test It Out

1. Open http://localhost:3000 in your browser
2. You'll see the split-pane interface with:
   - **Left side**: Chat interface
   - **Right side**: Preview panel with tabs (Preview, Code, Files)
3. Type a prompt like: "Create a landing page for a SaaS product"
4. Watch the AI stream responses and generate code
5. See the live preview update in real-time

## 📁 Project Structure

```
openclaude/
├── app/                          # Next.js App Router
│   ├── api/chat/route.ts        # Streaming chat API (SSE)
│   ├── globals.css              # Tailwind + Design tokens
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Main app page
│
├── components/
│   ├── chat/
│   │   ├── chat-interface.tsx   # Chat UI with message history
│   │   └── message-bubble.tsx   # Message rendering with markdown
│   ├── preview/
│   │   ├── preview-panel.tsx    # Split-pane container
│   │   ├── file-tree.tsx        # File explorer
│   │   └── code-editor.tsx      # Code viewer with syntax highlighting
│   ├── upload/
│   │   └── file-upload.tsx      # Drag & drop file upload
│   └── ui/                      # shadcn/ui components
│       ├── button.tsx
│       ├── input.tsx
│       ├── textarea.tsx
│       ├── scroll-area.tsx
│       └── tabs.tsx
│
├── lib/
│   ├── longcat.ts               # Longcat AI client (OpenAI-compatible)
│   ├── hooks/
│   │   └── use-chat.ts          # Chat state management
│   └── utils.ts                 # Utility functions
│
└── src/                         # Original OpenClaude CLI (UNCHANGED)
    └── ...                      # All existing functionality preserved
```

## 🔧 Configuration Files

| File | Purpose |
|------|---------|
| `next.config.ts` | Next.js configuration with React Compiler |
| `tailwind.config.ts` | Tailwind CSS 4 with dark theme tokens |
| `postcss.config.mjs` | PostCSS with Tailwind & Autoprefixer |
| `tsconfig.json` | TypeScript config for Next.js |
| `components.json` | shadcn/ui configuration |

## 🎨 Design System

The app uses a custom dark theme with design tokens:

```css
/* Dark mode colors */
--background: 222.2 84% 4.9%      /* #0a0a0f */
--foreground: 210 40% 98%          /* #f8f9fa */
--primary: 210 90% 60%             /* Blue accent */
--secondary: 217.2 32.6% 17.5%    /* Dark gray */
--accent: 217.2 32.6% 17.5%       /* Accent background */
--muted: 217.2 32.6% 17.5%        /* Muted elements */
```

## 🔌 API Routes

### `POST /api/chat`

Streaming chat endpoint using Server-Sent Events (SSE).

**Request:**
```json
{
  "messages": [
    { "role": "user", "content": "Build a todo app" }
  ],
  "files": [
    {
      "name": "screenshot.png",
      "type": "image/png",
      "content": "base64_encoded_data"
    }
  ]
}
```

**Response (SSE Stream):**
```
data: {"type":"content","content":"I'll"}
data: {"type":"content","content":" create"}
data: {"type":"content","content":" a todo"}
data: {"type":"done"}
```

**Error Response:**
```
data: {"type":"error","error":"API key not configured"}
```

## 📝 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js development server |
| `npm run build:next` | Build Next.js for production |
| `npm run start` | Start Next.js production server |
| `npm run dev:cli` | Run original OpenClaude CLI |
| `npm run typecheck` | Type check TypeScript |

## 🧩 Key Components

### Chat Interface
- **Location**: `components/chat/chat-interface.tsx`
- **Features**: Message history, input area, file attachments, streaming responses
- **State**: Uses `useChat` hook for message management

### Preview Panel
- **Location**: `components/preview/preview-panel.tsx`
- **Features**: 
  - Live iframe preview
  - Code editor with syntax highlighting
  - File tree explorer
  - Resizable panels

### File Upload
- **Location**: `components/upload/file-upload.tsx`
- **Features**: 
  - Drag & drop
  - Image and document support
  - Base64 encoding
  - File size limits (10MB default)

## 🔐 Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `LONGCAT_API_KEY` | ✅ | - | Your Longcat AI API key |
| `LONGCAT_API_URL` | ❌ | `https://api.longcat.ai/v1` | API base URL |
| `LONGCAT_MODEL` | ❌ | `gpt-4o` | Model identifier |
| `NEXT_PUBLIC_MAX_FILE_SIZE` | ❌ | `10485760` | Max upload size (bytes) |

## 🚢 Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Import repository in Vercel dashboard
3. Add environment variables:
   - `LONGCAT_API_KEY`
   - `LONGCAT_API_URL`
   - `LONGCAT_MODEL`
4. Deploy!

### Build Locally

```bash
npm run build:next
npm run start
```

## 🧪 Testing the Integration

1. **Test Chat API** (without UI):
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

2. **Test File Upload**:
   - Upload an image in the web UI
   - Check browser console for base64 encoding
   - Verify file appears in chat context

3. **Test Live Preview**:
   - Ask: "Create a simple counter with a button"
   - Check that code appears in Code tab
   - Verify preview renders in Preview tab

## 🐛 Troubleshooting

### "API key not configured" error
- Check `.env` file exists and has `LONGCAT_API_KEY`
- Restart dev server after adding `.env`
- Verify API key is valid

### Preview not loading
- Check browser console for errors
- Verify generated code is valid HTML/JS
- Try refreshing the preview iframe

### File upload failing
- Check file size < 10MB
- Verify file type is supported (images, .txt, .pdf, .md)
- Check browser console for errors

### Dependencies not installing
- Delete `node_modules` and reinstall
- Clear package manager cache
- Check for conflicting versions in `package.json`

## 🎯 Next Steps

1. **Customize the UI**: Edit `app/globals.css` to change colors/theme
2. **Add Features**: Extend the chat API with tool calling
3. **Improve Preview**: Add syntax highlighting, error boundaries
4. **Add Authentication**: Protect the app with NextAuth.js
5. **Add Database**: Store chat history with Supabase/Neon

## 📚 Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [React Resizable Panels](https://github.com/bvaughn/react-resizable-panels)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)

## 💡 Tips

- **Hot Reload**: Changes to components auto-refresh
- **Type Safety**: Use TypeScript for all new code
- **Code Splitting**: Next.js automatically splits your code
- **Server Components**: Use RSC for better performance
- **Client Components**: Add `'use client'` for interactivity

---

**Built with ❤️ using OpenClaude + Longcat AI**
