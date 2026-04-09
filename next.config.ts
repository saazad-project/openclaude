import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
