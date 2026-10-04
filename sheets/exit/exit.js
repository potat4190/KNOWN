/**
 * Stop for now: save this step for later (3 days, this browser), end without
 * saving (asks first if she typed anything), keep going, or the quick
 * "Delete everything" for a shared device.
 */
import { $, h, fill, put } from '../../js/lib/dom.js';
import { t, currentLang } from '../../js/i18n.js';
import { session, pauseSession, discardPaused, deleteEverything } from '../../js/state/session-store.js';
import * as S from '../../js/state/session.js';
import { button, tile, confirmBox } from '../../js/components/ui.js';
import { leaveTo } from '../../js/nav.js';

export default {
  title: () => t('exit_title'),
  mount(body, { close }) {
    const endNow = () => {
      close();
      discardPaused();
      leaveTo('');
    };
    fill(
      $('[data-slot=tiles]', body),
      tile({ title: t('exit_save'), sub: t('exit_save_d'), ic: 'pause', id: 'exit-save', onClick: () => { close(); pauseSession(); leaveTo('paused', { keepSession: true }); } }),
      tile({
        title: t('exit_end'), ic: 'end', id: 'exit-end',
        onClick: () => {
          const s = session();
          if (!s || !S.hasTyped(s, currentLang())) return endNow();
          fill($('[data-slot=confirm-end]', body), confirmBox({
            question: t('discard_q'), yes: t('discard_yes'), no: t('exit_stay'), id: 'discard-confirm',
            onYes: endNow, onNo: () => fill($('[data-slot=confirm-end]', body)),
          }));
        },
      }),
    );
    put(body, 'stay', button(t('exit_stay'), close, { id: 'exit-stay' }));

    const clear = $('[data-slot=clear]', body);
    const drawClear = (confirming) =>
      fill(clear, confirming
        ? confirmBox({ question: t('clear_q'), yes: t('clear_yes'), no: t('cancel'), danger: true, id: 'exit-clear-confirm',
            onYes: () => { close(); deleteEverything(); leaveTo(''); }, onNo: () => drawClear(false) })
        : h('button', { type: 'button', class: 'exit__clear', 'data-testid': 'exit-clear', text: t('clear_all'), onClick: () => drawClear(true) }));
    drawClear(false);
  },
};
