/** Done → Home; View Moments when she saved. */
import { $ } from '../../js/lib/dom.js';
import { t } from '../../js/i18n.js';
import { button } from '../../js/components/ui.js';
import { leaveTo, wasSaved } from '../../js/nav.js';

export default {
  mount(view) {
    const saved = wasSaved();
    view.header({});
    $('[data-slot=saved]', view.body).hidden = !saved;
    view.actions(
      button(t('done'), () => leaveTo(''), { id: 'done-home' }),
      saved ? button(t('view_moments'), () => leaveTo('moments'), { kind: 'plain', id: 'view-moments' }) : null,
    );
  },
};
