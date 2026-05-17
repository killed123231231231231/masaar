import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  experimental: {
    // Required for qr-code-styling on the server
    serverComponentsExternalPackages: ["qr-code-styling"],
  },
};

export default nextConfig;
