# StudyZone AI — Website

A dark-glassmorphism AI study assistant web app. This is the standalone
**website** deliverable (separate from the Telegram bot).

## ✨ Features

- Dark glassmorphism UI (deep indigo/violet, purple accents)
- Chat with AI (free, keyless — uses Pollinations text API)
- 3 selectable AI models: Meta Llama 3, Mistral AI, Google Gemma
- Bilingual: English 🇬🇧 & Bengali 🇧🇩
- Chat history grouped by Today / This Week / Older (stored in localStorage)
- Clear-all-history
- Welcome screen with 4 suggestion cards
- Composer with paperclip / mic / camera / send icons
- Sidebar: Home, FAQ, Privacy, About, Settings
- **Local auth** (passwordless — replaced Clerk): name + email, or
  "Continue as guest". No API keys required.

## 🚀 Run locally

```bash
cd website
npm install
npm run dev        # local dev server
npm run build      # production build → dist/
npm run preview    # preview the production build
```

## ☁️ Deploy to Vercel

1. Push the `website/` folder to a Git repo (or import directly).
2. In Vercel, create a new project and set:
   - **Framework preset**: Vite
   - **Build command**: `npm run build`
   - **Output directory**: `dist`
3. Deploy. No environment variables required (the app is keyless).

`vercel.json` is included (SPA rewrite to `index.html`).

## ☁️ Deploy to Netlify

1. Create a new Netlify site pointing at the `website/` folder.
2. Build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
3. `netlify.toml` is included (SPA rewrite to `index.html`, so the
   hash/history routes resolve correctly).

The app uses **hash routing**, so it works even on static hosts without
server rewrites.

## 🔐 Auth note

The original app used Clerk (required `VITE_CLERK_PUBLISHABLE_KEY`).
This rebuild replaces Clerk with a built-in local auth provider
(`src/lib/auth.tsx`) that stores the profile in localStorage — so it
works out of the box with zero configuration. The UI surface is the
same (Log in / Sign up open a themed modal; a signed-in user shows an
avatar + dropdown with Settings / Sign out).

To swap in a different real backend later (e.g. Supabase Auth), edit
only the `loadProfile` / `saveProfile` / `signOut` functions in
`src/lib/auth.tsx` — the rest of the app is unchanged.

## 📁 Structure

```
website/
├─ index.html
├─ package.json
├─ vite.config.ts
├─ tsconfig.json
├─ vercel.json          (Vercel SPA config)
├─ netlify.toml         (Netlify SPA config)
├─ public/
│  ├─ logo.svg
│  └─ favicon.svg
└─ src/
   ├─ main.tsx          (hash router entry)
   ├─ App.tsx           (routes)
   ├─ index.css         (design system + auth modal styles)
   ├─ lib/
   │  ├─ ai.ts          (AI backend calls)
   │  ├─ storage.ts     (chat persistence)
   │  └─ auth.tsx       (local auth provider)
   └─ components/
      ├─ ChatApp.tsx    (main UI)
      ├─ SubPage.tsx    (FAQ/Privacy/About/Settings)
      └─ ModelLogo.tsx
```
