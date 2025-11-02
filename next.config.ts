import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // output: 'export' を削除してSSRモードに戻す
  images: {
    unoptimized: true
  }
};

export default nextConfig;