import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone', // ← CRÍTICO para Docker
  /* config options here */
};

export default nextConfig;
