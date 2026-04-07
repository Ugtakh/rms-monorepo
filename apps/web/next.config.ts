import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: ["@rms/types", "@rms/constants"]
};

export default nextConfig;
