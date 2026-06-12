import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@incircleme/types', '@incircleme/i18n'],
};

export default nextConfig;
