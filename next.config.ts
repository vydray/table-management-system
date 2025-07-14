import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // output: 'export', // ← この行をコメントアウトまたは削除
  images: {
    unoptimized: true
  },
  trailingSlash: true
};

export default nextConfig;