/** Doesn't fit. If she changed the prayer, it asks before replacing it. */
import { $, h, fill, put } from '../../js/lib/dom.js';
import { t, currentLang } from '../../js/i18n.js';
import { P, ref, sceneUrl } from '../../js/content.js';
import { session, update } from '../../js/state/session-store.js';
import * as S from '../../js/state/session.js';
import { button, tile, confirmBox } from '../../js/components/ui.js';
import { refresh } from '../../js/router.js';

export default {
  title: () => t('nofit_title'),
  mount(body, { close }) {
    const lang = currentLang();
    const s = session();
    if (!s?.path) return close();
    const { person, psalms } = S.noFitOptions(s);

    const doSwap = (path) => {
      update((x) => S.swap(x, path));
      close();
      refresh(); // redraw Scripture with the new story
    };
    const doRepick = () => {
      update(S.repick);
      close();
      history.back(); // back to Feel, pictures cleared
    };
    // Never throw away a prayer she changed without asking.
    const ask = (action) => {
      if (!S.prayerEdited(session(), lang)) return action();
      fill($('[data-slot=confirm]', body), confirmBox({
        question: t('replace_prayer_q'), yes: t('replace_prayer_yes'), no: t('nofit_stay'), id: 'swap-confirm',
        onYes: action, onNo: () => fill($('[data-slot=confirm]', body)),
      }));
    };

    put(body, 'person', person
      ? tile({ title: t('nofit_other', { name: P(person, 'name', lang) }), sub: P(person, 'title', lang), face: sceneUrl(person), id: 'nofit-person', onClick: () => ask(() => doSwap(person)) })
      : null);
    put(body, 'psalms', psalms.length
      ? h('div', { style: 'display:flex;flex-direction:column;gap:8px' },
          h('p', { class: 'secondary bold muted', text: t('lament_head') }),
          h('div', { class: 'psalms' }, psalms.map((k) =>
            h('button', { type: 'button', class: 'psalm', 'data-testid': `nofit-${k}`, onClick: () => ask(() => doSwap(k)) },
              h('span', { class: 'secondary bold', text: P(k, 'title', lang) }),
              h('span', { class: 'footnote muted', text: ref(k, lang) })))))
      : null);
    put(body, 'pictures', s.from === 'pics'
      ? tile({ title: t('nofit_pictures'), ic: 'pics', id: 'nofit-pictures', onClick: () => ask(doRepick) })
      : null);
    put(body, 'stay', button(t('nofit_stay'), close, { id: 'nofit-stay' }));
  },
};
