import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: 'export', // Disabled because dynamic routes require server or Vercel
  images: {
    // unoptimized: true, // Not strictly needed on Vercel but good for compatibility if sticking to external storage
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'nuusmzfnmkzfucophlew.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
