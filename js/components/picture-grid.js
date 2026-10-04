/**
 * The four pictures, 2×2 in the fixed order. Selected: lamp ring, glow and a
 * numbered badge; with two chosen the others are dimmed. Screen readers hear
 * a description of the picture (pic_*), never an emotion word. The internal
 * keys (S, F, A, J) are never shown.
 */
import { h, fill } from '../lib/dom.js';
import { t, localizeDigits } from '../i18n.js';
import { C, pictureUrl } from '../content.js';

export function pictureGrid(chosen, onToggle) {
  const grid = h('div', { class: 'pic-grid' });
  const draw = (sel) => {
    const full = sel.length >= 2;
    fill(
      grid,
      C.order.map((k, i) => {
        const at = sel.indexOf(k);
        const on = at >= 0;
        return h(
          'button',
          {
            type: 'button',
            class: `pic${on ? ' pic--on' : ''}${full && !on ? ' pic--dim' : ''}`,
            'aria-pressed': on ? 'true' : 'false',
            'aria-label': t(`pic_${k}`),
            'data-testid': `pic-${i + 1}`,
            onClick: () => onToggle(k),
          },
          h('img', { src: pictureUrl(k), alt: '', loading: 'eager' }),
          on ? h('span', { class: 'pic__badge', 'aria-hidden': 'true', text: localizeDigits(at + 1) }) : null,
        );
      }),
    );
  };
  draw(chosen);
  grid.update = draw;
  return grid;
}
