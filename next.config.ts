import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'export',  // ← この行を追加！
  images: {
    unoptimized: true
  },
  trailingSlash: true
};

export default nextConfig;