/** Paused → Home. */
import { t } from '../../js/i18n.js';
import { button } from '../../js/components/ui.js';
import { replace } from '../../js/router.js';

export default {
  center: true,
  mount(view) {
    view.header({});
    view.actions(button(t('done'), () => replace(''), { id: 'paused-done' }));
  },
};
