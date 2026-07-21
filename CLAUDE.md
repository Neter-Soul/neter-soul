# CLAUDE.md

Guidance for AI assistants (Claude Code and others) working in this repository.

## What this is

**Neter Soul** (marketed as "Neter · Soul") is a Portuguese-language (pt-BR) B2C emotional-wellness
platform: an AI "companion" therapist persona ("Anna Goldi"), a guided "Análise Sistêmica" (systemic
analysis) questionnaire producing a PDF-able report, a credits/subscription store, human-therapist
booking, and a therapist-facing session-transcription tool. Production URL: `netersoul.com.br`.

There is **no build step, no bundler, no test suite, and no linter** in this repo. It is deployed
straight to Netlify as static files + serverless functions.

## Stack

- **Frontend:** vanilla HTML/CSS/JS, no framework, no npm build. The entire client app is one huge
  single-page app in `index.html` (~7,300 lines: all CSS and all screens/JS inline in `<script>`
  tags). ES5-leaning style (`var`, `function`) is used throughout for broad compatibility.
- **Backend:** Netlify Functions (Node.js, `netlify/functions/*.js`), bundled with esbuild
  (`netlify.toml`). No Express/framework — each file exports a plain `handler(event)`.
- **Database/Auth:** Supabase (Postgres + Auth + Storage), project ref `tfrnbljrxivacubnexeh`.
  Client-side uses the `anon` key (loaded via CDN or a hand-rolled REST fallback client). Netlify
  Functions use `SUPABASE_SERVICE_ROLE_KEY` for privileged operations.
- **AI providers:** Anthropic Claude (default) via `netlify/functions/chat.js`, optionally OpenAI
  (`SOUL_AI_PROVIDER=openai`). Groq Whisper for audio transcription. See "AI models" below.
- **Payments:** Mercado Pago Checkout Pro (client-side flow in `index.html`, `iniciarPagamento()`).
- **Deploy:** Netlify, `publish = "."` (repo root is served as-is — be mindful that stray files at
  the root become publicly reachable URLs, see `teste-analise.html`).

## Repository layout

