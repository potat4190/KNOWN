/** First run: choose a language. Arabic switches the page to right-to-left (no reload needed on the web). */
import { $ } from '../../js/lib/dom.js';
import { LANGS, LANG_INFO, loadLang } from '../../js/i18n.js';
import { prefs, setPrefs } from '../../js/state/prefs.js';
import { button } from '../../js/components/ui.js';
import { mark } from '../../js/components/header.js';
import { replace } from '../../js/router.js';

export default {
  mount(view) {
    view.header({ hideHelp: true, hideGear: true });
    document.getElementById('header').hidden = true;
    $('[data-slot=mark]', view.body).append(mark());
    const list = $('[data-slot=list]', view.body);
    for (const l of LANGS) {
      const b = button(LANG_INFO[l].name, async () => {
        await loadLang(l);
        setPrefs({ lang: l });
        replace(prefs().tourDone ? '' : 'onboarding');
      }, { kind: 'soft', id: `lang-${l}` });
      b.querySelector('span').lang = LANG_INFO[l].tag;
      list.append(b);
    }
    return () => (document.getElementById('header').hidden = false);
  },
};
