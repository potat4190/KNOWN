/** Help. Back returns to wherever she was (a moment in progress stays as it was). */
import { $, fill } from '../../js/lib/dom.js';
import { t } from '../../js/i18n.js';
import { button } from '../../js/components/ui.js';
import { helpLines } from '../../js/components/help-lines.js';
import { back, replace } from '../../js/router.js';

export default {
  mount(view) {
    // Opened from a shared link (no history): Back goes Home.
    const goBack = () => (history.length > 1 ? back() : replace(''));
    view.header({ back: goBack, hideHelp: true, hideGear: true });
    fill($('[data-slot=lines]', view.body), helpLines({ full: true }));
    view.actions(button(t('back'), goBack, { kind: 'soft', id: 'help-back' }));
  },
};
