/** Pray, step 3. Tap a line to keep it (tap again to clear); the prayer is hers to change. Amen → After. */
import { $, fill, put, h } from '../../js/lib/dom.js';
import { t, currentLang } from '../../js/i18n.js';
import { P, ref, sceneUrl } from '../../js/content.js';
import { session, update } from '../../js/state/session-store.js';
import * as S from '../../js/state/session.js';
import { button } from '../../js/components/ui.js';
import { tip } from '../../js/components/tips.js';
import { go, back } from '../../js/router.js';

/** Quotation marks that suit the language. */
export const quote = (s, lang) => (lang === 'ja' || lang === 'zh' ? `「${s}」` : lang === 'ar' ? `«${s}»` : `“${s}”`);

export default {
  session: true,
  mount(view) {
    const b = view.body;
    const lang = currentLang();
    const s = session();
    const path = s.path;
    view.header({ inSession: true, step: 3, back });

    $('[data-slot=face]', b).src = sceneUrl(path);
    $('[data-slot=name]', b).textContent = P(path, 'name', lang);
    $('[data-slot=ref]', b).textContent = ref(path, lang);
    $('[data-slot=lead]', b).textContent = `${P(path, 'q', lang)} ${t('say_hint')}`;
    put(b, 'tip', tip(['pray_line', 'pray_edit'], { guided: s.guided }));

    const lines = $('[data-slot=lines]', b);
    const stay = $('[data-slot=stay]', b);
    const input = $('[data-slot=input]', b);
    input.value = S.currentPrayer(s, lang);
    input.addEventListener('input', () => update((x) => S.setPrayer(x, input.value)));

    const draw = () => {
      const cur = session();
      fill(
        lines,
        P(path, 'options', lang).map((o, i) =>
          h('button', {
            type: 'button',
            class: 'say',
            'aria-pressed': cur.stay === i ? 'true' : 'false',
            'data-testid': `say-${i}`,
            text: quote(o, lang),
            onClick: () => {
              update((x) => S.toggleStay(x, i));
              draw();
            },
          }),
        ),
      );
      const chosen = S.stayText(cur, lang);
      stay.hidden = !chosen;
      stay.textContent = chosen ? quote(chosen, lang) : '';
    };
    draw();
    view.actions(button(t('amen'), () => go('after'), { id: 'amen' }));
  },
};
