/**
 * Preferences: language, theme, first-run guide, tips. Nothing sensitive
 * lives here (no moments, words or rotation). Kept in localStorage.
 */
import { prefsStorage } from '../lib/storage.js';

const KEY = 'known.prefs.v1';
const listeners = new Set();

const defaults = () => ({
  lang: null,
  theme: 'system', // 'system' | 'light' | 'dark'
  tourDone: false,
  tipsOn: true,
  tipsSeen: {},
  /** One-time quiet line on Home after cleanup removed a paused moment. */
  removedNotice: false,
});

let state = { ...defaults(), ...(prefsStorage.get(KEY) || {}) };

export const prefs = () => state;

export function setPrefs(patch) {
  state = { ...state, ...patch };
  prefsStorage.set(KEY, state);
  for (const fn of listeners) fn(state);
}

export function onPrefs(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Delete everything: reset all preferences except the language and the finished guide. */
export function resetKeepLanguage() {
  const { lang, tourDone } = state;
  setPrefs({ ...defaults(), lang, tourDone });
}
