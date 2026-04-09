# OpenClaude Web - Quick Start Guide

## 🚀 One-Minute Setup

### 1. Install Dependencies
```bash
bun install
```

### 2. Set Environment Variables
Create `.env.local`:
```env
LONGCAT_API_KEY=your_key_here
```

### 3. Run Development Server
```bash
bun run dev
```

Visit `http://localhost:3000` - your AI coding assistant is ready!

## 🎯 What You Can Do

- **Chat with AI**: Ask for code, explanations, debugging help
- **Get Live Preview**: See generated React apps run instantly
- **Upload Context**: Add images or documents to inform the AI
- **Edit Files**: View and edit generated code with syntax highlighting
- **Mobile Ready**: Works perfectly on phones and tablets

## 📁 Project Organization

The app combines two systems:
- **OpenClaude Backend** (`src/`) - CLI brain & tool orchestration (existing)
- **Web Frontend** (`app/`, `components/`, `lib/`) - Next.js web interface (new)

Both work together seamlessly - the web frontend calls the API which can use OpenClaude's tools.

## 🔧 Key Files

- `app/page.tsx` - Main interface with split panes
- `lib/longcat.ts` - AI client and system prompt
- `app/api/chat/route.ts` - Streaming chat endpoint
- `components/chat/` - Chat UI components
- `components/preview/` - Code preview panel
- `components/upload/` - File upload handling

## 🌍 Environment Variables

Required:
- `LONGCAT_API_KEY` - Your Longcat API key

Optional:
- `LONGCAT_API_URL` - API endpoint (defaults to https://api.longcat.ai/v1)
- `LONGCAT_MODEL` - Model name (defaults to longcat-v1)

## 📱 Mobile Experience

- Chat tab shows the conversation
- Preview tab displays generated code
- Upload button lets you add context
- Bottom navigation for easy switching

## 🎨 Customization

All styling uses Tailwind CSS v4 with CSS variables. Edit `tailwind.config.ts` for colors and `globals.css` for theme variables.

## 🐛 Debugging

Enable debug logs by checking browser console - all v0-specific logs use `[v0]` prefix for easy filtering.

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org)
- [Tailwind CSS](https://tailwindcss.com)
- [Longcat AI](https://longcat.ai)
- [OpenClaude Source](./src)

---

**Built with ❤️ for developers who want to build fast**
