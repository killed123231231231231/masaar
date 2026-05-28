// B7/P2-5 — ESLint was installed (eslint@9 + eslint-config-next@15.5)
// but never CONFIGURED, so `next lint` interactively prompted to set
// it up and lint effectively never ran. This flat config (ESLint 9)
// extends Next's core-web-vitals ruleset via FlatCompat so lint runs
// non-interactively and can gate CI alongside typecheck + build.
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

export default [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "next-env.d.ts",
      "supabase/**",
    ],
  },
  ...compat.extends("next/core-web-vitals"),
  // Register @typescript-eslint so the `// eslint-disable-next-line
  // @typescript-eslint/no-explicit-any` comments in the codebase
  // resolve (next/core-web-vitals via FlatCompat doesn't load the TS
  // plugin by itself). Without this, ESLint reports "rule not found"
  // on every disable comment — false errors that would fail CI.
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: { parser: tsParser },
    plugins: { "@typescript-eslint": tsPlugin },
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
];
