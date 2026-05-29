import type { NextConfig } from 'next';

const apiProxyUrl =
  process.env.API_PROXY_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const nextConfig: NextConfig = {
  transpilePackages: ['@minagishl/react-piano-roll', '@magenta/music'],
  webpack(config) {
    config.module.rules.push({
      resourceQuery: /raw/,
      type: 'asset/source',
    });

    return config;
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiProxyUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
