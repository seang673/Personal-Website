# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Personal/professional single-page website for Sean Griffiths, built with plain HTML/CSS/JS and served as static content from `public/`. Firebase provides Authentication (email/password) and Firestore (per-user feedback). Live at https://personal-website-de16c.web.app.

There is **no build step, no bundler, and no test/lint tooling** — `package.json` defines dependencies only, with no `scripts`. The deployed site is exactly the files in `public/`.

## Commands

- **Deploy (Firebase Hosting):** `firebase deploy --only hosting` (or just push to `main` — CI deploys automatically).
- **Serve locally:** `firebase serve` or `firebase emulators:start` (serves `public/`). Any static file server pointed at `public/` also works.
- **Install deps:** `npm install` (only needed for `server.js`; the deployed site loads Firebase from CDN, not from `node_modules`).
- **Run the Express server:** `node server.js` (listens on port 3000 — see caveat below).

There are no tests or linters configured.

## Architecture

### Firebase initialization and the `window` global bridge
The critical coupling in this project: Firebase is initialized in an **inline `<script type="module">` at the bottom of [public/index.html](public/index.html)** using CDN imports (`https://www.gstatic.com/firebasejs/11.6.0/...`). That inline script assigns Firebase objects onto `window` — `window.app`, `window.auth`, `window.signOut`, `window.createUserWithEmailAndPassword`, `window.signInWithEmailAndPassword`.

The separate module files in [public/scripts/](public/scripts/) then read those globals rather than importing Firebase themselves:
- [authFunctions.js](public/scripts/authFunctions.js) — `registerUser` / `loginUser`, calling `window.createUserWithEmailAndPassword` / `window.signInWithEmailAndPassword`.
- [authEvents.js](public/scripts/authEvents.js) — wires the signup/login/logout forms to those functions and toggles visibility of `#authSection` / `#feedbackSection`.
- [feedbackFunctions.js](public/scripts/feedbackFunctions.js) — re-imports Firestore/Auth directly from the CDN and uses `window.app`.

**When changing Firebase setup, update both the inline script in index.html and the consuming module — they are only connected through `window`, not through imports.** Script load order in index.html matters (inline init runs first, then the module `<script src>` tags).

### Feedback feature
Feedback docs live in the Firestore `feedbacks` collection with `{ feedback, timestamp, userId }`. [feedbackFunctions.js](public/scripts/feedbackFunctions.js) gates the UI on `onAuthStateChanged`, queries only the current user's docs (`where("userId", "==", user.uid)`), and renders them live via `onSnapshot`. Delete buttons call `deleteDoc` on the doc ref.

### Dead / standalone code — do not assume these are wired in
- **[firebase.js](firebase.js) (repo root)** uses npm-style bundler imports (`from "firebase/app"`) and is **not referenced by the deployed site** (index.html uses CDN imports instead). It is effectively unused.
- **[server.js](server.js)** is a standalone Express app (cookie-parser + express-rate-limit on port 3000). It is **not part of the Firebase Hosting deployment**, which only serves static files from `public/`. Treat it as an experimental/local-only piece.

### Styling
All styles are in a single [public/styles.css](public/styles.css). Some feedback-list markup is styled inline within template strings in feedbackFunctions.js.

### Beach backdrop
The page sits on a hand-authored SVG sunset beach scene — no image assets. It is a `.beach-backdrop` div (first child of `<body>` in index.html, `aria-hidden`) holding an inline `<svg>` with `preserveAspectRatio="xMidYMid slice"`, positioned `fixed / inset:0 / z-index:-1` so content scrolls over a locked scene.

- **Palette lives in `:root` custom properties** at the top of styles.css — retune the scene from there rather than editing SVG fills.
- **Palm fronds** are one shared `<path id="frond">` in `<defs>`, `<use>`d and fanned with `rotate()`. Each frond sits in a bare `<g class="frond">` inside a parent already translated to the crown, so `transform-box: view-box; transform-origin: 0 0` makes the CSS sway pivot at the crown. Don't put a `transform` attribute on `.frond` itself — the CSS animation would override it.
- **Wave paths are drawn to 2× the viewBox width** so the `translateX(-1440px)` drift loops seamlessly. Changing the viewBox means redrawing them.
- All motion is `transform`/`opacity` only and is killed under `@media (prefers-reduced-motion: reduce)`.

**Two constraints when restyling:**
1. `#feedbackSection` and `#logoutButton` must keep `display: none` as their CSS default — authEvents.js/feedbackFunctions.js toggle them via inline `style.display`, and authEvents.js captures `.center-container`'s original `justify-content` at load to restore on logout.
2. Cards are frosted glass (`backdrop-filter`), so card text uses `var(--ink)` / `var(--ink-soft)`, not white. There's an `@supports not (backdrop-filter…)` fallback that swaps in opaque backgrounds — keep new translucent surfaces listed there.

## Deployment

Two GitHub Actions workflows both trigger on push to `main`:
- [firebase-hosting-merge.yml](.github/workflows/firebase-hosting-merge.yml) — deploys to Firebase Hosting (project `personal-website-de16c`).
- [static.yml](.github/workflows/static.yml) — deploys the repo to GitHub Pages.

A third workflow deploys Firebase preview channels on pull requests.

## Notes

- Firebase config (including the web API key) is committed in both index.html and firebase.js. This is expected for Firebase web apps — the key is a public client identifier, and access is controlled by Firestore/Auth security rules (not present in this repo).
- The README lists security features (DOMPurify sanitization, CORS/CSRF, rate limiting). Verify before relying on any of these: DOMPurify is loaded via CDN in index.html but is not currently invoked in the scripts, and the rate limiter lives only in the non-deployed `server.js`.
