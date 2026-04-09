import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React Compiler for optimal performance
  reactCompiler: true,

  // Turbopack is stable in Next.js 16
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },

  // Allow images from any domain for uploaded content
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
