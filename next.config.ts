import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/mcp": ["./dist/widget/**/*"],
  },
};

export default nextConfig;
