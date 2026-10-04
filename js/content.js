/**
 * The content pack (data/content.json + data/lang.<code>.json), with the
 * Design Lab's helpers: P(), B(), range(), ref(), storySource(), hasLang(),
 * verseText(), selKey(), sceneUrl(). Ported from the phone app's src/lib/content.ts.
 */
import { pack, localizeDigits, LANG_INFO } from './i18n.js';

export let C = null; // content.json

export async function loadContent() {
  if (!C) {
    const res = await fetch('data/content.json');
    if (!res.ok) throw new Error(`content: HTTP ${res.status}`);
    C = await res.json();
  }
  return C;
}

export const PATH_KEYS = () => Object.keys(C.passages);
export const isPathKey = (k) => typeof k === 'string' && !!C.passages[k];

/** A story field in `lang`, falling back to English. */
export function P(path, field, lang) {
  return pack(lang)?.paths?.[path]?.[field] ?? pack('en').paths[path][field];
}

/** The bridge sentence for a selection (or 'NW'), falling back to English. */
export const B = (sel, lang) => pack(lang)?.bridges?.[sel] ?? pack('en').bridges[sel];

/** Every verse number in the passage (list, or from–to). */
export function range(p) {
  if (p.list) return p.list.slice();
  const a = [];
  for (let v = p.from; v <= p.to; v++) a.push(v);
  return a;
}

export const bookName = (book, lang) => C.books[book][lang] || C.books[book].en;

/** "Ruth 1:14–18", "Psalm 13:1–2, 5", with localised book name and digits. */
export function ref(path, lang) {
  const p = C.passages[path];
  const r = p.vvText ? `${p.ch}:${p.vvText}` : p.from === p.to ? `${p.ch}:${p.from}` : `${p.ch}:${p.from}–${p.to}`;
  return `${bookName(p.book, lang)} ${isolate(localizeDigits(r, lang), lang)}`;
}

/** In Arabic, keep "1:2–4" in reading order (a left-to-right isolate inside right-to-left text). */
const isolate = (nums, lang) => (LANG_INFO[lang]?.rtl ? `\u2066${nums}\u2069` : nums);

/** The {ref} in "In our words, from {ref}": a reviewed story-chapter override, else the passage chapter. */
export function storySource(path, lang) {
  const o = C.storyChapters[path];
  if (o) {
    const chs = o.from === o.to ? `${o.from}` : `${o.from}–${o.to}`;
    return `${bookName(o.book, lang)} ${isolate(localizeDigits(chs, lang), lang)}`;
  }
  const p = C.passages[path];
  return `${bookName(p.book, lang)} ${isolate(localizeDigits(p.ch, lang), lang)}`;
}

export function hasLang(path, lang) {
  const t = C.passages[path].text[lang];
  return !!t && Object.keys(t).length > 0;
}

/** The bundled edition shown for this passage (English when it isn't in her language). */
export const bundledVersion = (path, lang) => (hasLang(path, lang) ? C.versions[lang] : C.versions.en);

export function verseText(path, v, lang) {
  const tx = C.passages[path].text;
  return tx[lang]?.[String(v)] || tx.en?.[String(v)] || '';
}

/** Chosen pictures in ORDER (S, F, A, J): one of 10 keys. Internal only, never shown. */
export const selKey = (pics) => C.order.filter((k) => pics.includes(k)).join('');

const SCENES = new Set([
  'ps77', 'welcome', 'done', 'neh', 'ruth', 'ps142', 'hab', 'hannah',
  'hagar', 'mary', 'elijah', 'samaritan', 'joseph', 'close',
]);
export const sceneUrl = (key) => `img/scenes/${SCENES.has(key) ? key : 'close'}.jpg`;
export const pictureUrl = (pic) => `img/pictures/${pic}.jpg`;
