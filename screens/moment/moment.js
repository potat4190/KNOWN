/**
 * Moment detail. If it was saved in another language, she's asked whether to
 * switch it: Yes re-renders the bundled content (Scripture, title, the line
 * she kept, an unedited prayer). Her own typed words are never translated.
 */
import { $, h, fill } from '../../js/lib/dom.js';
import { t, LANGS, LANG_INFO, currentLang, loadLang } from '../../js/i18n.js';
import { C, P, ref, isPathKey } from '../../js/content.js';
import { store } from '../../js/state/store.js';
import { button, confirmBox } from '../../js/components/ui.js';
import { verses } from '../../js/components/page-card.js';
import { copyText } from '../../js/services/share.js';
import { quote } from '../pray/pray.js';
import { back } from '../../js/router.js';

/** A date in the moment's language (Burmese digits for Burmese). */
export function fmtDate(ts, lang) {
  try {
    return new Date(ts).toLocaleDateString(LANG_INFO[lang].tag, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...(lang === 'my' ? { numberingSystem: 'mymr' } : {}),
    });
  } catch {
    return new Date(ts).toDateString();
  }
}

function translateMoment(m, lang) {
  const patch = { lang };
  if (m.stayIndex != null) patch.stay = P(m.path, 'options', lang)[m.stayIndex] ?? m.stay;
  if (m.prayer != null && !m.prayerEdited) patch.prayer = P(m.path, 'prayer', lang);
  patch.abbr = (C.passages[m.path].text[lang] ? C.versions[lang] : C.versions.en).abbr;
  return patch;
}

const part = (label, ...children) => h('div', { class: 'moment__part' }, h('p', { class: 'label', text: label }), ...children);

export default {
  async mount(view) {
    const b = view.body;
    view.header({ back });
    const lang = currentLang();
    let m = store.moments.get(view.param);
    if (m && LANGS.includes(m.lang)) await loadLang(m.lang);

    view.actions(button(t('back_moments'), back, { kind: 'soft', id: 'back-moments' }));
    if (!m || !isPathKey(m.path)) {
      $('[data-slot=title]', b).textContent = t('moment_gone');
      return;
    }
    const status = $('[data-slot=status]', b);

    const draw = () => {
      const ml = LANGS.includes(m.lang) ? m.lang : lang;
      $('[data-slot=date]', b).textContent = fmtDate(m.createdAt, ml);
      $('[data-slot=title]', b).textContent = P(m.path, 'title', ml);
      const textLang = C.passages[m.path].text[ml] ? ml : 'en';
      fill(
        $('[data-slot=content]', b),
        m.passage
          ? h('section', { class: 'page-card' },
              verses(m.path, C.passages[m.path].ex, textLang),
              h('div', { class: 'page-card__foot' }, h('span', { class: 'bold', text: ref(m.path, ml) }), h('span', { class: 'muted', text: m.abbr })))
          : null,
        m.words ? part(t('keep_words'), h('div', { class: 'card card--warm', dir: 'auto', text: m.words })) : null,
        m.stay ? part(t('m_stood'), h('p', { style: 'font-style:italic', text: quote(m.stay, ml) })) : null,
        m.prayer ? part(t('m_prayer'), h('div', { class: 'card reading', dir: 'auto', text: m.prayer })) : null,
        m.msg
          ? part(t('keep_msg'), h('div', { class: 'card', dir: 'auto', text: m.msg }),
              button(t('share_copy'), async () => (status.textContent = (await copyText(m.msg)) ? t('copied') : t('copy_fallback')), { kind: 'plain' }))
          : null,
      );
    };
    draw();

    // Saved in another language: ask whether to switch it.
    if (m.lang !== lang) {
      const ask = confirmBox({
        question: t('translate_q'),
        yes: t('translate_yes'),
        no: t('translate_no'),
        id: 'translate-q',
        onYes: () => {
          store.moments.update(m.id, translateMoment(m, lang));
          m = store.moments.get(m.id);
          ask.remove();
          draw();
        },
        onNo: () => ask.remove(),
      });
      fill($('[data-slot=translate]', b), ask);
    }

    // Delete, with an inline confirmation.
    const del = $('[data-slot=delete]', b);
    const drawDelete = (confirming) =>
      fill(
        del,
        confirming
          ? confirmBox({
              question: t('delete_q'),
              yes: t('delete_yes'),
              no: t('delete_no'),
              danger: true,
              id: 'delete-confirm',
              onYes: () => {
                store.moments.remove(m.id);
                back();
              },
              onNo: () => drawDelete(false),
            })
          : button(t('delete_moment'), () => drawDelete(true), { kind: 'plain', id: 'delete-moment' }),
      );
    drawDelete(false);
  },
};
