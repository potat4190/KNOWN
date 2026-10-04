/**
 * The session: one moment from Feel to Done. Pure functions, ported from the
 * phone app's src/state/session.ts (itself from the Design Lab). Every
 * function returns a new state; side effects live in ./session-store.js.
 */
import { C, P, ref } from '../content.js';

export const SESSION_SCREENS = ['feel', 'thinking', 'crisis', 'scripture', 'pray', 'after', 'reach', 'sit', 'keep'];

export const freshSession = (lang, guided = false) => ({
  screen: 'feel',
  mode: 'pics', // 'pics' | 'words'
  pics: [],
  words: '',
  from: null, // 'pics' | 'nw' | 'words'
  sel: null, // a selection key or 'NW' (internal only)
  path: null,
  ai: null, // { key, confidence, reason, feelings, risk, source, unsure }
  swapped: false,
  seen: [],
  stay: null, // index of the say-line she kept
  prayer: null, // her edited prayer, or null for the pathway's prayer
  msg: { to: 'guide', need: 'listen', lang, text: null, edited: false, tr: null, trFor: null, keep: false },
  keep: { passage: true, stay: true, prayer: true, words: false, msg: true },
  crisis: false,
  savedMomentId: null,
  guided,
});

/* ------------------------------ Feel ------------------------------ */

/** Choose 1–2 pictures; a third tap replaces the oldest; tapping a chosen one clears it. */
export function togglePic(s, k) {
  const i = s.pics.indexOf(k);
  const pics = i >= 0 ? s.pics.filter((p) => p !== k) : [...(s.pics.length >= 2 ? s.pics.slice(1) : s.pics), k];
  return { ...s, pics };
}

/** Opens a story (pictures, no words or own words). Resets everything chosen for a previous story. */
export function openStory(s, { from, sel, path, ai = null }) {
  return {
    ...s,
    from,
    sel,
    path,
    ai,
    seen: [path],
    swapped: false,
    stay: null,
    prayer: null,
    msg: { ...s.msg, text: null, edited: false, tr: null, trFor: null, keep: false },
    keep: { ...s.keep, msg: true },
    savedMomentId: null,
  };
}

export const openNoWords = (s) => openStory(s, { from: 'nw', sel: 'NW', path: C.nw });

/**
 * Own-words result → story (Design Lab acceptance rules). Accept only keys in
 * the content pack; below 0.45 use the internal feelings → matrix with the
 * "ai_start" copy; still nothing → Psalm 77.
 */
export function acceptMatch(r, isKey) {
  const key = r.key && isKey(r.key) ? r.key : null;
  let result = { ...r, key };
  if (!key || r.confidence < 0.45) {
    const FE = { sadness: 'S', fear: 'F', anger: 'A', enjoyment: 'J' };
    const picks = (r.feelings || []).map((f) => FE[String(f).toLowerCase()]).filter(Boolean);
    const fk = C.order.filter((k) => picks.includes(k)).join('');
    const fromFeelings = fk && C.matrix[fk] ? C.matrix[fk].path : null;
    result = r.risk
      ? { ...result, key: C.nw, reason: '' }
      : { ...result, key: fromFeelings || key || C.nw, reason: '', unsure: true };
  }
  return { result, crisis: !!r.risk };
}

/* ---------------------------- Scripture ---------------------------- */

/**
 * The bridge text. The primary story for a selection shows BR[sel].h + BR[sel].p.
 * Any other story (rotation or swap) shows BR[sel].h + that story's own frame,
 * because several bridge lines name a specific person.
 */
export function bridgeFor(s, lang, B) {
  if (!s.path || s.from === 'words') return null;
  const key = s.sel ?? 'NW';
  const primary = key === 'NW' ? C.nw : C.matrix[key].path;
  const b = B(key, lang);
  return { h: b.h, p: s.path === primary ? b.p : P(s.path, 'frame', lang) };
}

