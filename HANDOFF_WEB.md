# Handoff: KNOWN website + bug fixes + YouVersion (for Claude Code)

> Claude Code is started in `C:\Users\rhida\Desktop\KNOWN-webapp` (the GitHub Pages repo). The app's
> source lives next door in `C:\Users\rhida\Desktop\KNOWN` (`..\KNOWN` from here): add it with
> `/add-dir ..\KNOWN`. Most code changes happen THERE; this folder only receives the generated site.
> `npm run web:export` (run in `..\KNOWN`) replaces everything here except `.git`, `.github`,
> `.claude`, `CLAUDE.md` and `HANDOFF_WEB.md`. Copies of this file live in both folders.

Written 2026-10-04 by a Claude session that reviewed the app and built the web version from a cloud
sandbox. That sandbox could NOT reach YouVersion, GitHub Pages or a real phone, so nothing here was
verified live. You run on Rhidaya's PC and can: verify everything for real.

---

## 1. The product (short)

KNOWN is an in-the-moment Scripture experience for someone carrying something she can't put into
words (first persona: Esther, a Christian international student separated from her family by
conflict). Flow: Feel (pick 1–2 pictures, or her own words, or "I don't have the words") →
Scripture (a person in Scripture who carried something similar + the actual passage) → Pray (tap a
line that stays with her; editable prayer) → After (Keep / Reach out / Sit a little longer / Finish).
Empathy first, then prayer.

