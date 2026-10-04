/**
 * The Scripture page card: serif verses with small lamp-ink verse numbers,
 * a soft amber glow, the reference and the edition, and "Read the full
 * passage". The footer always names the edition shown. Scripture is never
 * machine-translated: if a passage isn't in her language, the English
 * edition is shown with a note.
 */
import { h, fill } from '../lib/dom.js';
import { t, localizeDigits, LANG_INFO, currentLang } from '../i18n.js';
import { C, range, ref, hasLang, bundledVersion, verseText } from '../content.js';

export function verses(path, list, textLang) {
  const lang = currentLang();
  const ltr = LANG_INFO[lang].rtl && !LANG_INFO[textLang].rtl;
  return h(
    'div',
    { class: `verses${ltr ? ' ltr' : ''}`, lang: LANG_INFO[textLang].tag, dir: LANG_INFO[textLang].rtl ? 'rtl' : 'ltr' },
    list.map((v) => h('p', { class: 'verse' }, h('sup', { text: localizeDigits(v, textLang) }), verseText(path, v, textLang))),
  );
}

export function pageCard(path, { id = 'page-card', excerptOnly = false } = {}) {
  const lang = currentLang();
  const p = C.passages[path];
  const textLang = hasLang(path, lang) ? lang : 'en';
  let full = false;

  const body = h('div');
  const toggle = h('button', { type: 'button', class: 'pill', 'data-testid': 'read-full' });
  const draw = () => {
    fill(body, verses(path, full ? range(p) : p.ex, textLang));
    toggle.textContent = t(full ? 'show_less' : 'read_full');
    toggle.setAttribute('aria-expanded', String(full));
  };
  toggle.addEventListener('click', () => {
    full = !full;
    draw();
  });
  draw();

  return h(
    'section',
    { class: 'page-card', 'data-testid': id, 'aria-label': ref(path, lang) },
    body,
    h(
      'div',
      { class: 'page-card__foot' },
      h('span', { class: 'bold', text: ref(path, lang) }),
      h('span', { class: 'muted', 'data-testid': 'edition-abbr', text: bundledVersion(path, lang).abbr }),
    ),
    textLang !== lang ? h('p', { class: 'footnote muted', text: t('lang_fallback') }) : null,
    excerptOnly ? null : h('div', { class: 'pills' }, toggle),
  );
}
