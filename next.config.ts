import type { NextConfig } from "next";

// APKビルド時は環境変数 CAPACITOR_BUILD=true を設定してください
const isCapacitorBuild = process.env.CAPACITOR_BUILD === 'true';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // APKビルド時のみ静的エクスポート
  ...(isCapacitorBuild && { output: 'export' }),
  images: {
    unoptimized: true
  },
  trailingSlash: true,
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  }
};

export default nextConfig;