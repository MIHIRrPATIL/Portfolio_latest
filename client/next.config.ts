import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react', 'react-icons', 'three', '@splinetool/react-spline'],
  },
};

export default nextConfig;
