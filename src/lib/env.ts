// Centralised environment access. Validation happens lazily (on call,
// per request) rather than at module import, so `next build` does not
// fail just because .env.local is absent — but a misconfigured
// production deployment fails fast with a clear message instead of
// silently pointing every QR at localhost or booting without Supabase.
//
// Dependency-free so it is safe to import from the edge route.

function requireProdEnv(name: string): string {
  const value = process.env[name];
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
  return requireProdEnv("NEXT_PUBLIC_SUPABASE_URL");
}

export function supabaseAnonKey(): string {
  return requireProdEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

export function appUrl(): string {
  const value = process.env.NEXT_PUBLIC_APP_URL;
  if (value && value.length > 0) return value.replace(/\/+$/, "");
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Missing required environment variable NEXT_PUBLIC_APP_URL. " +
        "Without it every dynamic QR would encode http://localhost:3000."
    );
  }
  return "http://localhost:3000";
}
