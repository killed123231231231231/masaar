# Masaar — Claude Code Handoff Guide

This is everything you need to hand the project off to Claude Code and let it
ship to production.

---

## 1 · Open the project in Claude Code

The folder is at `C:\Users\masim\Downloads\masaar\`. Open it in Claude Code.

(Optional: move it to `C:\Users\masim\Projects\masaar\` if that's where you
keep your work — but Downloads works fine.)

---

## 2 · Install the MCP plugins Claude Code needs

Run these in Claude Code (or use the plugin manager UI):

```
/plugin install supabase
/plugin install github
/plugin install vercel
```

Each plugin will walk you through authentication.

| Plugin | What it lets Claude do |
|---|---|
| **Supabase MCP** | Create the project, run migrations, fetch keys, query tables, list projects/orgs |
| **GitHub MCP** | Create repos, commit, push, open PRs, read CI status |
| **Vercel MCP** | Import repos, set env vars, deploy, read build/runtime logs |

---

## 3 · Credentials checklist

Have these ready before you start:

- [ ] **GitHub account** — sign in to the GitHub MCP (OAuth)
- [ ] **Supabase account** — Personal Access Token from Account Settings → Access Tokens
- [ ] **Vercel account** — Token from vercel.com → Account Settings → Tokens
- [ ] **Domain** (optional) — buy from Namecheap or Cloudflare; you can ship on `masaar.vercel.app` first

No keys for you to manually copy around. The MCPs handle it.

---

## 4 · The kickoff prompt

Open `FIRST_SESSION_PROMPT.md` in this folder and paste the entire code block
inside it into your first Claude Code session. That prompt:

- Activates the senior-engineer persona
- Runs a paranoid bug audit on the scaffold before shipping
- Fixes blockers
- Provisions Supabase, pushes to GitHub, deploys to Vercel
- Runs an end-to-end smoke test on production

Do not skip the audit step. The scaffold is solid but no scaffold is bug-free,
and you want Claude to find issues before they hit production.

---

## 5 · Follow-up prompts (one per session, in order)

After production is live, work through the stubbed features one at a time. The
detailed implementation prompts are in `README.md` section 6. Use these short
trigger prompts in Claude Code:

1. *"Now wire up logo upload using the prompt in README.md section 6, Prompt 1.
   When done, deploy and confirm logos render in the QR preview on production."*

2. *"Now implement the realtime scan feed — README section 6, Prompt 2."*

3. *"Now add frames around the QR — Prompt 3."*

4. *"Now add password-protected QRs — Prompt 4."*

5. *"Now add PDF export — Prompt 5."*

6. *"Now add folders — Prompt 6."*

Each is roughly a 30–90 minute session. After every prompt, ask Claude Code to
deploy and smoke-test before moving to the next.

---

## 6 · Guardrails — do NOT let Claude Code do these without sign-off

- Buying a domain or anything that costs money
- Inviting collaborators to GitHub / Vercel / Supabase
- Turning off Row Level Security ("just for now")
- Pushing to `main` if CI is failing
- Adding payment / Stripe integration — explicitly out of scope per project spec
- Modifying the database schema without writing a new migration file under
  `supabase/migrations/`

---

## 7 · When something goes wrong

If Claude Code reports an error, ask it to:

1. Read the Vercel build logs or `npm run dev` output exactly.
2. Read the relevant source file.
3. State the root cause before proposing a fix.

Don't accept "I think it's a dependency issue, let me reinstall." Make it diagnose.

---

## 8 · Useful Claude Code commands during the build

- `/clear` — start a fresh session (use between major features)
- `/cost` — see how many tokens you've burned this session
- `/review` — ask Claude to review uncommitted changes before you commit
- `/init` — generate a `CLAUDE.md` in the project (already created — use this
  if you want to regenerate)

After your first successful deploy, the existing CLAUDE.md gives every future
session full context automatically.
