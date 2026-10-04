/**
 * Her own words → a story. Order (as in the phone app):
 *  1. the crisis check on this device (always, before anything leaves it)
 *  2. the AI relay, if CONFIG.relayUrl is set (8 s timeout)
 *  3. otherwise, or if the relay fails, the on-device keyword matcher
 * The relay's "feelings" are used only internally and never shown or stored.
 */
import { CONFIG } from '../config.js';
import { isPathKey, C } from '../content.js';

let RULES = null;
const toRe = (r) => new RegExp(r.source, r.flags);

export async function loadRules() {
  if (!RULES) {
    const res = await fetch('data/rules.json');
    const j = await res.json();
    RULES = {
      crisis: toRe(j.crisis),
      crisisExtra: toRe(j.crisisExtra),
      story: j.story.map((r) => [r.key, toRe(r)]),
      mood: j.mood.map((r) => [r.key, r.feeling, toRe(r)]),
    };
  }
  return RULES;
}

/** The reviewed regex plus the drafted extra phrases (pending safeguarding review). */
export const isCrisis = (text) => RULES.crisis.test(text) || RULES.crisisExtra.test(text);

/** The on-device matcher: keyword rules per story (first match wins), then mood words → matrix. */
export function matchLocal(text) {
  const s = text.toLowerCase();
  for (const [k, re] of RULES.story)
    if (re.test(s)) return { key: k, confidence: 0.6, reason: '', feelings: [], risk: false, source: 'local' };
  const hit = RULES.mood.filter((m) => m[2].test(s));
  if (hit.length) {
    const picks = hit.slice(0, 2).map((m) => m[0]);
    const sel = C.order.filter((k) => picks.includes(k)).join('');
    return {
      key: C.matrix[sel].path,
      confidence: 0.5,
      reason: '',
      feelings: hit.slice(0, 2).map((m) => m[1]),
      risk: false,
      source: 'local',
    };
  }
  return { key: null, confidence: 0, reason: '', feelings: [], risk: false, source: 'local' };
}

async function post(path, body, ms) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(`${CONFIG.relayUrl.replace(/\/+$/, '')}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export const relayAvailable = () => !!CONFIG.relayUrl;

export async function match(text, lang) {
  await loadRules();
  const risky = isCrisis(text);
  if (relayAvailable()) {
    try {
      const r = await post('/match', { text: text.slice(0, 1200), lang }, 8000);
      const key = isPathKey(r.key) ? r.key : null;
      return {
        key,
        confidence: key ? Math.max(0, Math.min(1, Number(r.confidence) || 0)) : 0,
        reason: String(r.reason ?? '').slice(0, 240),
        feelings: Array.isArray(r.feelings) ? r.feelings.slice(0, 2).map(String) : [],
        risk: !!r.risk || risky,
        source: 'ai',
      };
    } catch {
      /* fall through to the on-device matcher */
    }
  }
  const out = matchLocal(text);
  out.risk = out.risk || risky;
  return out;
}

/** Translation + back-translation via the relay. Throws when unavailable. */
export async function translateMessage(text, from, to) {
  if (!relayAvailable()) throw new Error('unavailable');
  const r = await post('/translate', { text: text.slice(0, 1500), from, to }, 12000);
  const out = { translation: String(r?.translation ?? ''), back: String(r?.back ?? '') };
  if (!out.translation) throw new Error('empty');
  return out;
}
