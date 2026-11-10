# Saturday League — web app

An installable web app for a four-team Saturday league: fixtures, a match
clock, scoring and a live table. Works offline; add it to the home screen and
it behaves like a native app.

**Live:** https://YOUR-USERNAME.github.io/saturday-league-web/

The iOS version lives in [saturday-league-ios](../saturday-league-ios).

## Install on a phone

Open the link in Safari (or Chrome on Android) → **Share** → **Add to Home
Screen**. It gets its own icon, opens full screen, and keeps working with no
signal.

## What it does

- **Fixtures** — 16 matches over 4 rounds for a 2-hour session, or 20 over 5
  for 2h 30m. Tap any match to referee it.
- **Clock** — a countdown per match, 7 minutes by default. The screen stays
  awake while it runs, and the final whistle is scheduled on the audio clock
  so it still sounds if you switch apps.
- **Full time** — a whistle, a buzz where the phone allows it, and a sheet
  with the final score, then a prompt to start the next match.
- **Table** — points, goal difference, auto-sorted.
- **Setup** — session length, team names and colours, minutes per match,
  league code.
- **Live sharing** (optional) — everyone on the same league code sees the same
  fixtures and results, and watches the running clock from their own phone.
  See [FIREBASE-SETUP.md](FIREBASE-SETUP.md).

Without a league code the app is entirely local: scores live in the browser on
that phone.

## Working on it

`src/saturday-league.html` is the source — one file, no framework, no build
dependencies. `index.html` is generated from it:

    ./build.sh            # rebuild index.html, bump the service worker cache
    ./deploy.sh "message" # commit and push; Pages updates in about a minute

Edit `index.html` directly and the next `./build.sh` will overwrite it — always
edit `src/`.

## Layout

| Path | What it is |
| --- | --- |
| `src/saturday-league.html` | the app: markup, CSS and JavaScript in one file |
| `index.html` | generated — what GitHub Pages serves |
| `manifest.webmanifest` | name, icon and full-screen mode for installing |
| `sw.js` | service worker: app network-first, assets cache-first |
| `firebase-config.js` | live-sharing settings; inert until filled in |
| `icon-*.png` | app icons |
