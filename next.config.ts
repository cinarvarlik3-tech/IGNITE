import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // The project root is mis-detected due to a parent package-lock.json;
    // this disables ESLint in the build step (lint can still be run separately).
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
