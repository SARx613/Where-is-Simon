import type { NextConfig } from "next";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  // output: 'export', // Disabled because dynamic routes require server or Vercel
  serverExternalPackages: ['canvas'], // Exclude canvas from bundling for server-side face-api.js
  images: {
    // unoptimized: true, // Not strictly needed on Vercel but good for compatibility if sticking to external storage
    remotePatterns: supabaseHost
      ? [
          {
            protocol: 'https',
            hostname: supabaseHost,
            port: '',
            pathname: '/storage/v1/object/public/**',
          },
        ]
      : [],
  },
};

export default nextConfig;
