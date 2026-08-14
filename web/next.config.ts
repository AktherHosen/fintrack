import type { NextConfig } from "next";

const apiOrigin = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1").replace(
  /\/api\/v1\/?$/,
  "",
);

const nextConfig: NextConfig = {
  transpilePackages: ["@fintrack/shared"],
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/assets/:path*",
        destination: `${apiOrigin}/assets/:path*`,
      },
    ];
  },
};

export default nextConfig;
