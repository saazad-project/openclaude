import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Code Builder - Autonomous Software Engineer",
  description:
    "Build complete applications with AI. Powered by OpenClaude - the open-source Claude Code alternative.",
  keywords: [
    "AI",
    "code builder",
    "software engineer",
    "autonomous coding",
    "Claude Code",
    "OpenClaude",
  ],
};

export const viewport: Viewport = {
  themeColor: "#1e1e1e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
