# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Personal/professional single-page website for Sean Griffiths, built with plain HTML/CSS/JS and served as static content from `public/`. Firebase provides Authentication (email/password) and Firestore (per-user feedback). Live at https://personal-website-de16c.web.app.

The site is **not a scrolling document**. It is a fixed, one-viewport sunset beach scene where five clouds in the sky are the navigation; clicking one plays a PowerPoint-style zoom into that cloud and opens the section in a frosted panel.

There is **no build step, no bundler, and no test/lint tooling** — `package.json` defines dependencies only, with no `scripts`. The deployed site is exactly the files in `public/`.

## Commands

- **Deploy (Firebase Hosting):** `firebase deploy --only hosting` (or just push to `main` — CI deploys automatically).
- **Serve locally:** `firebase serve` or `firebase emulators:start` (serves `public/`). Any static file server pointed at `public/` also works.
- **Install deps:** `npm install` (only needed for `server.js`; the deployed site loads Firebase from CDN, not from `node_modules`).
- **Run the Express server:** `node server.js` (listens on port 3000 — see caveat below).

There are no tests or linters configured.

## Architecture

### Three stacked layers
[public/index.html](public/index.html) is, in order:

1. **`.beach-backdrop`** — a fixed, `aria-hidden`, `pointer-events:none` div holding one inline `<svg>` scene at `z-index:-1`.
2. **`.sky`** — the interactive layer: `.sky-stage` holding five `<button class="sky-cloud">` elements, plus the cursive `.sand-signoff`.
3. **`.section-overlay`** — a `hidden` fixed overlay with one `.section-panel` (`role="dialog"`) containing all five `.section-content` panes, only one of which is un-`hidden` at a time.

`html, body { height:100%; overflow:hidden }` guarantees the page itself never scrolls. The **only** scrollable element on the site is `.section-scroll` inside an open panel.

### Cloud navigation ([skyNav.js](public/scripts/skyNav.js))
The URL hash is the single source of truth. A cloud click sets `location.hash`; a `hashchange` handler calls `sync()`, which opens or closes. That means cloud clicks, browser Back/Forward, and pasted `/#resume` links all flow through one code path.

- **The zoom** sets an inline `transform` on `.sky-stage`: `scale(S) translate(tx, ty)`, where `S` fits the clicked cloud to the viewport (capped at 8) and `tx/ty` map its centre onto the viewport centre. `.sky-cloud` therefore **must never carry a transform of its own** — `skyNav.js` measures its layout box. The idle bob and the 1.25x hover scale live on the nested `.cloud-bob` / `.cloud-scale` wrappers precisely so they don't corrupt that measurement or fight each other over `transform`.
- **A cold deep link opens with no zoom** — there was no cloud on screen to fly from.
- **Back** uses `history.back()` only when we pushed the hash ourselves; otherwise it clears the hash via `replaceState`, so a deep-linked visitor isn't ejected from the site.
- Escape and a scrim click also close. Focus moves to the Back button on open and returns to the originating cloud on close; `.sky` gets `inert` while the panel is open, with a Tab trap as fallback.

If you add a section: add the cloud button, the `.section-content` pane with a matching `data-section`, an `<h1 id="<section>-title">`, and the id to `SECTIONS` in skyNav.js.

### Firebase initialization and the `window` global bridge
Firebase is initialized in an **inline `<script type="module">` at the bottom of [public/index.html](public/index.html)** using CDN imports (`https://www.gstatic.com/firebasejs/11.6.0/...`). That inline script assigns Firebase objects onto `window` — `window.app`, `window.auth`, `window.signOut`, `window.createUserWithEmailAndPassword`, `window.signInWithEmailAndPassword`.

The separate module files in [public/scripts/](public/scripts/) then read those globals rather than importing Firebase themselves:
- [authFunctions.js](public/scripts/authFunctions.js) — `registerUser` / `loginUser`, reading `window.createUserWithEmailAndPassword` / `window.signInWithEmailAndPassword` **at call time** (so a test can stub them and exercise the real form handlers without touching the live project).
- [authEvents.js](public/scripts/authEvents.js) — wires the signup/login/logout forms and toggles `#authSection` / `#feedbackSection`.
- [feedbackFunctions.js](public/scripts/feedbackFunctions.js) — re-imports Firestore/Auth directly from the CDN and uses `window.app`.

