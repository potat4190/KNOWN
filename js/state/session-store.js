/**
 * The live session around the pure functions in ./session.js, plus the side
 * effects: the rotation draw, saving a Moment once, pause / recover / the
 * 3-day cleanup. Nothing autosaves: a session is written down only when she
 * taps "Save this step for later". Ported from src/state/session-store.ts.
 */
import { C, selKey } from '../content.js';
import { draw } from '../services/rotation.js';
import { setPrefs, resetKeepLanguage } from './prefs.js';
import { store } from './store.js';
import * as S from './session.js';

let current = null; // the session, or null outside one
let stack = []; // session screens she has open, oldest first (restored on Continue)
const listeners = new Set();

export const session = () => current;
export const sessionStack = () => stack;

export function onSession(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
const emit = () => listeners.forEach((fn) => fn(current));

/** Apply a pure update to the session. */
export function update(fn) {
  if (!current) return;
  current = fn(current);
  emit();
}

export function startSession(lang, guided = false) {
  current = S.freshSession(lang, guided);
  stack = ['feel'];
  emit();
}

export function endSession() {
  current = null;
  stack = [];
  emit();
}

/** Records the screen she is on (step dots, pause, recover). */
export function focusScreen(screen) {
  if (!current) return;
  const i = stack.indexOf(screen);
  stack = i >= 0 ? stack.slice(0, i + 1) : [...stack, screen];
  current = { ...current, screen };
}

export const now = () => Date.now();

/* ------------------------------ Rotation ------------------------------ */

/** Picks the story for her pictures and advances the rotation. Only when the story opens. */
export function openPictures() {
  if (!current || !current.pics.length) return null;
  const sel = selKey(current.pics);
  const all = store.rotation.getAll();
  const primary = C.matrix[sel].path;
  const { path, entry } = draw(all[sel], primary, C.rotation[sel] ?? [primary]);
  store.rotation.put(sel, entry);
  update((x) => S.openStory(x, { from: 'pics', sel, path }));
  return path;
}

/* ------------------------------ Keep ------------------------------ */

const newId = () => 'm' + now().toString(36) + Math.random().toString(36).slice(2, 6);

/** Saves the Moment once. A second call (double tap, Back from Done) does nothing. */
export function saveMoment(lang, msgText) {
  const s = current;
  if (!s || !S.canSave(s)) return null;
  const m = S.buildMoment(s, { id: newId(), now: now(), lang, msgText });
  update((x) => ({ ...x, savedMomentId: m.id })); // mark first, so a second tap can't save again
  store.moments.add(m);
  store.session.clear();
  return m;
}

/* -------------------------- Pause and recover -------------------------- */

/** "Save this step for later": the only way a session is ever written down. */
export function pauseSession() {
  if (!current) return;
  store.session.set({ ts: now(), state: current, hist: stack });
  endSession();
}

/** Deletes a paused session older than 3 days. Returns true if one was removed. */
export function cleanupPaused() {
  const p = store.session.get();
  if (p && now() - p.ts >= C.pauseTtlMs) {
    store.session.clear();
    setPrefs({ removedNotice: true });
    return true;
  }
  return false;
}

export function loadPaused() {
  cleanupPaused();
  return store.session.get();
}

/** Days left before the paused moment is removed (at least 1). */
export const daysLeft = (ts) => Math.max(1, Math.ceil((C.pauseTtlMs - (now() - ts)) / 86_400_000));

/** Continue: restore the full state and step, then delete the stored copy. Never restarts its clock. */
export function resumePaused() {
  const p = loadPaused();
  if (!p) return null;
  store.session.clear();
  stack = p.hist?.length ? p.hist : ['feel'];
  current = { ...p.state, screen: stack[stack.length - 1] };
  emit();
  return stack;
}

/** Start a new one: deletes the paused moment. */
export function discardPaused() {
  store.session.clear();
}

/* ---------------------------- Delete everything ---------------------------- */

export function deleteEverything() {
  store.wipe();
  endSession();
  resetKeepLanguage();
}
