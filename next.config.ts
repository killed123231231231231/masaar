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
  async redirects() {
    // B5/Bug 14 — the legacy /login route was deleted in favor of the
    // landing-header LoginModal. Existing inbound links (middleware
    // auth gate, welcome-email reset links, footer entries) all bounce
    // here. /auth/login was always a dead reference in older copy;
    // redirect it too. Both temporary (302) because we may restore a
    // dedicated login page later.
    return [
      { source: "/login", destination: "/", permanent: false },
      { source: "/auth/login", destination: "/", permanent: false },
    ];
  },
};

export default nextConfig;
