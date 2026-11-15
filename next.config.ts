import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Pin the trace root to this project so Next.js doesn't walk up to a parent lockfile
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
