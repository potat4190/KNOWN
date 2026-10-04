/**
 * Browser storage, wrapped so a blocked or full storage never breaks the app.
 * Preferences (language, theme, tips) always use localStorage; her content
 * (Moments, a paused moment, rotation) uses CONFIG.storage.
 */
import { CONFIG } from '../config.js';

function make(getArea) {
  const memory = new Map(); // used when the browser refuses storage (private mode, blocked site data)
  let area = null;
  try {
    area = getArea();
    const k = '__known_test__';
    area.setItem(k, '1');
    area.removeItem(k);
  } catch {
    area = null;
  }
  return {
    /** False when the browser refused storage and we're keeping things in memory only. */
    persistent: !!area,
    get(key) {
      try {
        const s = area ? area.getItem(key) : memory.get(key);
        return s ? JSON.parse(s) : null;
      } catch {
        return null;
      }
    },
    set(key, value) {
      const s = JSON.stringify(value);
      try {
        if (area) area.setItem(key, s);
        else memory.set(key, s);
      } catch {
        memory.set(key, s);
      }
    },
    remove(key) {
      try {
        if (area) area.removeItem(key);
      } catch {
        /* ignore */
      }
      memory.delete(key);
    },
  };
}

export const prefsStorage = make(() => window.localStorage);
export const contentStorage = make(() => (CONFIG.storage === 'session' ? window.sessionStorage : window.localStorage));
