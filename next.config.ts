import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Build sırasında TypeScript hataları yüzünden durmasını engeller
    ignoreBuildErrors: true,
  },
  eslint: {
    // Build sırasında ESLint uyarıları yüzünden durmasını engeller
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;