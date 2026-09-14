# MatchHub

A shared head-to-head record between friends. Sign up with a username and a password, add the
people you play against, and record match scores. A match recorded by either player shows up on
both accounts.

Next.js (App Router) · TypeScript · Tailwind CSS · Supabase (Postgres) · deploys to Vercel.

---

## What's in it

**Create account / sign in** — a username and a password. Nothing else. No email is asked for,
stored, or sent; the only check when signing up is that the username isn't already taken.

**Players** — add someone by their MatchHub username. The link is made both ways, so you land on
their list at the same moment. Each row shows your win–draw–loss record against them.

**Player page** — tap a player for the full picture:

- the record, as numbers and as a win/draw/loss bar
- win rate for both of you, on dials
- goals scored, conceded, per match, clean sheets, goal difference
- form over the last 10 meetings as W/D/L
- current and longest winning streak, current and longest unbeaten run
- biggest win and heaviest defeat
- two charts: goals in each match, and how the win count pulled apart over time
- every match played; tap one to correct or delete it

**Add match** — from the player page: your score, their score, the date. That's the whole form.

**Profile** — change your username, change your password, sign out.

Only matches are stored. Every statistic is worked out from them as the page renders, so
correcting a scoreline immediately fixes every number that depended on it.

---

## How accounts work

MatchHub does not use Supabase Auth. Accounts live in the database itself:

- `app_users` holds a username and a bcrypt hash of the password. The password itself is never
  stored and never leaves the database function that checks it.
- Signing in returns a long random session token. Only its SHA-256 hash is kept server-side; the
  token is held on your device and sent with each request.
- Every table has Row Level Security switched on **with no policies at all**, so the public API
  key cannot read or write a single row directly.
- All reading and writing happens through the `app_*` database functions. Each one takes the
  session token, resolves it to an account, and only then touches data belonging to that account.
  The internal helpers — including the one that mints tokens — have their execute permission
  revoked from PUBLIC, so they can't be called from outside.

Practical consequences: changing your username is cosmetic and can never lock you out; changing
your password requires the current one and signs your other devices out; and there is no password
reset, because there is no email to send one to. If someone forgets their password, delete the
row from `app_users` in the Supabase table editor and let them sign up again.

---

## Setting up the database

1. Create a project at [supabase.com](https://supabase.com) and wait for it to provision.
2. Open **SQL Editor → New query**, paste the whole of
   [`supabase/schema.sql`](./supabase/schema.sql), and run it. That creates four tables —
   `app_users`, `app_sessions`, `friends`, `matches` — locks them all down, and creates the
   functions the app calls.
3. Copy your keys from **Project settings → API**: the Project URL and the `anon` `public` key.

There is nothing to configure in the Authentication section. You can leave it untouched.

---

## Running it locally

Node 20.9 or newer (`node -v` to check). Next 16 and React 19 need it.

```bash
unzip matchhub.zip && cd matchhub
npm install
cp .env.example .env.local     # paste the two Supabase values in
npm run dev
```

Open http://localhost:3000 and create an account.

| Variable | Where it comes from |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project settings → API → `anon` `public` key |

**Testing both sides.** Create a second account in a private window, add the first account by
username from either side, and record a match. Both accounts see it — the other window picks it
up when you switch back to it.

---

## Deploying to Vercel

1. Push to GitHub: `git init`, `git add .`, `git commit -m "MatchHub"`, `git branch -M main`,
   `git remote add origin <your-repo-url>`, `git push -u origin main`. `.env.local` is already
   gitignored.
2. In Vercel, **Add New → Project**, import the repository. Next.js is detected automatically.
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` under Environment
   Variables before deploying.
4. Deploy, open the URL on your phone, and share it with whoever you play.

Changing an environment variable later needs a redeploy — the values are compiled into the
browser bundle.

---

## Project structure

```
src/
  app/
    login/page.tsx        Create account and sign in
    page.tsx              Player list
    player/[id]/page.tsx  Statistics, add match, match history
    profile/page.tsx      Username, password, sign out
    layout.tsx, globals.css
  components/
    auth-provider.tsx     Session token, sign in/up/out, account changes
    data-provider.tsx     Player list and matches
    app-frame.tsx         Mobile frame, signed-in guard, bottom tabs
    match-sheet.tsx       Add / edit match
    charts.tsx, ui.tsx
  lib/
    api.ts                Every database function call, in one place
    stats.ts              All derived statistics (no React, no network)
    supabase.ts, types.ts, utils.ts
supabase/schema.sql       Tables, lockdown, and the app_* functions
```

The layout is phone-first: one column capped at 28rem, a two-item tab bar pinned to the bottom
with safe-area padding, and touch targets sized for thumbs. On a desktop browser it stays centred
rather than stretching.

## Scripts

```bash
npm run dev        # local development
npm run build      # production build
npm run start      # serve the production build
npm run typecheck  # tsc --noEmit
npm run lint       # next lint
```
