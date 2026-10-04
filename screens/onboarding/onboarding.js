/**
 * First-run guide: four cards (swipe, or Next). Skip and Start finish it;
 * it never returns on its own (Settings → Show me around again does that).
 */
import { $, h, fill } from '../../js/lib/dom.js';
import { t } from '../../js/i18n.js';
import { setPrefs } from '../../js/state/prefs.js';
import { button } from '../../js/components/ui.js';
import { icon } from '../../js/components/icons.js';
import { stepDots } from '../../js/components/header.js';
import { replace } from '../../js/router.js';

export default {
  mount(view) {
    const header = document.getElementById('header');
    header.hidden = true;
    const track = $('[data-slot=track]', view.body);
    const cards = [...track.children];
    const dots = $('[data-slot=dots]', view.body);
    let i = 0;

    $('[data-slot=steps]', view.body).append(
      ...[1, 2, 3, 4].map((n) => h('div', { class: 'onb__step' }, stepDots(n), h('span', { text: t(`tour_s${n}`) }))),
    );
    $('[data-slot=lock]', view.body).append(icon('lock'));
    $('[data-slot=help]', view.body).append(icon('help'));

    const finish = () => {
      setPrefs({ tourDone: true });
      replace('');
    };
    const next = button(t('tour_next'), () => {
      if (i === cards.length - 1) return finish();
      cards[i + 1].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      setIndex(i + 1);
    }, { id: 'tour-next' });

    const setIndex = (k) => {
      i = k;
      fill(dots, cards.map((_, n) => h('span', { class: `${n <= i ? 'on' : ''}${n === i ? ' now' : ''}` })));
      next.querySelector('span').textContent = t(i === cards.length - 1 ? 'tour_start' : 'tour_next');
    };
    track.addEventListener('scroll', () => {
      const k = Math.round(Math.abs(track.scrollLeft) / track.clientWidth);
      if (k !== i && k < cards.length) setIndex(k);
    });
    $('[data-slot=skip]', view.body).addEventListener('click', finish);
    view.actions(next);
    setIndex(0);
    return () => (header.hidden = false);
  },
};
