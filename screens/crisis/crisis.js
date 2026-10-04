/** Crisis: "See who can help now" → Help; "Continue to Scripture" → Scripture (Psalm 77 if nothing matched). */
import { $, fill } from '../../js/lib/dom.js';
import { t } from '../../js/i18n.js';
import { C } from '../../js/content.js';
import { session, update } from '../../js/state/session-store.js';
import { button } from '../../js/components/ui.js';
import { helpLines } from '../../js/components/help-lines.js';
import { go, replace } from '../../js/router.js';

export default {
  session: true,
  mount(view) {
    view.header({ inSession: true, step: 2 });
    fill($('[data-slot=lines]', view.body), helpLines());
    view.actions(
      button(t('crisis_help'), () => go('help'), { id: 'crisis-help' }),
      button(t('crisis_go'), () => {
        if (!session().path) update((x) => ({ ...x, path: C.nw, seen: [C.nw], from: 'words' }));
        replace('scripture');
      }, { kind: 'plain', id: 'crisis-go' }),
    );
  },
};
