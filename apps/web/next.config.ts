import type { NextConfig } from "./webApp/node_modules/next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    authInterrupts: false,
  },
};

export default nextConfig;
