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
      // B5/Round2 post-merge — per-QR analytics was unified into the
      // Overview as a URL-backed filter (`/dashboard?qr=<id>`). Old
      // bookmarks, sidebar "Analytics" deep links from earlier sessions,
      // and any email/CSV link that pointed at the standalone route now
      // resolve to the same view in its new location. Temporary (302)
      // because the unification is still settling — we may restore a
      // standalone deep view later if customer behavior demands it.
      {
        source: "/dashboard/qr/:id/analytics",
        destination: "/dashboard?qr=:id",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
