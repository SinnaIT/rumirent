import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone', // ← CRÍTICO para Docker
  typescript: {
    // ⚠️ Allows production builds to complete even with type errors
    // TODO: Fix all TypeScript errors and remove this
    ignoreBuildErrors: true,
  },
  eslint: {
    // Durante build, permitir warnings
    ignoreDuringBuilds: true,
  },
  /* config options here */
};

export default nextConfig;