/** Options on the Doesn't-fit sheet: a person story (once) and the lament psalms not yet seen. */
export function noFitOptions(s) {
  if (!s.path) return { person: null, psalms: [] };
  const alt = C.alt[s.path] ?? null;
  const person = alt && !s.seen.includes(alt) && !C.laments.includes(alt) ? alt : null;
  const psalms = [C.nw, ...C.laments].filter((k) => k !== s.path && !s.seen.includes(k) && k !== person);
  return { person, psalms };
}

export function swap(s, path) {
  return {
    ...s,
    path,
    seen: [...s.seen, path],
    swapped: true,
    stay: null,
    prayer: null,
    msg: { ...s.msg, text: null, edited: false, tr: null, trFor: null },
  };
}

export const repick = (s) => ({ ...s, pics: [], mode: 'pics', screen: 'feel' });

/* ------------------------------ Pray ------------------------------ */

export const toggleStay = (s, i) => ({ ...s, stay: s.stay === i ? null : i });
export const setPrayer = (s, text) => ({ ...s, prayer: text });

export const currentPrayer = (s, lang) => (s.prayer != null ? s.prayer : s.path ? P(s.path, 'prayer', lang) : '');

/** She changed the prayer text (so swapping or ending must ask first). */
export const prayerEdited = (s, lang) => !!s.path && s.prayer != null && s.prayer !== P(s.path, 'prayer', lang);

export const stayText = (s, lang) => (s.path && s.stay != null ? P(s.path, 'options', lang)[s.stay] ?? null : null);

/** Anything she typed or edited in this moment (confirm before throwing it away). */
export const hasTyped = (s, lang) => prayerEdited(s, lang) || !!s.words.trim() || s.msg.edited;

/* ---------------------------- Reach out ---------------------------- */

/** m_hi + m_body (or m_body2) + m_<need>, in the app language (Design Lab compose()). */
export function compose(s, lang, t, hasKey) {
  if (!s.path) return '';
  const name = P(s.path, 'name', lang);
  const r = ref(s.path, lang);
  const body = hasKey('m_body2') && r.startsWith(name) ? t('m_body2', { ref: r }) : t('m_body', { name, ref: r });
  return [t('m_hi'), body, t(`m_${s.msg.need}`)].join(' ');
}

export const setNeed = (s, need) => ({ ...s, msg: { ...s.msg, need, text: s.msg.edited ? s.msg.text : null } });
export const setMsgText = (s, text) => ({ ...s, msg: { ...s.msg, text, edited: true } });
export const keepMsg = (s) => ({ ...s, msg: { ...s.msg, keep: true }, keep: { ...s.keep, msg: true } });

/* ------------------------------ Keep ------------------------------ */

export const toggleKeep = (s, k) => ({ ...s, keep: { ...s.keep, [k]: !s.keep[k] } });

/** Which Keep rows are shown. */
export function keepRows(s) {
  const rows = ['passage'];
  if (s.stay != null) rows.push('stay');
  rows.push('prayer');
  if (s.from === 'words' && s.words.trim()) rows.push('words');
  if (s.msg.keep) rows.push('msg');
  return rows;
}

export const canSave = (s) => !s.savedMomentId && keepRows(s).some((k) => s.keep[k]);

export function buildMoment(s, { id, now, lang, msgText }) {
  if (!s.path || !s.from) throw new Error('No story to keep');
  const rows = new Set(keepRows(s));
  const want = (k) => rows.has(k) && s.keep[k];
  return {
    id,
    kind: 'moment',
    createdAt: now,
    lang,
    path: s.path,
    sel: s.sel,
    from: s.from,
    passage: want('passage'),
    scriptureSource: 'bundled',
    abbr: C.passages[s.path].text[lang] ? C.versions[lang].abbr : C.versions.en.abbr,
    stay: want('stay') ? stayText(s, lang) : null,
    stayIndex: want('stay') ? s.stay : null,
    prayer: want('prayer') ? currentPrayer(s, lang) : null,
    prayerEdited: want('prayer') && prayerEdited(s, lang),
    words: want('words') ? s.words.trim() : null,
    msg: want('msg') ? msgText : null,
  };
}

/* ------------------------------ Steps ------------------------------ */

export const dotFor = (screen) => C.stepDot[screen] ?? null;
export const stepNameFor = (screen) => C.stepName[screen] ?? 'st_feel';
