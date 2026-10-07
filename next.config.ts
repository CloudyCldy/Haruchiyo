import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // SB-01-ST012: API versionada. /api/v1/* es la ruta oficial; /api/* se mantiene
  // como alias legado para no romper clientes existentes (Haitani en producción).
  async rewrites() {
    return [{ source: "/api/v1/:path*", destination: "/api/:path*" }];
  },
};

export default nextConfig;