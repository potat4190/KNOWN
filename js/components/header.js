/**
 * Header: Back (or the KNOWN mark) · step dots during a moment · the Help pill
 * (on every screen except Help) and the gear outside a moment or ✕ inside one.
 */
import { h, fill } from '../lib/dom.js';
import { t } from '../i18n.js';
import { icon } from './icons.js';
import { go } from '../router.js';
import { openSheet } from './sheet.js';

export function mark() {
  return h('span', { class: 'mark', lang: 'en' }, h('span', { class: 'lamp', 'aria-hidden': 'true' }), 'KNOWN');
}

export function stepDots(step) {
  return h(
    'span',
    { class: 'dots', role: 'img', 'aria-label': t('step', { n: step }) },
    [1, 2, 3, 4].map((i) => h('span', { class: `${i <= step ? 'on' : ''}${i === step ? ' now' : ''}` })),
  );
}

/**
 * opts: { back: fn | null, step: 1–4, inSession, hideHelp, hideGear }
 */
export function renderHeader(opts = {}) {
  const el = document.getElementById('header');
  const { back, step, inSession, hideHelp, hideGear } = opts;

  const start = back
    ? h('button', { type: 'button', class: 'header__back', 'aria-label': t('back'), 'data-testid': 'header-back', onClick: back }, icon('back'), h('span', { text: t('back') }))
    : h(
        'button',
        {
          type: 'button',
          class: 'header__mark',
          'aria-label': 'KNOWN',
          onClick: () => (inSession ? openSheet('exit') : go('')),
        },
        mark(),
      );

  const end = h('div', { class: 'header__end' });
  if (!hideHelp)
    end.append(
      h(
        'button',
        { type: 'button', class: 'help-pill', 'aria-label': t('help_btn'), 'data-testid': 'help-pill', onClick: () => go('help') },
        icon('help', 18),
        h('span', { text: t('help_pill') }),
      ),
    );
  if (inSession)
    end.append(
      h('button', { type: 'button', class: 'header__icon', 'aria-label': t('exit_aria'), 'data-testid': 'header-x', onClick: () => openSheet('exit') }, icon('close')),
    );
  else if (!hideGear)
    end.append(
      h('button', { type: 'button', class: 'header__icon', 'aria-label': t('settings'), 'data-testid': 'header-gear', onClick: () => go('settings') }, icon('gear')),
    );

  fill(el, h('div', { class: 'header__start' }, start), h('div', {}, inSession && step ? stepDots(step) : null), end);
}
