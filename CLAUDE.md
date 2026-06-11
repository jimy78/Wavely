# CLAUDE.md

Guidance for AI assistants (Claude Code and others) working in this repository.

## What Wavely is

Wavely is a **French-language, mobile-first web app that predicts TikTok trends**
before they go viral. It's a single-page React app styled as a phone-width
(max 420px) mobile experience with a dark neon aesthetic.

Core user-facing features (tabs):
- **Trend Radar** (`forecast`) — predicted rising hashtags with virality scores.
- **Early Detector** (`early`) — videos that are starting to explode (before ~50K views).
- **Viral Score** (`score`) — paste a TikTok idea, get an AI-generated virality
  analysis (score, factors, best posting time, suggested sound, captions).
- **Avis** (`avis`) — certified-user testimonials.
- **S'abonner** (`pro`) — Stripe subscription (1,99 €/month) for the Pro tier.

Monetization is **freemium**: a few trends and one free Viral Score are
available to everyone; the rest is gated behind a Pro paywall.

## Tech stack

- **Build:** [Vite 5](https://vitejs.dev/) + `@vitejs/plugin-react`.
- **UI:** React 18 (`react`, `react-dom`), no router, no component library.
  Styling is **inline styles + a single CSS string** injected via `<style>` —
  there is no CSS file or Tailwind.
- **Auth:** Firebase Auth, **phone/SMS (OTP)** via `signInWithPhoneNumber` +
  invisible reCAPTCHA.
- **Data:** Cloud Firestore — dynamic content (trends/sounds/early videos) is
  read live from the doc `wavely/content`.
- **AI:** Anthropic Claude API, called **server-side only** from a serverless
  function (see API below).
- **Payments:** Stripe Payment Link (hosted checkout, no SDK).

## Project layout

```
.
├── index.html                  # Vite entry; lang="fr"; mounts #root
├── package.json                # scripts + deps (type: module)
├── vite.config.js              # minimal: react() plugin only
├── src/
│   ├── main.jsx                # ReactDOM entry → renders <Wavely/> from App.jsx
│   ├── App.jsx                 # THE app. ~900 lines, single default export.
│   ├── Admin                   # Admin dashboard component (NOTE: no .jsx ext)
│   └── api/
│       └── analyze.js          # Serverless function: POST /api/analyze → Claude
├── .github/workflows/          # SLSA provenance generator (release-time only)
├── App.jsx                     # ⚠️ LEGACY standalone copy — NOT in the build
├── wavely.jsx                  # ⚠️ LEGACY standalone copy — NOT in the build
└── wavely-*.zip                # ⚠️ Deploy artifact snapshots — ignore
```

### Files that matter vs. files that don't

- **Active source = `src/`.** The build graph is `index.html` →
  `src/main.jsx` → `src/App.jsx`. The `/api/analyze.js` function is the only
  backend.
- **`App.jsx` (root) and `wavely.jsx` are NOT part of the build.** They are
  older standalone copies of the app kept at the repo root. Edits there have no
  effect. When asked to change app behavior, edit **`src/App.jsx`**, not these.
  If you touch app logic, consider whether these stale copies should be deleted
  to avoid confusion (ask first).
- **`*.zip` files are packaged deploy snapshots** — never edit; treat as
  build output that happens to be committed.

### `src/Admin` (the admin dashboard)

- Defaults exported component named `Admin`. **The filename has no extension**
  (`src/Admin`, not `src/Admin.jsx`), so a normal `import './Admin.jsx'` will
  fail — import the exact path if you wire it up.
- It is **currently NOT mounted** anywhere. `main.jsx` only renders `<Wavely/>`;
  a previous admin route in `main.jsx` was removed (see git history).
- It is a password-gated editor that **writes** the Firestore doc
  `wavely/content` (trends, sounds, earlyVideos). `src/App.jsx` **reads** that
  same doc live via `onSnapshot`. This is the content pipeline: Admin edits →
  Firestore → live app update.

## Build & run

```bash
npm install
npm run dev        # Vite dev server (frontend only)
npm run build      # production build → dist/
npm run preview    # serve the production build locally
```

There is **no test suite, linter, or formatter** configured. Don't claim tests
pass — there are none. Keep changes consistent with the existing style instead.

### Important: the `/api/analyze` endpoint needs a host

`src/api/analyze.js` is a **Vercel-style serverless function**
(`export default async function handler(req, res)` under an `api/` directory).
`vite dev` does **not** serve it, so the **Viral Score feature will not work
under plain `npm run dev`** — it expects to run on a platform (e.g. Vercel) that
routes `POST /api/analyze` to that function, with the env var
`ANTHROPIC_API_KEY` set. There is no `vercel.json`; deployment relies on the
platform's default `api/` convention.

## Key conventions & architecture notes

- **`src/App.jsx` is one big file.** The whole UI lives in a single default
  export `Wavely()` plus a few sibling components (`PaywallModal`,
  `PhoneAuthScreen`, `LockedCard`) in the same file. Match that pattern; don't
  introduce a folder-per-component structure without being asked.
- **Styling is inline.** Colors, spacing, and animations are written directly in
  `style={{...}}` objects and in the big `css` template string near the bottom of
  the component. The palette: teal `#00f5d4`, purple `#7209b7`, pink `#f72585`,
  yellow `#f9c74f`, on near-black `#05040f`. Fonts: **Syne** (headings) and
  **DM Sans** (body), loaded from Google Fonts.
- **All copy is in French.** Keep new user-facing strings in French and match the
  existing casual/marketing tone (emojis are used liberally and intentionally).
- **State is local React state** in `Wavely()` — no global store. Cross-session
  state lives in `localStorage` and Firebase.
- **Pro entitlement is client-side only.** Pro status is stored in
  `localStorage` as `wavely_pro_<uid>` (and `wavely_pending_pro` before
  login); the free-score gate uses `wavely_free_score_used`. This is **UX
  gating, not real access control** — there is no server-side verification of
  subscriptions. Don't treat it as secure; don't "fix" it into a real
  entitlement system without explicit direction.
- **Stripe return flow:** after checkout, the app expects to be reopened with
  `?subscribed=true`; it then flips the user to Pro and shows a success banner.
- **Firestore content shape:** `wavely/content` → `{ data: { trends[], sounds[],
  earlyVideos[] } }`. The app falls back to the hardcoded `DEFAULT_*` arrays if
  the doc is missing or empty. The same defaults are duplicated in `src/Admin`'s
  `DEFAULT_DATA` — keep them in sync if you change the shape.

## AI / Claude integration specifics

The Viral Score calls Claude from `src/api/analyze.js`:
- Endpoint: `https://api.anthropic.com/v1/messages`, header
  `anthropic-version: 2023-06-01`, key from `process.env.ANTHROPIC_API_KEY`.
- Model: `claude-sonnet-4-20250514` (pinned in the function). If asked to upgrade
  the model, change it here only.
- The system prompt forces a **strict JSON-only response** (no markdown/backticks)
  with this shape, which the frontend `JSON.parse`s directly:
  `{ score, verdict, factors[{label,score,color}], bestTime, suggestedSound,
  tip, captions[] }`. If you change the prompt's output schema, update the
  rendering in `src/App.jsx` (the `score` tab) to match, or parsing will break.
- The frontend talks to the **local relative path `/api/analyze`** (see
  `analyzeWithClaude` in `src/App.jsx`) so the Anthropic key never reaches the
  browser. Keep it that way — never call the Anthropic API directly from
  client code.

## Security caveats (don't make these worse)

- **Hardcoded secrets in client code:** the Firebase web config lives in
  `src/App.jsx`/`src/Admin` (this is normal for Firebase web apps — it's not a
  secret), but the **admin password is hardcoded** in `src/Admin`
  (`ADMIN_PASSWORD`). Treat the admin dashboard as low-security; don't expand its
  surface. Real protection should come from Firestore security rules, not the
  client password.
- The **`ANTHROPIC_API_KEY` must stay server-side** (env var in the serverless
  function). Never inline it or expose it to the bundle.

## Git & workflow

- Default/integration branch: **`main`**.
- Do feature work on a dedicated branch, commit with clear messages, push with
  `git push -u origin <branch>`, and open a **draft PR** when pushing.
- Commit history style here is short, imperative subject lines
  (e.g. "Refactor API call to use local endpoint").
- The only GitHub Action is a release-triggered **SLSA provenance generator**;
  there is no CI build/test gate on PRs.
