/**
 * Her content in this browser: Moments, the paused moment (only when she taps
 * "Save this step for later"), and the story rotation. Nothing is written
 * unless she chooses. Where it's kept is CONFIG.storage (js/config.js).
 */
import { contentStorage as kv } from '../lib/storage.js';

const K = { moments: 'known.moments.v1', session: 'known.paused.v1', rotation: 'known.rotation.v1' };

export const store = {
  persistent: kv.persistent,
  moments: {
    list: () => (kv.get(K.moments) || []).slice().sort((a, b) => b.createdAt - a.createdAt),
    get: (id) => (kv.get(K.moments) || []).find((m) => m.id === id) || null,
    add(m) {
      kv.set(K.moments, [...(kv.get(K.moments) || []), m]);
    },
    remove(id) {
      kv.set(
        K.moments,
        (kv.get(K.moments) || []).filter((m) => m.id !== id),
      );
    },
    update(id, patch) {
      kv.set(
        K.moments,
        (kv.get(K.moments) || []).map((m) => (m.id === id ? { ...m, ...patch, id } : m)),
      );
    },
    count: () => (kv.get(K.moments) || []).length,
  },
  session: {
    get: () => kv.get(K.session),
    set: (p) => kv.set(K.session, p),
    clear: () => kv.remove(K.session),
  },
  rotation: {
    getAll: () => kv.get(K.rotation) || {},
    put(sel, entry) {
      kv.set(K.rotation, { ...(kv.get(K.rotation) || {}), [sel]: entry });
    },
  },
  wipe() {
    for (const k of Object.values(K)) kv.remove(k);
  },
};
