import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // build mandiri untuk Docker (node .next/standalone/server.js)
  output: "standalone",
};

export default nextConfig;
