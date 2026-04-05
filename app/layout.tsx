import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains' })

export const metadata: Metadata = {
  title: 'AI Code Builder | Software Engineer Agent',
  description: 'Build full-stack applications with an AI software engineer agent powered by LongCat and Gemini',
  keywords: ['AI', 'code builder', 'software engineer', 'agent', 'LLM', 'coding assistant'],
}

export const viewport: Viewport = {
  themeColor: '#0d1117',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrains.variable} antialiased min-h-screen bg-background text-foreground`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
