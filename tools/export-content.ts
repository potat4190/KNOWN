/**
 * Copies KNOWN's reviewed content from the phone app into this web app.
 *
 * Run from the phone app's folder (it uses the app's own TypeScript setup):
 *   cd ../KNOWN
 *   npx tsx ../KNOWN-webapp/tools/export-content.ts
 *
 * Writes data/*.json and img/. Never hand-edit those: change the content in
 * the phone app (scripts/content-overrides.json or src/i18n/drafted.ts) and
 * run this again.
 */
import { cpSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const APP = process.cwd();
const WEB = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const app = (p: string) => join(APP, p);
/** import() needs a file:// URL (plain C:\\ paths fail on Windows). */
const load = (p: string, opts?: ImportCallOptions) => import(pathToFileURL(app(p)).href, opts);

async function main() {
  // Read the generated JSON directly (src/lib/content.ts also pulls in image require() calls).
  const json = async (f: string) => (await load(`src/content/${f}`, { with: { type: 'json' } })).default;
  const matrix = await json('matrix.json');
  const steps = await json('steps.json');
  const C = {
    PASSAGES: await json('passages.json'),
    BOOKS: await json('books.json'),
    VERSIONS: await json('versions.json'),
    BREATH: await json('breath.json'),
    ORDER: matrix.order,
    MATRIX: matrix.matrix,
    NW: matrix.nw,
    ALT: await json('alt.json'),
    LAMENTS: await json('laments.json'),
    ROTATION: await json('rotation.json'),
    STORY_CHAPTERS: await json('story-chapters.json'),
    STEP_DOT: steps.dot,
    STEP_NAME: steps.stepName,
    PATHS: {} as Record<string, unknown>,
    BRIDGES: {} as Record<string, unknown>,
  };
  const { buildResources } = await load('src/i18n/resources.ts');
  const { LANGS, LANG_INFO } = await load('src/i18n/langs.ts');
  const { CRISIS } = await load('src/content/crisis.ts');
  const { CRISIS_EXTRA, CRISIS_EXTRA_STATUS } = await load('src/config/crisis-extra.ts');
  const { STORY_RULES, MOOD_RULES } = await load('src/content/matcher-rules.ts');
  const { HELP_LINES, LOCAL_EMERGENCY } = await load('src/config/help-lines.ts');
  const { PAUSE_TTL_MS } = await load('src/config/privacy.ts');

  for (const l of LANGS) {
    C.PATHS[l] = await json(`paths.${l}.json`);
    C.BRIDGES[l] = await json(`bridges.${l}.json`);
  }

  const re = (r: RegExp) => ({ source: r.source, flags: r.flags });
  const out = join(WEB, 'data');
  mkdirSync(out, { recursive: true });
  const write = (name: string, v: unknown) => writeFileSync(join(out, name), JSON.stringify(v) + '\n');

  // Shared content (every language).
  write('content.json', {
    passages: C.PASSAGES,
    books: C.BOOKS,
    versions: C.VERSIONS,
    breath: C.BREATH,
    order: C.ORDER,
    matrix: C.MATRIX,
    nw: C.NW,
    alt: C.ALT,
    laments: C.LAMENTS,
    rotation: C.ROTATION,
    storyChapters: C.STORY_CHAPTERS,
    stepDot: C.STEP_DOT,
    stepName: C.STEP_NAME,
    langs: LANGS.map((l: string) => ({ code: l, ...LANG_INFO[l] })),
    pauseTtlMs: PAUSE_TTL_MS,
  });

  // One file per language: UI strings (reviewed, then drafted fill-ins and plural keys), stories, bridges.
  const res = buildResources();
  for (const l of LANGS) write(`lang.${l}.json`, { strings: res[l].translation, paths: C.PATHS[l], bridges: C.BRIDGES[l] });

  // Matching rules and Help lines.
  write('rules.json', {
    crisis: re(CRISIS),
    crisisExtra: { ...re(CRISIS_EXTRA), status: CRISIS_EXTRA_STATUS },
    story: STORY_RULES.map(([k, r]: [string, RegExp]) => ({ key: k, ...re(r) })),
    mood: MOOD_RULES.map(([k, f, r]: [string, string, RegExp]) => ({ key: k, feeling: f, ...re(r) })),
  });
  write('help-lines.json', { lines: HELP_LINES, localEmergency: LOCAL_EMERGENCY });

  // Illustrations.
  for (const d of ['pictures', 'scenes']) cpSync(app(`assets/images/${d}`), join(WEB, 'img', d), { recursive: true });

  console.log(`Exported content for ${LANGS.length} languages to ${out}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
