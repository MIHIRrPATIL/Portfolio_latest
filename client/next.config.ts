import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: [
      'lucide-react', 
      'react-icons', 
      'three', 
      '@splinetool/react-spline',
      'framer-motion'
    ],
  },
};

export default nextConfig;
