import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  // B7/P1-5 — renamed from experimental.serverComponentsExternalPackages,
  // which is deprecated in Next 15 (warned on every build). Same effect:
  // keeps qr-code-styling out of the server bundle's module transform.
  serverExternalPackages: ["qr-code-styling"],
  // B7/P2-4 — security headers (the app shipped with none). The four
  // hard headers are unambiguously safe + valuable. CSP is shipped in
  // Report-Only mode: it does NOT block anything (no user impact), it
  // just documents the intended policy and surfaces violations in the
  // browser console so we can tighten to an enforced CSP later without
  // guessing. frame-ancestors 'none' double-locks clickjacking with
  // X-Frame-Options. connect-src covers Supabase REST + realtime WS;
  // img-src covers next/image sources; script-src keeps inline/eval
  // that Next's runtime needs (to be tightened with nonces later).
  async headers() {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.supabase.co https://lh3.googleusercontent.com",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://vercel.live",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ");
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "Content-Security-Policy-Report-Only", value: csp },
        ],
      },
    ];
  },
  async redirects() {
    // B5/Bug 14 — the legacy /login route was deleted in favor of the
    // landing-header LoginModal. Existing inbound links (middleware
    // auth gate, welcome-email reset links, footer entries) all bounce
    // here. /auth/login was always a dead reference in older copy;
    // redirect it too. Both temporary (302) because we may restore a
    // dedicated login page later.
    // B7/P1-4 — append ?login=1 so the landing's HeaderLoginButton
    // autohook pre-opens the Welcome Back modal instead of dropping the
    // user on the marketing page with no obvious next step. Any
    // ?redirectTo= the producer attached survives the redirect (Next
    // preserves the query string on these path-only rules).
    return [
      { source: "/login", destination: "/?login=1", permanent: false },
      { source: "/auth/login", destination: "/?login=1", permanent: false },
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
      // B6 pivot — sub-pages collapsed into the single-page landing.
      // /product, /solutions, /resources, /about previously planned as
      // full pages (Phase 4 of B6) but Usama's full-landing eyeball
      // decided to mirror getqr's single-page structure instead. The
      // routes now land on the relevant landing anchor. Temporary (302)
      // so we can restore standalone deep-dive pages in a later sprint
      // if customer behaviour warrants. Old bookmarks, footer entries
      // from /create welcome emails, and any external "Solutions" /
      // "About" deep-links keep working.
      {
        source: "/product",
        destination: "/#features",
        permanent: false,
      },
      {
        source: "/solutions",
        destination: "/#features",
        permanent: false,
      },
      {
        source: "/resources",
        destination: "/#faq",
        permanent: false,
      },
      {
        source: "/about",
        destination: "/#gcc",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