Team: Dorcas (product, voice), Deb (Scripture research), Ben (flows), Kezia (safeguarding),
Rhidaya (build lead, the person you're working with).

Deadline: 2026 Gloo AI Hackathon, Bible track, **October 6–8** (Boulder). Preliminary submission
(90-second demo video of the working app) due **9:00 p.m. Mountain, October 7**. Judges score AI use,
and the Bible track wants YouVersion as the core Scripture layer. Time is short: prioritise what
makes the demo work.

### Hard boundaries (never break)
1. The app never names her emotions to her (picture keys S/F/A/J are internal; judge panel only).
2. AI never interprets, quotes or paraphrases Scripture. It only picks a story key from the reviewed
   library and writes one warm sentence.
3. Scripture is never machine-translated (bundled public-domain editions or YouVersion only).
4. Story summaries are labelled "In our words, from {ref}", never styled as Scripture.
5. No forced disclosure; nothing saved unless she chooses; KNOWN never sends a message for her.
6. Not a habit app: no streaks, nudges, analytics.
7. Help is one tap away on every screen.

Content rules: `src/content/` is GENERATED from `reference/KNOWN_Design_Lab.html` by
`scripts/extract-design-lab.ts` — never hand-edit it. Reviewed fixes go in
`scripts/content-overrides.json`; new UI copy goes in `src/i18n/drafted.ts` (all 5 languages,
marked drafted) and is listed in `docs/CONTENT_REVIEW.md`. Time-neutral copy ("today", never
"tonight"). Every control works or isn't shown.

Docs to read: `AGENTS.md` (Expo rules: SDK 56, check versioned docs, `npx expo install`),
`README.md`, `docs/STATUS.md`, `docs/DECISIONS.md`, `docs/DEMO.md`, `docs/QA.md`, `e2e/README.md`.

---

## 2. Repos, accounts, machine

| What | Where |
|---|---|
| Phone app (source of truth) | `C:\Users\rhida\Desktop\KNOWN` (git; no remote yet as of 2026-10-03 — check) |
| Website output (GitHub Pages repo) | `C:\Users\rhida\Desktop\KNOWN-webapp` → https://github.com/potat4190/KNOWN (public) |
| Intended live URL | https://potat4190.github.io/KNOWN/ (check the exact case of the repo name) |
| Expo / EAS | account `rhidayas-team`, project `@rhidayas-team/known`, projectId `547daba6-e339-40f0-ac3a-1adb31aea3f1` (now in `app.config.ts`) |
| YouVersion app key | `.env` → `EXPO_PUBLIC_YOUVERSION_APP_KEY` (works per `npm run yv:versions` on 2026-10-03) |
| AI relay | `relay/` Cloudflare Worker, NOT deployed; `EXPO_PUBLIC_AI_RELAY_URL` empty → on-device matcher only, Translate hidden |
| Windows build notes | C: is nearly full. JDK 17, Gradle home, NDK, Maestro live on `E:\KNOWN-build` (see README). |

EAS cloud builds don't read `.env`: the key must be added with
`npx eas-cli@latest env:create --name EXPO_PUBLIC_YOUVERSION_APP_KEY --value <key> --environment <development|preview> --visibility plaintext`.
Rhidaya was mid-way through his first EAS development build when this was written.

---

## 3. What happened in the previous session (chronological)

1. **Review of the app** (all 288 Jest tests, typecheck, lint, content validator passed). Findings —
   still open unless your latest commits fixed them (check `git log`; commits `cc33cf3`, `9720335`,
   `257cba9` came from the first Android device run and may cover some):
   - **Crisis gaps**: with no relay, these skip the Crisis screen: "I don't want to be here anymore",
     "I can't go on", "nobody would miss me", "I want to disappear". (Caught: "I want to die",
     "I might hurt myself tonight", 想死, 死にたい, أريد أن أموت.) `src/config/crisis-extra.ts` is a
     DRAFTED list for Kezia — add phrases there (status stays drafted), never edit `src/content/crisis.ts`.
   - **Silent memory-only storage**: if the SQLCipher DB fails to open (e.g. SecureStore key lost while
     the DB file exists → a new key is generated → fails every launch), `store.ts` falls back to memory
     but Done still says "Saved to Moments on this phone". Recreate the DB when the key is missing;
     otherwise tell her honestly.
   - **Judge-panel clock**: `now()` applies `clockOffset` even after the panel is switched off (and it
     persists in MMKV) → future dates, early expiry, invisible in the "clean" view.
   - **Tips/coach marks**: the scrim blocks taps on Feel; 6 "Got it" taps before After on first use;
     the Scripture tip's spotlight lands on the Continue button when the target is below the fold
     (`measureTarget` returns off-screen rects). Brief says a tip must never cover the primary button.
   - **`Screen.tsx` Rise keys**: `key={i}` over filtered children re-keys on conditional content →
     re-animation/overlap (visible on Reach out when picking another reader language).
   - **Double taps**: Feel Continue (`openPictures`) and Keep Save (`saveMoment`) lack an in-flight
     guard → rotation advanced twice / two Moments possible on slow storage.
   - **Keep → "Finish without saving"** discards an edited prayer/words/message without confirming.
   - **Arabic references** render "4–1:2" (bidi). Fix: wrap the numbers in U+2066…U+2069 for RTL.
   - **`findNodeHandle`** for accessibility focus (deprecated on New Architecture; crashes on web).
     Already replaced by `src/lib/a11y-focus(.web).ts` — verify TalkBack/VoiceOver focus still moves.
   - **Maestro**: `fresh-start.yaml` skipped the cards but not the tips (commit 257cba9 may have fixed).
   - Team decisions, DON'T change, just keep listed in CONTENT_REVIEW: bridge headings SF.h/FJ.h say
     "afraid" (boundary 1); local matcher sends "my phone battery died" to Mary (Design Lab rule).
   - Relay: the in-memory rate limiter is best effort; put a spending cap on the API key before deploying.

2. **A hand-written HTML/CSS/JS web version** was built in KNOWN-webapp and pushed (commit `1b17902`
   in KNOWN-webapp). Rhidaya then required the web to match the app 100%, so it was **replaced**.

3. **Current approach: the website is built from this app's own code** (`expo export --platform web`).
   Changes made in KNOWN (uncommitted when this was written — review and commit them):
   - New web-only files (Metro picks `*.web.*` for web; phones never use them):
     - `src/data/sql-store.web.ts` — Store in localStorage (`known.web.moments.v1`, `…paused.v1`,
       `…rotation.v1`), `encrypted: false`.
     - `src/state/kv.web.ts` — prefs in localStorage.
     - `src/components/Sheet.web.tsx` — bottom sheet on RN `Modal` (gorhom doesn't size in browsers);
       `locked` sheets ignore Escape/backdrop.
     - `src/i18n/direction.web.ts` — RTL via `<html dir>`; "restart" = `location.assign(EXPO_BASE_URL + '/')`.
     - `src/lib/a11y-focus.web.ts` — focus the element (no findNodeHandle).
   - Shared changes (phone behaviour unchanged): `src/i18n/direction.ts` (I18nManager + reload moved
     here), `src/i18n/index.ts` and `src/components/Icon.tsx` use it, `src/components/bits.tsx` and
     `src/features/tour/TourProvider.tsx` use `focusForAccessibility`.
   - `app.config.ts`: `web.output: 'single'`; `experiments.baseUrl` from `WEB_BASE_URL`; `owner` +
     `extra.eas.projectId` added for EAS.
   - `scripts/export-web.ts` + `npm run web:export [-- --out <dir> --base /<repo>]`: exports to
     `dist-web/`, copies `index.html` → `404.html` (deep links on Pages), writes `.nojekyll` and a
     README, then replaces everything in `../KNOWN-webapp` except `.git`. `dist-web/` is gitignored.
   - README section "Web version (GitHub Pages)".
   - Jest 288/288, typecheck and lint passed after these changes.
   - The new export was copied into KNOWN-webapp (old files deleted) but **not committed or pushed**
     at the time of writing.

4. **What was tested (in a sandbox Chromium, served under `/KNOWN/` with GitHub-Pages-like 404
   fallback)**: first run, golden path to Moments, Doesn't-fit sheet with edited-prayer confirm, ✕
   sheet, pause → reload → Recover (locked) → Continue, judge panel (all sections), own words (local
   match → Nehemiah), crisis → Help, Sit, Moment detail + delete, Delete everything, Arabic RTL via
   Settings (reload), dark mode, deep link `/KNOWN/moments`.
   **Not tested**: anything needing the network — YouVersion (API, SDK `BibleTextView`, Bible version
   picker; the SDK's font fetch failed in the sandbox), Google Fonts, the live GitHub Pages site, and
   real phones / Safari.

5. Known web-only quirk: Settings shows "Version 1.0.0 (development)" because `.env`
   `APP_VARIANT=development` overrides the export script's `preview`.

---

## 4. YouVersion status
- Code: `src/services/scripture/scripture.ts` (preflight `GET /v1/bibles/{id}` + passage within 3 s,
  else bundled), `useScripture.ts`, `PageCard.tsx` (`BibleTextView`), `app/reader.tsx`,
  `app/(tabs)/more.tsx` (`BibleVersionPickerSheet`, shown only when `useYvKeyOk()`).
- `src/config/bible-versions.ts` maps every language to `null` → YouVersion text never shows by
  default; the pill is hidden. **Ask Rhidaya** which ids to use. Candidates (docs/STATUS.md): en 206
  WEBUS (same translation as bundled WEBBE) · ja 81 JA1955 (same edition as bundled) · zh 43 CSBS /
  312 CSBT · ar 195 · my none for this key (stays Judson 1835).
- Web: unknown whether api.youversion.com allows browser (CORS) requests, and whether the SDK's DOM
  components work in a static export. If CORS blocks: add a `/bible` proxy route to the relay Worker
  (key as a Worker secret; also keeps the key out of the public site) and a `*.web.ts` scripture
  fetch that uses it. The key in `.env` is otherwise built into the public site's JS.

---

## 5. Open team decisions (don't decide silently)
YouVersion ids per language · relay default provider (Gloo vs Claude) and deployment · which build is
demoed · Kezia: help-line verification, crisis-extra phrases, test-set · Dorcas/Deb: drafted strings,
overrides · licence · app icon/splash (placeholders).
