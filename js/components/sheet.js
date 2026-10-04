/**
 * Bottom sheets, built on the native <dialog> element (focus stays inside,
 * Escape closes). Each sheet lives in sheets/<name>/ with its own html, css
 * and js. The js exports:
 *   title()      → the sheet title
 *   eyebrow?()   → a small line above the title
 *   locked?      → true = can't be dismissed (the Recover sheet)
 *   mount(body, { close }) → fills the body
 */
import { h, fill, loadStyle, loadTemplate } from '../lib/dom.js';
import { applyT } from '../i18n.js';

let openName = null;
let locked = false;
const closeListeners = new Set();

const dialog = () => document.getElementById('sheet');

export const sheetOpen = () => openName;
export function onSheetClose(fn) {
  closeListeners.add(fn);
  return () => closeListeners.delete(fn);
}

export async function openSheet(name) {
  const d = dialog();
  if (openName) closeSheet();
  openName = name;
  const base = `sheets/${name}/${name}`;
  const [mod, tpl] = await Promise.all([import(`../../${base}.js`), loadTemplate(`${base}.html`), loadStyle(`${base}.css`)]);
  if (openName !== name) return; // closed while loading
  const S = mod.default;
  locked = !!S.locked;

  const body = h('div', { class: 'sheet__body' });
  body.append(tpl);
  applyT(body);
  fill(
    d,
    h('div', { class: 'sheet__grabber', 'aria-hidden': 'true' }),
    S.eyebrow ? h('p', { class: 'eyebrow', text: S.eyebrow() }) : null,
    h('h2', { class: 'h2', id: 'sheet-title', text: S.title(), style: 'margin-bottom:8px' }),
    body,
  );
  d.dataset.testid = `sheet-${name}`;
  S.mount(body, { close: closeSheet });
  if (!d.open) d.showModal();
}

export function closeSheet() {
  const d = dialog();
  const was = openName;
  openName = null;
  locked = false;
  if (d.open) d.close();
  fill(d);
  if (was) closeListeners.forEach((fn) => fn(was));
}

export function initSheet() {
  const d = dialog();
  // Escape: closes, except the Recover sheet.
  d.addEventListener('cancel', (e) => {
    e.preventDefault();
    if (!locked) closeSheet();
  });
  // A tap on the dimmed backdrop closes (the backdrop is the dialog element itself).
  d.addEventListener('click', (e) => {
    if (e.target !== d || locked) return;
    const r = d.getBoundingClientRect();
    const outside = e.clientY < r.top || e.clientY > r.bottom || e.clientX < r.left || e.clientX > r.right;
    if (outside) closeSheet();
  });
}
