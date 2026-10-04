# KNOWN — web test build

A web version of KNOWN for peer testing, hosted on GitHub Pages. It follows the phone app (`KNOWN/`) screen for screen: Feel → Scripture → Pray → After, with Keep, Reach out, Sit, Moments, pause and recover, Help, five languages and Arabic right to left.

Plain HTML, CSS and JavaScript. No framework and no build step: GitHub Pages serves these files as they are.

## Structure

```
index.html                 the shell: header, screen, sticky actions, tabs, sheet layer
css/
  tokens.css               colours (light/dark), type scale, per-language fonts
  base.css                 reset, page layout, type, motion
  components.css           buttons, tiles, chips, cards, page card, sheet, tabs…
js/
  app.js                   boot: loads content, language, theme; starts the router
  router.js                #/feel, #/scripture… → loads screens/<name>/
  config.js                ← settings for this build (storage, relay, feedback link, banner)
  i18n.js                  t(), plurals, Burmese digits, <html lang/dir>
  content.js               the content pack and its helpers (ref, verses, bridges…)
  nav.js                   begin / leave a moment
  state/
    session.js             the moment's rules (pure functions, ported from the app)
    session-store.js       the live moment: rotation, save once, pause/recover, 3-day cleanup
    store.js               Moments, paused moment, rotation in browser storage
    prefs.js               language, theme, tips
  services/                rotation, matcher (crisis check + own words), copy/share
  components/              header, page card, picture grid, help lines, sheet, tips, icons, ui
  lib/                     DOM and storage helpers
screens/<name>/            one folder per screen: <name>.html, <name>.css, <name>.js
sheets/<name>/             Stop for now (exit), Doesn't fit (nofit), Recover
data/                      GENERATED content (Scripture, copy, matrix, rules, help lines)
img/                       GENERATED illustrations
tools/export-content.ts    copies data/ and img/ from the phone app
```

A screen's `.html` holds its markup, with `data-t="key"` for translated text. Its `.js` exports `mount(view)`, which fills in the dynamic parts and sets the header and the sticky buttons.

## Run it on your computer

ES modules don't load from `file://`, so serve the folder:

```bash
cd KNOWN-webapp
python -m http.server 8080      # or: npx serve .
```

Then open http://localhost:8080.

## Put it on GitHub Pages

1. Push this folder to the repo's `main` branch (see "First push" below).
2. On GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `main`, folder `/ (root)` → Save**.
3. After a minute or two the site is at **https://potat4190.github.io/KNOWN/**. Share that link with testers.

Every push to `main` updates the site.

### First push

```bash
cd KNOWN-webapp
git init -b main
git add .
git commit -m "KNOWN web test build"
git remote add origin https://github.com/potat4190/KNOWN.git
git push -u origin main
```

## Settings (`js/config.js`)

| Setting | What it does |
|---|---|
| `storage` | `'local'` keeps Moments and a paused moment in this browser until deleted; `'session'` forgets them when the tab closes. Never encrypted on the web. |
| `relayUrl` | The phone app's AI relay. Empty = own words use the on-device matcher and Translate is hidden. If set, the relay must allow requests from `https://potat4190.github.io` (CORS). |
| `feedbackUrl` | Adds a "Send feedback" link to the test banner (a Google Form, say). |
| `showTestBanner` | The "Test build" line at the top. |

## Updating the content

`data/` and `img/` come from the phone app and are never edited by hand. After the team changes content in the app (`scripts/content-overrides.json`, `src/i18n/drafted.ts`, help lines, crisis phrases):

```bash
cd KNOWN                                   # the phone app folder
npx tsx ../KNOWN-webapp/tools/export-content.ts
```

Then commit and push `KNOWN-webapp`.

## What's different from the phone app

- **Storage:** browser storage, not the encrypted database. The test banner says so.
- **Bible text:** the built-in public-domain editions only (no YouVersion yet), so there's no "Open in YouVersion" pill or Bible-version setting.
- **Own words:** on-device matching only until a relay is set. Translate is hidden without a relay.
- **Arabic:** the page flips to right to left straight away (no restart).
- **Tips:** a small note in the page, never an overlay, so nothing blocks the pictures or the buttons.
- **Share:** uses the browser's share sheet where it exists (most phones); Copy everywhere.
- **Not included:** music (no tracks yet) and the judge panel.
- **Also fixed here:** Save and Continue ignore double taps; "Finish for now" and "Finish without saving" ask before discarding a prayer, words or a message she typed.

## What to ask testers to try

1. Begin → pick one or two pictures → Continue. Does the Scripture feel connected to what they picked?
2. "This doesn't fit me": try another story or a psalm.
3. Pray: tap a line, change a word of the prayer, Amen.
4. Reach out: change who and what would help; copy the message.
5. Keep → Save → open it in Moments; delete it.
6. ✕ → Save this step for later → close the tab → reopen the link → Continue.
7. My own words (any language). "I don't have the words".
8. Settings → another language (try العربية), and dark mode.
9. Help from any screen.

Ask them not to type anything private: this is a test build.
