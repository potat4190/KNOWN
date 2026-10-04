/** After, step 4. "Finish for now" saves nothing and asks first if she typed anything. */
import { $, fill, put } from '../../js/lib/dom.js';
import { t, currentLang } from '../../js/i18n.js';
import { session, discardPaused } from '../../js/state/session-store.js';
import * as S from '../../js/state/session.js';
import { button, tile, confirmBox } from '../../js/components/ui.js';
import { tip } from '../../js/components/tips.js';
import { leaveTo, setLastSaved } from '../../js/nav.js';
import { go, back } from '../../js/router.js';

export default {
  session: true,
  mount(view) {
    const b = view.body;
    view.header({ inSession: true, step: 4, back });
    put(b, 'tip', tip(['after_tiles', 'header_x'], { guided: session().guided }));
    fill(
      $('[data-slot=tiles]', b),
      tile({ title: t('a_keep'), sub: t('a_keep_d'), ic: 'keep', id: 'a-keep', onClick: () => go('keep') }),
      tile({ title: t('a_reach'), sub: t('a_reach_d'), ic: 'reach', id: 'a-reach', onClick: () => go('reach') }),
      tile({ title: t('a_sit'), sub: t('a_sit_d'), ic: 'sit', id: 'a-sit', onClick: () => go('sit') }),
    );

    const finish = () => {
      discardPaused();
      setLastSaved(false);
      leaveTo('done');
    };
    let asking = null;
    const finishBtn = button(t('a_finish'), () => {
      // Never throw away a prayer, words or a message she typed without asking.
      if (!S.hasTyped(session(), currentLang())) return finish();
      if (asking) return;
      asking = confirmBox({ question: t('discard_q'), yes: t('discard_yes'), no: t('exit_stay'), onYes: finish, onNo: () => { asking.remove(); asking = null; }, id: 'discard-confirm' });
      b.append(asking);
      asking.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, { kind: 'soft', id: 'finish' });
    view.actions(finishBtn);
  },
};