```
index.html              The entire client SPA — all pages, all inline JS/CSS.
chat.js                 Byte-for-byte duplicate of netlify/functions/chat.js. NOT deployed
                         (netlify.toml points functions at netlify/functions/). Stray/legacy file;
                         if you edit the chat function, edit netlify/functions/chat.js and keep
                         this copy in sync or remove it — do not edit only this one.
admin.html / admin.js   Separate admin-panel SPA (client management, credits, therapists, etc.).
                         Talks to Supabase directly via a hand-rolled REST client in admin.js
                         (does NOT reuse supabaseClient.js/supabaseService.js).
siteConfig.js           Central content/config object (window.siteConfig): copy, prices, images,
                         credit packages, store items, therapist bios. Edited to change site
                         content without touching app logic. Meant to be gradually replaced by
                         Supabase-backed config (see supabaseService.js:loadSiteConfig).
supabaseClient.js       Loads supabase-js from CDN into window.sb; falls back to a minimal
                         hand-written REST client (window.sb) if the CDN fails.
supabaseService.js      `SoulDB` — data-access wrapper. Every method tries Supabase first and
                         falls back to `siteConfig`/localStorage if `window.sb` is unavailable.
                         Follow this dual-mode pattern when adding new data access.
netlify.toml            Netlify build/redirect config. `/api/*` paths proxy to
                         `/.netlify/functions/*`; SPA catch-all redirects everything else to
                         index.html.
netlify/functions/
  chat.js                Main AI proxy: Anna Goldi companion, guided therapy flow, hypnotic
                          induction, and systemic_analysis. System prompts are built server-side
                          ONLY — see "Security model" below.
  transcribe.js           Takes a finished transcript, runs a Claude Haiku clinical-analysis
                           prompt, saves to `therapy_sessions` (service-role key).
  transcribe-chunk.js      Takes one audio chunk (multipart), sends to Groq Whisper, returns text.
images/                  Therapist headshots referenced by siteConfig.js.
teste-analise.html       Manual QA harness for the systemic_analysis endpoint against production.
                          It is publicly deployed (publish="."). Not part of the app UI.
REMEDIACAO-*.md          Portuguese-language security remediation logs (see below) — read these
                          before touching auth/CORS/prompt-injection-relevant code.
supabase-dump-neter-soul.md   Point-in-time Supabase security audit (RLS status, schema, RPCs).
                               Treat as historical unless you re-verify current state.
prompt-diagnostico-neter-soul.md  A prompt template used to brief an external auditor model.
neter-soul-1/            Legacy nested duplicate of most of the repo (its own netlify.toml,
                          package.json, functions, etc.) from an early commit. Several files are
                          byte-identical to the root copies; index.html and supabaseClient.js have
                          since diverged (stale in neter-soul-1). This is NOT what's deployed
                          (Netlify builds from the repo root). Don't edit files here expecting them
                          to ship — treat it as archaeology, not a second environment.
remediacao-02.zip         Archived snapshot from a past remediation. Not used at runtime.
```

## Running / testing locally

There is no `npm start`/build script (`package.json` only declares the `@supabase/supabase-js`
dependency used by the Netlify Functions). To run this locally you need the Netlify CLI:

```
netlify dev
```

This serves `index.html` at the root and proxies `/.netlify/functions/*` (and the `/api/*`
aliases) to the local functions. You'll need the environment variables below set (Netlify CLI
reads `.env` or `netlify env`). There is no automated test suite — validate changes by exercising
the flow manually in a browser (and check `node --check <file>.js` for syntax on function/inline
script changes, as the remediation logs show is the existing convention).

Because `index.html` is one 7000+ line file with all JS inline, prefer targeted `Grep`/line-number
edits over reading the whole file. Function names are prefixed by feature area to help navigate:
`an*` = Análise Sistêmica wizard, `t*` = guided therapy chat, `ac*` = Anna Goldi companion chat,
`th*` = therapists, `lj*` = loja (store), `tr*` = transcription tool, `cp*`/`ck*` = checkout,
`fs*` = full registration flow, `sb`/`SoulDB` = data layer.

## Environment variables (Netlify Functions)

| Variable | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Claude API key (default AI provider) |
| `OPENAI_API_KEY` | OpenAI key, only if `SOUL_AI_PROVIDER=openai` |
| `SOUL_AI_PROVIDER` | `anthropic` (default) or `openai` |
| `SOUL_MODEL_ANNA` | Model for Anna Goldi chat (default `claude-sonnet-4-6`) |
| `SOUL_MODEL_ANALYSIS` | Model for systemic analysis (default `claude-opus-4-7`) |
| `GROQ_API_KEY` | Groq Whisper key, used by `transcribe-chunk.js` |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role key — server-side only, never expose to client |

The client-side Supabase `anon` key and URL are hardcoded in `supabaseClient.js`/`admin.js`
(this is expected/normal for a Supabase anon key, it's public by design — but see the RLS warning
below, which is what actually makes that key dangerous here).

## Security model — read before touching auth, CORS, or prompts

This app went through several documented security remediations (`REMEDIACAO-01-*.md`,
`REMEDIACAO-02-*.md`). Conventions established there that must be preserved:

1. **AI system prompts are built exclusively server-side**, in `netlify/functions/chat.js`. The
   client sends structured data (`type`, `mode`, `report`, `memory`, `answers`, etc.), never a
   prompt string. A `_sys` field sent by the client is intentionally ignored. **Do not reintroduce
   a path where client input becomes part of the system prompt.**
2. **Plan/paywall is resolved server-side from the Supabase JWT** (`resolveUserPlan` in
   `chat.js`), not trusted from a client-sent `_plan` field. Free tier = 15 min/day, voice
   `amorosa` only, no systemic analysis; enforced via the `anna_session_log` table.
3. **CORS is an allowlist** (`ALLOWED_ORIGINS` in `chat.js`), not `*`. Remember CORS is not
   authentication — it only stops browser-JS from other origins, not `curl`/server-to-server calls.
4. **Token/size caps exist to bound cost**: `ANNA_TOKENS_CAP`, `MAX_HISTORY`, `MAX_MSG_CHARS`,
   `MAX_ANSWERS_LEN`, `SYS_MAX_CHARS` in `chat.js`. Keep these when refactoring.
5. **`admin.js`/`siteConfig.js` contain a hardcoded MVP admin login** (`admin@neter.com` /
   `admin123`, explicitly commented as temporary/insecure) alongside a real Supabase-Auth admin
   login path (`SoulDB.adminLogin`, checks `profiles.role`). Do not treat the hardcoded credential
   as acceptable to extend elsewhere; it's flagged as debt, not a pattern to copy.
6. **`supabase-dump-neter-soul.md` documents an as-of-audit-date state where Row Level Security
   was disabled on ~15 tables** (conversations, therapist client records, credit balances, contact
   messages) despite policies existing for them, plus RPCs (`add_user_credits`,
   `debit_user_credits`) callable by `anon`/`authenticated` that can let a client mint their own
   credits, and a `profiles` INSERT policy of `WITH CHECK (true)` that may allow client-side
   privilege escalation to `role='admin'`. **Treat this file as a known-issues list, not
   necessarily still-accurate** — if a task touches RLS, credits, or profile roles, verify current
   state via Supabase directly rather than assuming the dump is current, and flag if issues appear
   unresolved.
7. Two generations of some tables coexist (`systemic_analysis` vs `systemic_analyses`,
   `sessions` vs `chat_sessions`/`chat_messages`). Confirm which one is actually read/written by
   the code path you're touching before assuming a schema.

When in doubt on anything security-related in this codebase, prefer being conservative and ask
before loosening CORS, auth checks, or RLS-adjacent behavior — this product handles therapy
conversations and clinical notes.

## Conventions

- **Language:** all user-facing copy, commit messages, and code comments are Portuguese (pt-BR).
  Match this when adding strings or commit messages, unless told otherwise.
- **Style:** ES5-ish vanilla JS (`var`, function expressions, no modules/imports, no semicolonless
  ASI reliance issues — semicolons are used consistently). No TypeScript, no JSX. Match existing
  style rather than introducing modern syntax (`class`, `const`/`let`-only, arrow functions are
  used in places but keep it consistent with the surrounding code).
- **Dual-mode data access:** new data-fetching code should follow `supabaseService.js`'s pattern —
  try Supabase, catch and fall back to `siteConfig`/localStorage — so the site degrades gracefully
  if Supabase is unreachable/misconfigured.
- **No dead duplicate files:** this repo already carries stale duplicates (`chat.js` at root,
  the whole `neter-soul-1/` tree). Don't add more — if you need a copy for a Netlify Function,
  make sure only `netlify/functions/` is authoritative and either symlink-equivalent logic or
  keep a single source of truth.
- **`netlify.toml` redirects** define the public API surface (`/api/chat`, `/api/transcribe`,
  `/api/transcribe-chunk`, `/api/migrate-users`, `/api/admin-data`). Some of these target
  functions may not currently exist in `netlify/functions/` (e.g. `migrate-users`, `admin-data`
  were removed per `REMEDIACAO-01`) — check before assuming a redirect is live; a stale redirect
  to a missing function 404s, which was intentional there.
- Since `publish = "."`, any file added at the repo root is publicly served — don't drop
  scratch/debug files at the root of the working tree in a way that would get committed and
  deployed (see `teste-analise.html` as a precedent already living there).

## Making changes safely

- This is a live production consumer app with real user data (therapy content, personal notes,
  payment flow). Treat schema/RLS/auth changes as high-blast-radius even though there's no staging
  environment described in this repo.
- There's no CI, linter, or test suite to catch mistakes — the existing convention (see
  `REMEDIACAO-02-chat.md`) is to sanity-check with `node --check <file>.js` for any Node file
  (including inline `<script>` blocks intended to be valid standalone JS) before considering a
  change done.
- Because `index.html` is a single large file, use `Grep` to find the relevant function by name
  (see the prefix list above) rather than reading the whole file into context.
