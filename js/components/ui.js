/**
 * Small shared building blocks: buttons, tiles, checkbox rows, chips,
 * segmented tabs, notices, the "You said" card and inline confirmations.
 * Every function returns an element.
 */
import { h } from '../lib/dom.js';
import { icon } from './icons.js';

/** kind: 'primary' | 'soft' | 'plain' | 'quiet' | 'danger'. One primary per screen. */
export function button(label, onClick, { kind = 'primary', id, icon: ic, disabled } = {}) {
  return h(
    'button',
    { type: 'button', class: `btn btn--${kind}`, 'data-testid': id, disabled: !!disabled, onClick },
    ic ? icon(ic, 20) : null,
    h('span', { text: label }),
  );
}

/**
 * A button that ignores taps while its async action runs (no double saves,
 * no story opened twice).
 */
export function onceAtATime(fn) {
  let busy = false;
  return async (e) => {
    if (busy) return;
    busy = true;
    try {
      await fn(e);
    } finally {
      busy = false;
    }
  };
}

export function tile({ title, sub, ic, face, onClick, id }) {
  return h(
    'button',
    { type: 'button', class: 'tile', 'data-testid': id, onClick },
    face
      ? h('img', { class: 'tile__face', src: face, alt: '' })
      : ic
        ? h('span', { class: 'tile__icon' }, icon(ic))
        : null,
    h('span', { class: 'tile__text' }, h('span', { class: 'tile__title', text: title }), sub ? h('span', { class: 'tile__sub', text: sub }) : null),
    h('span', { class: 'tile__chev' }, icon('chevron', 20)),
  );
}

/** A checkbox row (Keep). */
export function choice({ title, detail, on, onClick, id }) {
  return h(
    'button',
    { type: 'button', class: 'choice', role: 'checkbox', 'aria-checked': on ? 'true' : 'false', 'data-testid': id, onClick },
    h('span', { class: 'choice__box' }, on ? icon('check', 16) : null),
    h('span', {}, h('span', { class: 'choice__title', text: title }), detail ? h('span', { class: 'choice__detail', text: ` ${detail}`, style: 'display:block' }) : null),
  );
}

export function chip(label, on, onClick, id) {
  return h('button', { type: 'button', class: 'chip', 'aria-pressed': on ? 'true' : 'false', 'data-testid': id, onClick, text: label });
}

/** Segmented tabs (Pictures | My own words). */
export function segmented(label, items, value, onChange) {
  return h(
    'div',
    { class: 'segmented', role: 'tablist', 'aria-label': label },
    items.map((it) =>
      h('button', {
        type: 'button',
        role: 'tab',
        'aria-selected': it.key === value ? 'true' : 'false',
        'data-testid': it.id,
        text: it.label,
        onClick: () => onChange(it.key),
      }),
    ),
  );
}

export function notice(text, ic = null, id) {
  return h('div', { class: 'notice', role: 'status', 'data-testid': id }, ic ? icon(ic, 20) : null, h('span', { text }));
}

/** A muted line with a small icon (the privacy line, the AI note). */
export function noteLine(text, ic) {
  return h('div', { class: 'note-line' }, icon(ic, 18), h('span', { text }));
}

export function saidCard(label, words, ...children) {
  return h(
    'div',
    { class: 'said' },
    h('span', { class: 'eyebrow', text: label }),
    h('p', { class: 'said__words', text: `“${words}”` }),
    ...children,
  );
}

/** An inline confirmation instead of a system alert. */
export function confirmBox({ question, yes, no, onYes, onNo, danger, id }) {
  return h(
    'div',
    { class: `confirm${danger ? ' confirm--danger' : ''}`, role: 'alertdialog', 'aria-label': question, 'data-testid': id },
    h('p', { class: 'bold', text: question }),
    h(
      'div',
      { class: 'confirm__row' },
      button(yes, onYes, { kind: danger ? 'danger' : 'primary', id: id && `${id}-yes` }),
      button(no, onNo, { kind: 'soft', id: id && `${id}-no` }),
    ),
  );
}

export const heading = (text, { center, srOnly } = {}) =>
  h('h1', { class: `h1${center ? ' center' : ''}${srOnly ? ' sr-only' : ''}`, tabindex: '-1', text });

export const lead = (text, { center } = {}) => h('p', { class: `lead${center ? ' center' : ''}`, text });

export const lamp = ({ breathe, large } = {}) =>
  h('div', { class: `lamp${large ? ' lamp--lg' : ''}${breathe ? ' lamp--breathe' : ''}`, 'aria-hidden': 'true' });
