/** Tiny DOM helpers. No framework: screens build and update their own elements. */

/**
 * Creates an element. `attrs` keys:
 *   class, text, html (trusted markup only), on{Event} handlers,
 *   dataset / aria-* / any attribute; `false`/`null` values are skipped.
 */
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k === 'value') el.value = v;
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  append(el, children);
  return el;
}

export function append(el, children) {
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

/** Replaces an element's children. */
export function fill(el, ...children) {
  el.replaceChildren();
  return append(el, children);
}

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/** Announces a short status to screen readers. */
export function announce(text) {
  const el = document.getElementById('announcer');
  if (!el) return;
  el.textContent = '';
  setTimeout(() => (el.textContent = text), 50);
}

/** Loads a screen's HTML template once and returns a fresh copy of it. */
const templates = new Map();
export async function loadTemplate(url) {
  if (!templates.has(url)) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Template ${url}: HTTP ${res.status}`);
    templates.set(url, await res.text());
  }
  const t = document.createElement('template');
  t.innerHTML = templates.get(url);
  return t.content;
}

/** Loads a stylesheet once (each screen has its own). */
const styles = new Set();
export function loadStyle(url) {
  if (styles.has(url)) return Promise.resolve();
  styles.add(url);
  return new Promise((resolve) => {
    const link = h('link', { rel: 'stylesheet', href: url });
    link.addEventListener('load', resolve);
    link.addEventListener('error', resolve);
    document.head.append(link);
  });
}

/**
 * Replaces the template placeholder [data-slot=name] with `nodes`, or removes
 * it when there's nothing to show (so empty slots don't add spacing).
 */
export function put(root, name, ...nodes) {
  const slot = root.querySelector(`[data-slot="${name}"]`);
  if (!slot) return;
  const list = nodes.flat(Infinity).filter((n) => n != null && n !== false);
  if (list.length) slot.replaceWith(...list);
  else slot.remove();
}
