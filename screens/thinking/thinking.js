/**
 * Thinking: matches her words to a story. The crisis check runs first, on
 * this device. A crisis phrase (or the relay's risk flag) → Crisis.
 */
import { $, fill } from '../../js/lib/dom.js';
import { t, currentLang } from '../../js/i18n.js';
import { isPathKey } from '../../js/content.js';
import { session, update } from '../../js/state/session-store.js';
import * as S from '../../js/state/session.js';
import { saidCard } from '../../js/components/ui.js';
import { match, matchLocal } from '../../js/services/matcher.js';
import { replace } from '../../js/router.js';

export default {
  session: true,
  center: true,
  mount(view) {
    view.header({ inSession: true, step: 1 });
    const text = session().words.trim();
    fill($('[data-slot=said]', view.body), saidCard(t('you_said'), text));
    let alive = true;
    // A short pause so the screen is readable, then the match (never stuck: errors fall back to the phone matcher).
    const started = Date.now();
    match(text, currentLang())
      .catch(() => matchLocal(text))
      .then(async (r) => {
        const wait = 900 - (Date.now() - started);
        if (wait > 0) await new Promise((res) => setTimeout(res, wait));
        if (!alive || !session() || session().screen !== 'thinking') return;
        const { result, crisis } = S.acceptMatch(r, isPathKey);
        update((x) => ({ ...S.openStory(x, { from: 'words', sel: null, path: result.key, ai: result }), crisis }));
        replace(crisis ? 'crisis' : 'scripture');
      });
    return () => (alive = false);
  },
};