**When changing Firebase setup, update both the inline script in index.html and the consuming module — they are only connected through `window`, not through imports.**

### Feedback feature
Feedback docs live in the Firestore `feedbacks` collection with `{ feedback, timestamp, userId }`. [feedbackFunctions.js](public/scripts/feedbackFunctions.js) gates the UI on `onAuthStateChanged`, queries only the current user's docs (`where("userId", "==", user.uid)`), and renders them live via `onSnapshot`. The whole feature now lives inside the **Feedback** cloud's pane.

### Dead / standalone code — do not assume these are wired in
- **[firebase.js](firebase.js) (repo root)** uses npm-style bundler imports (`from "firebase/app"`) and is **not referenced by the deployed site**. It is effectively unused.
- **[server.js](server.js)** is a standalone Express app (cookie-parser + express-rate-limit on port 3000), **not part of the Firebase Hosting deployment**. Treat it as an experimental/local-only piece.

### Beach backdrop
One hand-authored SVG, `viewBox="0 0 1440 900"`, `preserveAspectRatio="xMidYMid slice"`. No image assets.

- **Palette lives in `:root` custom properties** at the top of styles.css — retune the scene from there rather than editing SVG fills. The palms are lit rather than silhouetted (`--palm-trunk`, `--palm-leaf`); `--gull` keeps the dark silhouette treatment for the distant birds.
- **Layout contract:** horizon at `y=470`, sand edge at `y≈644`. Because `slice` crops the top and bottom on wide screens and the sides on narrow ones, keep beach props inside **y 640–860**, and inside **x 510–930** if they should survive a portrait phone. The bottom-right of the sand is deliberately left empty — that is where `.sand-signoff` sits.
- **Repeated shapes use `<defs>` + `<use>`**: `#frond`, `#gull`, `#wisp`, `#crab`, `#seaweed`, `#lounger`, `#footprint`, the three shells, `#starfish`, and the three `#cloud-a/b/c` symbols the nav clouds reference.

**Transform-origin rules — this is the fiddly part.** Each animated element picks the `transform-box` that makes its pivot unambiguous:

- **Fronds** use `transform-box: view-box` with `transform-origin: var(--crown-x) var(--crown-y)`, and each `.palm` sets those two properties to its own crown. This only works because `.frond` has **no transformed ancestor**, so its user space *is* the viewBox. The fan angle and the 0.85/0.6 size live on the inner `<use>` (`translate(cx cy) rotate(a) scale(s)`) — never put a `transform` attribute on `.frond` itself, the CSS sway would override it. Left-hand fronds add `scale(-1 1)` so the droop still falls downward on that side; rotating them 180° instead would make them curve upward.
- **Gulls** split glide from flap: `.gull` animates `translateX` only (origin-independent, so a transformed ancestor is harmless), while `.gull-wing` uses `transform-box: fill-box` for the `scaleY` wing beat.
- **Crabs** and **glints** likewise use `fill-box`, since they scale/rotate about their own shape.
- **Seaweed** uses `view-box` with a per-clump `transform-origin` set inline.
- **Swells roll toward the shore, never sideways.** Six `.swell` crests are authored at `y=0` (`#crest-a/b/c`), placed by `<use y="486">`, and animated down to the waterline with a slight `scaleX` growth for perspective, fading in and out at both ends. Nothing in the water drifts horizontally — that is what previously made the ocean read as a river. The crests are authored **wider than the viewBox** (starting at negative x) so the sub-1 `scaleX` at the start of the roll never exposes a gap at the edges. `.foam` at the waterline laps up the sand and back on its own cycle.
- The **sun's reflection and all 21 glints** are authored around `x=790` and wrapped in `<g class="sun-reflection" transform="translate(…)">`, so the sun can be moved by editing one number instead of 21. The sun sits *on* the horizon on purpose — a few pixels higher and it washes out completely against the orange sky.

