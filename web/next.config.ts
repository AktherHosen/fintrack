import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@fintrack/shared"],
  output: "standalone",
};

export default nextConfig;
