// Centralised environment access. Validation happens lazily (on call,
// per request) rather than at module import, so `next build` does not
// fail just because .env.local is absent — but a misconfigured
// production deployment fails fast with a clear message instead of
// silently pointing every QR at localhost or booting without Supabase.
//
// IMPORTANT: each NEXT_PUBLIC_* var must be read as a *literal*
// `process.env.NEXT_PUBLIC_FOO` reference. Next.js only inlines those
// into the client bundle by static text replacement; a computed
// `process.env[name]` is NOT replaced and throws in the browser.
//
// Dependency-free so it is safe to import from the edge route.

function requireProdEnv(name: string, value: string | undefined): string {
  if (value && value.length > 0) return value;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      `Missing required environment variable ${name}. Set it in the ` +
        `deployment environment (Vercel Project Settings) and in ` +
        `.env.local for local development.`
    );
  }
  return "";
}

export function supabaseUrl(): string {
  return requireProdEnv(
    "NEXT_PUBLIC_SUPABASE_URL",
    process.env.NEXT_PUBLIC_SUPABASE_URL
  );
}

export function supabaseAnonKey(): string {
  return requireProdEnv(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

// Canonical production origin. The custom domain quickqrcode.live is the
// primary; masaar-zeta.vercel.app stays alive as a Vercel fallback. The
// NEXT_PUBLIC_APP_URL env var (set in Vercel Production) overrides this.
const CANONICAL_PROD_URL = "https://quickqrcode.live";

export function appUrl(): string {
  // A real configured value wins — but the Preview scope deliberately
  // holds the "https://preview.invalid" placeholder, so anything
  // containing "invalid" is treated as unset and we fall through.
  const raw = process.env.NEXT_PUBLIC_APP_URL;
  if (raw && raw.length > 0 && !raw.includes("invalid")) {
    return raw.replace(/\/+$/, "");
  }

  // Real production deployment — hardcode the canonical domain.
  if (process.env.VERCEL_ENV === "production") {
    return CANONICAL_PROD_URL;
  }

  // Server on a Vercel preview/dev deployment: its own deployment URL
  // (VERCEL_URL is server-only — never inlined into the client bundle).
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Browser (the client-side QR builder): use the origin actually
  // serving us, so a preview build encodes a resolvable short link.
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return "http://localhost:3000";
}
