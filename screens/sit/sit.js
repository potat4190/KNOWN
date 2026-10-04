/** Sit a little longer. "Just breathe" hides the words. Amen → back to After. No tips here. */
import { $, h, fill, put } from '../../js/lib/dom.js';
import { t, currentLang, LANG_INFO } from '../../js/i18n.js';
import { C, sceneUrl } from '../../js/content.js';
import { session } from '../../js/state/session-store.js';
import { button } from '../../js/components/ui.js';
import { back } from '../../js/router.js';

const BREATH_MS = 10_000;
const IN_MS = BREATH_MS * 0.4; // matches the lamp: grows for the first 40% of the cycle

export default {
  session: true,
  mount(view) {
    const b = view.body;
    const lang = currentLang();
    const path = session().path;
    view.header({ inSession: true, step: 4, back });
    $('[data-slot=scene]', b).src = sceneUrl(path);

    const br = C.breath[path];
    const pair = br && (br.t[lang] || br.t.en);
    const lineLang = br?.t[lang] ? lang : 'en';
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let words = true;
    let phase = 'in';
    let timer = null;

    const cue = (which) =>
      h('div', { class: 'cue' },
        h('p', { class: 'secondary muted', text: t(which === 'in' ? 'br_in' : 'br_out') }),
        words && pair ? h('p', { class: 'h2 reading', lang: LANG_INFO[lineLang].tag, text: pair[which === 'in' ? 0 : 1] }) : null);

    const cues = $('[data-slot=cues]', b);
    const draw = () => {
      $('[data-slot=lead]', b).textContent = words && pair ? t('breath_note') : t('sit_breathe');
      fill(cues, still ? [cue('in'), cue('out')] : cue(phase));
    };
    const loop = () => {
      draw();
      timer = setTimeout(() => {
        phase = phase === 'in' ? 'out' : 'in';
        loop();
      }, phase === 'in' ? IN_MS : BREATH_MS - IN_MS);
    };
    if (still) draw();
    else loop();

    put(b, 'toggle', pair ? (() => {
      const btn = button(t('just_breathe'), () => {
        words = !words;
        btn.querySelector('span').textContent = t(words ? 'just_breathe' : 'show_words');
        draw();
      }, { kind: 'quiet', id: 'toggle-words' });
      return btn;
    })() : null);

    view.actions(button(t('amen'), back, { id: 'sit-amen' }));
    return () => clearTimeout(timer);
  },
};
