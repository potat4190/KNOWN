/** Recover: Continue restores the full state and step; Start a new one deletes the paused moment. */
import { $, put } from '../../js/lib/dom.js';
import { t, tc } from '../../js/i18n.js';
import { loadPaused, daysLeft, resumePaused, discardPaused } from '../../js/state/session-store.js';
import { stepNameFor } from '../../js/state/session.js';
import { button } from '../../js/components/ui.js';
import { beginSession } from '../../js/nav.js';

export default {
  locked: true,
  eyebrow: () => t('recover_eyebrow'),
  title: () => t('recover_title'),
  mount(body, { close }) {
    const p = loadPaused();
    if (!p) return close();
    const last = p.hist?.[p.hist.length - 1] ?? p.state.screen;
    $('[data-slot=where]', body).textContent = `${t('recover_where2', { step: t(stepNameFor(last)) })} ${tc('removes_n', daysLeft(p.ts))}`;

    put(body, 'continue', button(t('recover_continue'), () => {
      const stack = resumePaused();
      close();
      if (!stack) return;
      // Rebuild the steps behind her, so Back works as it did.
      for (const screen of stack) location.hash = `#/${screen}`;
    }, { id: 'recover-continue' }));
    put(body, 'new', button(t('recover_new'), () => {
      discardPaused();
      close();
      beginSession(false);
    }, { kind: 'plain', id: 'recover-new' }));
  },
};