All motion is `transform`/`opacity` only and is killed under `@media (prefers-reduced-motion: reduce)`, where glints hold at a mid opacity and the swells take fixed offsets, so the water still reads as sunlit and layered when nothing is moving.

### Hoverable sand props
The crab, starfish, beach ball, shells and seaweed each play a one-shot animation on hover. Three things make that work, and all three are load-bearing:

1. **`.sky` is `pointer-events: none`** (with `.sky-cloud` opting back in), or it would swallow every hover before it reached the scene. `.beach-backdrop` is `z-index: 0` rather than `-1` for the same reason — a negative layer sits behind the propagated body background.
2. **`.interactive` re-enables hit testing** on individual props inside the otherwise `pointer-events: none` backdrop, and carries an invisible `<circle … fill="none" pointer-events="all">`, since the painted geometry alone is too thin to hover.
3. **The hit circle sits outside the animated `.prop` group.** `:hover` is read on the static `.interactive` wrapper. If the moving group owned the hit area, a prop that leaps away from the pointer would drop the hover, snap back, and retrigger in a flicker loop.

Props that already have an idle animation (crab, seaweed) keep it on the outer group and take the hover animation on the nested `.prop`, so the two never fight over `transform`. The animations use a single iteration, so they settle even while the pointer stays put and replay on the next hover. `skyNav.js` adds `.is-playing` on non-mouse `pointerdown` for the touch path. The props are deliberately **not focusable**: they are decorative and live inside the `aria-hidden` backdrop, where a focusable element would be worse than an unreachable easter egg.

### Styling
All styles are in a single [public/styles.css](public/styles.css). Some feedback-list markup is styled inline within template strings in feedbackFunctions.js.

**Constraints when restyling:**

1. **The auth DOM contract.** [authEvents.js:20](public/scripts/authEvents.js#L20) reads `centerContainer.style.justifyContent` with **no null guard** — if `.center-container` is missing, that line throws and *every* signup/login/logout handler silently fails to bind. `#feedbackSection` and `#logoutButton` must also keep `display: none` as their **CSS default**, because both scripts toggle them via inline `style.display`. Keep every id in that pane verbatim.
2. **Cards are frosted glass** (`backdrop-filter`), so text uses `var(--ink)` / `var(--ink-soft)`, not white. The `@supports not (backdrop-filter…)` fallback swaps in opaque backgrounds — keep new translucent surfaces listed there.
3. **The panel is the only glass surface** for section content. `.about-me` / `.portfolio` / `.resume` / `.contacts` deliberately have no background or blur of their own; stacking glass on glass looks muddy and doubles GPU cost.
4. **Cloud layout is responsive in three tiers**: absolute `--x/--y/--w` on desktop, a 2-2-1 two-column grid under 860px wide, and a single row of five under 520px tall. Five clouds at a tappable size total more height than the sky has above the horizon, which is why the phone layout can't just stack them. The `max-height` block must use `.sky-cloud[data-section=…]` for `top`, to outrank the width-based block that also matches at that size.
5. `--zoom-ms` in styles.css and `CLOSE_MS` in skyNav.js must be retuned together; the script hides the overlay on a timer.

## Deployment

Two GitHub Actions workflows both trigger on push to `main`:
- [firebase-hosting-merge.yml](.github/workflows/firebase-hosting-merge.yml) — deploys to Firebase Hosting (project `personal-website-de16c`).
- [static.yml](.github/workflows/static.yml) — deploys the repo to GitHub Pages.

A third workflow deploys Firebase preview channels on pull requests.

## Notes

- Firebase config (including the web API key) is committed in both index.html and firebase.js. This is expected for Firebase web apps — the key is a public client identifier, and access is controlled by Firestore/Auth security rules (not present in this repo).
- The README lists security features (DOMPurify sanitization, CORS/CSRF, rate limiting). Verify before relying on any of these: DOMPurify is loaded via CDN in index.html but is not currently invoked in the scripts, and the rate limiter lives only in the non-deployed `server.js`.
- A `<noscript>` block in index.html falls back to a plain stacked document, since without JS the cloud navigation cannot open anything.
- The README still describes the old vertical-scroll layout with a nav bar; it has not been updated for the cloud navigation.
