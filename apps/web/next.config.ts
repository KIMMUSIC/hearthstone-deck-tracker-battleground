import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // output: 'standalone' — enabled for Docker builds, disabled for local dev (Windows symlink issues)
  ...(process.env.DOCKER_BUILD === '1' ? { output: 'standalone' as const } : {}),
  transpilePackages: ['@bg-tracker/shared-types', '@bg-tracker/shared-constants'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'art.hearthstonejson.com',
        pathname: '/v1/**',
      },
      {
        protocol: 'https',
        hostname: 'static.zerotoheroes.com',
        pathname: '/hearthstone/**',
      },
    ],
  },
};

export default nextConfig;
