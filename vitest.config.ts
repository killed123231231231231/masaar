import { defineConfig } from "vitest/config";

// B7/P2-7 — first test harness for the project (the audit flagged zero
// automated tests as the biggest process gap). Scope today is the pure,
// dependency-free logic that silently breaks QR *content* if it
// regresses: the content-type encoders, URL gating, and short-id
// validation. DB/route-level tests (which need a Supabase test project
// or mocks) are deliberately deferred — see the scaffolds noted in the
// session report. Node environment; no jsdom needed for pure functions.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
