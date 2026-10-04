/**
 * First-time tips. On the web they're a small note in the page, never an
 * overlay: nothing blocks the pictures, the primary button or Help.
 * At most two per screen; "Got it" moves on, "Skip tips" turns them all off.
 * Never on Language, Crisis, Help, Thinking or Sit.
 */
import { h } from '../lib/dom.js';
import { t } from '../i18n.js';
import { prefs, setPrefs } from '../state/prefs.js';

const TIPS = {
  feel_tabs: 'tip_feel_tabs',
  feel_nowords: 'tip_feel_nowords',
  scripture_full: 'tip_scripture_full',
  scripture_nofit: 'tip_scripture_nofit',
  pray_line: 'tip_pray_line',
  pray_edit: 'tip_pray_edit',
  after_tiles: 'tip_after',
  header_x: 'tip_header_x',
  moments_row: 'tip_moments',
};

/** Returns a tip element for the first unseen id, or null. */
export function tip(ids, { guided = false } = {}) {
  const p = prefs();
  if (!p.tourDone || !(p.tipsOn || guided)) return null;
  const queue = ids.filter((id) => !p.tipsSeen[id]);
  if (!queue.length) return null;

  const box = h('aside', { class: 'tip', 'data-testid': 'tip', 'aria-live': 'polite' });
  const show = (i) => {
    const id = queue[i];
    if (!id) return box.remove();
    box.replaceChildren(
      h('p', { text: t(TIPS[id]) }),
      h(
        'div',
        { class: 'tip__row' },
        h('button', {
          type: 'button',
          class: 'btn btn--quiet',
          'data-testid': 'tip-skip',
          text: t('tip_skip_all'),
          onClick: () => {
            setPrefs({ tipsOn: false, tipsSeen: Object.fromEntries(Object.keys(TIPS).map((k) => [k, true])) });
            box.remove();
          },
        }),
        h('button', {
          type: 'button',
          class: 'btn btn--soft',
          style: 'align-self:auto',
          'data-testid': 'tip-got-it',
          text: t('tip_got_it'),
          onClick: () => {
            setPrefs({ tipsSeen: { ...prefs().tipsSeen, [id]: true } });
            show(i + 1);
          },
        }),
      ),
    );
  };
  show(0);
  return box;
}
