import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "OpenClaude - AI Coding Assistant",
  description:
    "Build full-stack apps with AI. Generate, preview, and deploy code instantly.",
  keywords: [
    "AI",
    "coding",
    "assistant",
    "code generation",
    "react",
    "nextjs",
    "full-stack",
  ],
  authors: [{ name: "OpenClaude" }],
  openGraph: {
    title: "OpenClaude - AI Coding Assistant",
    description: "Build full-stack apps with AI",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
