/**
 * Settings. Every control here works or isn't shown: no Bible-version picker
 * (no YouVersion on the web build yet), no music (no tracks), no judge panel.
 */
import { $, h, fill } from '../../js/lib/dom.js';
import { t, LANGS, LANG_INFO, currentLang, loadLang } from '../../js/i18n.js';
import { C } from '../../js/content.js';
import { CONFIG } from '../../js/config.js';
import { prefs, setPrefs } from '../../js/state/prefs.js';
import { deleteEverything } from '../../js/state/session-store.js';
import { chip, segmented, tile, confirmBox } from '../../js/components/ui.js';
import { go } from '../../js/router.js';

export default {
  tabs: true,
  mount(view) {
    const b = view.body;
    const lang = currentLang();
    view.header({ hideGear: true });
    const status = $('[data-slot=status]', b);

    fill($('[data-slot=langs]', b), LANGS.map((l) => {
      const c = chip(LANG_INFO[l].name, l === lang, async () => {
        if (l === lang) return;
        await loadLang(l);
        setPrefs({ lang: l }); // the page redraws in the new language (and direction)
      }, `set-lang-${l}`);
      c.lang = LANG_INFO[l].tag;
      return c;
    }));

    const drawTheme = () =>
      fill($('[data-slot=theme]', b), segmented(t('theme_label'), [
        { key: 'system', label: t('theme_sys'), id: 'theme-system' },
        { key: 'light', label: t('theme_light'), id: 'theme-light' },
        { key: 'dark', label: t('theme_dark'), id: 'theme-dark' },
      ], prefs().theme, (v) => { setPrefs({ theme: v }); drawTheme(); }));
    drawTheme();

    fill($('[data-slot=tour]', b), tile({
      title: t('tour_again'), ic: 'spark', id: 'tour-again',
      onClick: () => { setPrefs({ tourDone: false, tipsOn: true, tipsSeen: {} }); go('onboarding'); },
    }));

    const tipsRow = () => {
      const on = prefs().tipsOn;
      return h('button', {
        type: 'button', class: 'switch-row', role: 'switch', 'aria-checked': on ? 'true' : 'false', 'data-testid': 'tips-switch',
        onClick: () => { setPrefs({ tipsOn: !prefs().tipsOn }); fill($('[data-slot=tips]', b), tipsRow()); },
      }, h('span', { text: t('tips_label') }), h('span', { class: 'switch', 'aria-hidden': 'true' }));
    };
    const tipsSlot = $('[data-slot=tips]', b);
    tipsSlot.append(tipsRow());

    fill($('[data-slot=help]', b), tile({ title: t('help_title'), ic: 'help', id: 'more-help', onClick: () => go('help') }));

    fill($('[data-slot=sources]', b), LANGS.map((l) =>
      h('p', { class: 'footnote muted', lang: LANG_INFO[l].tag, dir: 'auto', text: `${C.versions[l].abbr}: ${C.versions[l].name}` })));
    $('[data-slot=version]', b).textContent = `${t('version_label')} ${CONFIG.version}`;

    // Delete everything, with an inline confirmation.
    const clear = $('[data-slot=clear]', b);
    const drawClear = (confirming) =>
      fill(clear, confirming
        ? confirmBox({
            question: t('clear_q'), yes: t('clear_yes'), no: t('cancel'), danger: true, id: 'clear-confirm',
            onYes: () => { deleteEverything(); drawClear(false); status.textContent = t('clear_done'); drawTheme(); },
            onNo: () => drawClear(false),
          })
        : h('button', { type: 'button', class: 'clear-link', 'data-testid': 'clear-all', text: t('clear_all'), onClick: () => drawClear(true) }));
    drawClear(false);
  },
};
