# OpenClaude Web App - Quick Start

## What You Have

A production-ready AI coding assistant like v0.app/bolt.new running in your browser, powered by Longcat AI.

## Current Status

✅ All dependencies installed  
✅ Next.js 15 configured  
✅ Tailwind CSS with dark theme  
✅ Chat API with streaming  
✅ File upload support  
✅ Split-pane UI (chat + preview)  

## Start Using It

```bash
# Development server starts automatically
npm run dev

# Then open: http://localhost:3000
```

## How It Works

1. **Chat** - Type prompts like "Create a landing page with a hero section"
2. **Upload Files** - Click the Upload button to add images or docs as context
3. **View Code** - Generated code appears in the right panel
4. **Edit Code** - Use the code editor to modify files
5. **Live Preview** - See your code rendered in real-time

## Environment Variables

Your Vercel project already has:
- `LONGCAT_API_KEY` - Set up ✅
- `LONGCAT_API_URL` - Set up ✅
- `LONGCAT_MODEL` - Set up ✅

## Project Structure

```
/app
  /api/chat          - Streaming API endpoint
  /layout.tsx        - Root layout
  /page.tsx          - Main application
  /globals.css       - Design system

/components
  /chat              - Chat interface
  /preview           - Preview panel, code editor, file tree
  /upload            - File upload component
  /ui                - Base UI components

/lib
  /hooks/use-chat.ts - State management
  /longcat.ts        - AI client
  /utils.ts          - Helper functions
```

## Deployment

Push to Vercel:
```bash
git add .
git commit -m "Add OpenClaude web app"
git push origin main
```

Then go to your Vercel dashboard and deploy!

## Next Steps

1. Try generating code (e.g., "Create a todo app")
2. Upload images to use as UI inspiration
3. Edit generated code in the editor
4. Deploy to production on Vercel

## Troubleshooting

- **API errors**: Check that LONGCAT_API_KEY, LONGCAT_API_URL, and LONGCAT_MODEL are set in Vercel
- **Port issues**: If 3000 is taken, use `npm run dev -- -p 3001`
- **Build errors**: Clear `.next` folder and rebuild with `npm run build:next`
