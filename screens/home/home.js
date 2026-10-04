/**
 * Home: Begin (straight to Feel), Your Moments (a count only), the privacy
 * line, and the quiet "With someone I trust" link. A paused moment shows a
 * card and, once per visit, the Recover sheet.
 */
import { $, fill } from '../../js/lib/dom.js';
import { t, tc, localizeDigits } from '../../js/i18n.js';
import { C } from '../../js/content.js';
import { prefs, setPrefs } from '../../js/state/prefs.js';
import { store } from '../../js/state/store.js';
import { daysLeft, loadPaused } from '../../js/state/session-store.js';
import { beginSession } from '../../js/nav.js';
import { button, notice, noteLine, tile } from '../../js/components/ui.js';
import { openSheet, onSheetClose } from '../../js/components/sheet.js';
import { go } from '../../js/router.js';

let recoverOffered = false; // once per page load

export default {
  tabs: true,
  mount(view) {
    view.header({});
    const b = view.body;
    fill($('[data-slot=private]', b), noteLine(t('w_private'), 'lock'));
    fill($('[data-slot=together]', b), button(t('mode_together'), () => beginSession(true), { kind: 'quiet', id: 'with-someone' }));

    const moments = button('', () => go('moments'), { kind: 'plain', id: 'your-moments' });
    view.actions(
      button(t('begin'), () => (loadPaused() ? openSheet('recover') : beginSession(false)), { id: 'begin' }),
      moments,
    );

    const draw = () => {
      const n = store.moments.count();
      moments.querySelector('span').textContent = n ? `${t('your_moments')} (${localizeDigits(n)})` : t('your_moments');
      const p = loadPaused();
      const slot = $('[data-slot=paused]', b);
      slot.hidden = !p;
      fill(slot, p ? tile({ title: t('recover_continue'), sub: tc('removes_in', daysLeft(p.ts)), ic: 'pause', id: 'paused-card', onClick: () => openSheet('recover') }) : null);
      return p;
    };
    const p = draw();

    // The one-time "removed after 3 days" line: shown once, then it goes away by itself.
    if (prefs().removedNotice) {
      setPrefs({ removedNotice: false });
      const slot = $('[data-slot=notice]', b);
      fill(slot, notice(tc('paused_removed', Math.round(C.pauseTtlMs / 86_400_000)), null, 'removed-notice'));
      slot.hidden = false;
      setTimeout(() => slot.remove(), 12_000);
    }

    if (p && !recoverOffered) {
      recoverOffered = true;
      openSheet('recover');
    }
    return onSheetClose(draw);
  },
};
