/** Moments list. Opening it also runs the paused-moment cleanup. */
import { $, h, fill, put } from '../../js/lib/dom.js';
import { t, LANGS, loadLang } from '../../js/i18n.js';
import { P, ref, sceneUrl, isPathKey } from '../../js/content.js';
import { store } from '../../js/state/store.js';
import { cleanupPaused } from '../../js/state/session-store.js';
import { icon } from '../../js/components/icons.js';
import { tip } from '../../js/components/tips.js';
import { fmtDate } from '../moment/moment.js';
import { go } from '../../js/router.js';

export default {
  tabs: true,
  async mount(view) {
    view.header({});
    cleanupPaused();
    const list = store.moments.list().filter((m) => isPathKey(m.path));
    // Each row is shown in the language it was saved in.
    await Promise.all([...new Set(list.map((m) => m.lang).filter((l) => LANGS.includes(l)))].map(loadLang));
    put(view.body, 'tip', list.length ? tip(['moments_row']) : null);
    fill(
      $('[data-slot=list]', view.body),
      list.length
        ? list.map((m, i) => {
            const ml = LANGS.includes(m.lang) ? m.lang : 'en';
            return h(
              'button',
              { type: 'button', class: 'moment-row', 'data-testid': `moment-${i}`, onClick: () => go(`moment/${encodeURIComponent(m.id)}`) },
              h('img', { class: 'moment-row__face', src: sceneUrl(m.path), alt: '' }),
              h(
                'span',
                { class: 'moment-row__text' },
                h('span', { class: 'footnote muted', text: fmtDate(m.createdAt, ml) + (m.from === 'words' ? ` · ${t('from_words')}` : '') }),
                h('span', { class: 'bold', text: P(m.path, 'title', ml) }),
                h('span', { class: 'secondary muted', text: `${ref(m.path, ml)} · ${P(m.path, 'name', ml)}` }),
                h('span', { class: 'secondary bold', text: t('open') }),
              ),
              icon('chevron', 20),
            );
          })
        : h('p', { class: 'secondary muted', 'data-testid': 'moments-empty', text: t('moments_empty') }),
    );
  },
};
