import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // Required for Docker: bundles only necessary files
};

export default nextConfig;
