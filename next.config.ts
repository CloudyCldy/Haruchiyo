import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/chatbot/:path*",
        destination: "/api/chatbot/:path*",
      },
    ];
  },
};

export default nextConfig;
