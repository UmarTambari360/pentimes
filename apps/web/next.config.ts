import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Required for the production Dockerfile (copies only what's needed)
  output: 'standalone',

  // Transpile the shared workspace package
  transpilePackages: ['@pentimes/shared'],

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
    ],
  },

  reactStrictMode: true,

  // Silence noisy build warnings from Drizzle/pg in the edge runtime
  experimental: {
    // Allow server-only packages to be imported in server components
  },

  // Production logging
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === 'development',
    },
  },
};

export default nextConfig;