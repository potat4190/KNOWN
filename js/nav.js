/** Moving in and out of a moment. */
import { currentLang } from './i18n.js';
import { startSession, endSession } from './state/session-store.js';
import { go, replace } from './router.js';

/** Begin a new moment: straight to Feel (tap 1 of 3 to Scripture). */
export function beginSession(guided = false) {
  startSession(currentLang(), guided);
  go(guided ? 'guided' : 'feel');
}

/** Leave the moment for a screen outside it. */
export function leaveTo(name, { keepSession = false } = {}) {
  if (!keepSession) endSession();
  replace(name);
}

/** Whether the moment that just ended was saved (Done shows "Saved to Moments"). */
let lastSaved = false;
export const setLastSaved = (v) => (lastSaved = v);
export const wasSaved = () => lastSaved;
