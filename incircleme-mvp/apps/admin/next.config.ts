import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@incircleme/types', '@incircleme/config'],
};

export default nextConfig;
