/** Guided orientation ("With someone I trust"). Tips are on for this moment. */
import { $, fill } from '../../js/lib/dom.js';
import { t } from '../../js/i18n.js';
import { button, notice } from '../../js/components/ui.js';
import { go, back } from '../../js/router.js';

export default {
  session: true,
  mount(view) {
    view.header({ back });
    fill($('[data-slot=note]', view.body), notice(t('guided_note'), null));
    view.actions(button(t('start_exp'), () => go('feel'), { id: 'start-exp' }));
  },
};
