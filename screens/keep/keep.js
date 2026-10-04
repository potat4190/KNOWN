/** Keep. Save to Moments (once), or finish without saving (asks first if she typed anything). */
import { $, fill } from '../../js/lib/dom.js';
import { t, currentLang } from '../../js/i18n.js';
import { ref } from '../../js/content.js';
import { session, update, saveMoment, discardPaused } from '../../js/state/session-store.js';
import * as S from '../../js/state/session.js';
import { button, choice, notice, confirmBox } from '../../js/components/ui.js';
import { msgText } from '../reach/reach.js';
import { leaveTo, setLastSaved } from '../../js/nav.js';
import { go, back } from '../../js/router.js';

const clip = (s, n = 90) => (s && s.length > n ? `${s.slice(0, n)}…` : s);

export default {
  session: true,
  mount(view) {
    const b = view.body;
    const lang = currentLang();
    view.header({ inSession: true, step: 4, back });
    const rowsEl = $('[data-slot=rows]', b);
    let asking = null;

    const title = { passage: t('keep_passage'), stay: t('keep_stood'), prayer: t('keep_prayer'), words: t('keep_words'), msg: t('keep_msg') };

    const draw = () => {
      const s = session();
      const detail = {
        passage: ref(s.path, lang),
        stay: S.stayText(s, lang),
        prayer: clip(S.currentPrayer(s, lang)),
        words: clip(s.words.trim()),
        msg: clip(msgText(s, lang)),
      };
      if (s.savedMomentId) {
        fill(rowsEl, notice(t('saved_ok'), 'check', 'saved-ok'));
        return view.actions(button(t('done'), () => go('done'), { id: 'keep-done' }));
      }
      fill(rowsEl, S.keepRows(s).map((k) =>
        choice({ title: title[k], detail: detail[k], on: s.keep[k], id: `keep-${k}`, onClick: () => { update((x) => S.toggleKeep(x, k)); draw(); } })));
      view.actions(
        button(t('save_moment'), save, { id: 'save-moment', disabled: !S.canSave(s) }),
        button(t('end_nosave'), finishWithout, { kind: 'plain', id: 'finish-without' }),
      );
    };

    const save = () => {
      const m = saveMoment(lang, msgText());
      if (!m) return;
      setLastSaved(true);
      draw(); // shows "Saved" if she comes Back from Done
      go('done'); // pushed: Back from Done returns here and shows it as saved
    };
    const end = () => {
      discardPaused();
      setLastSaved(false);
      leaveTo('done');
    };
    const finishWithout = () => {
      // Never throw away a prayer, words or a message she typed without asking.
      if (!S.hasTyped(session(), lang)) return end();
      if (asking) return;
      asking = confirmBox({ question: t('discard_q'), yes: t('discard_yes'), no: t('exit_stay'), onYes: end, onNo: () => { asking.remove(); asking = null; }, id: 'discard-confirm' });
      b.append(asking);
      asking.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };
    draw();
  },
};
