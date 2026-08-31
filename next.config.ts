import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Pin the workspace root so the lockfile lookup stays inside this project.
  turbopack: { root: path.resolve(".") },
};

export default nextConfig;
