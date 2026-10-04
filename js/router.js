/**
 * Hash router: #/feel, #/scripture, #/moment/<id>…
 * (GitHub Pages can't serve a fallback page for every path, so the screen
 * lives after the #.)
 *
 * Each screen is a folder in screens/ with <name>.html (the markup, with
 * data-t="key" for text), <name>.css and <name>.js. The js exports:
 *   session?  → true if the screen needs a moment in progress (else: go Home)
 *   tabs?     → true to show the bottom tabs
 *   center?   → true to centre the content vertically
 *   mount(view) → wires up the screen; may return a cleanup function.
 *
 * `view` gives the screen its body element, its route param, and helpers to
 * set the header and the sticky actions.
 */
import { h, fill, loadStyle, loadTemplate } from './lib/dom.js';
import { applyT, t } from './i18n.js';
import { prefs } from './state/prefs.js';
import { session, focusScreen } from './state/session-store.js';
import { renderHeader } from './components/header.js';
import { closeSheet, sheetOpen } from './components/sheet.js';
import { icon } from './components/icons.js';

const SCREENS = new Set([
  'home', 'language', 'onboarding', 'moments', 'moment', 'settings', 'help', 'done', 'paused', 'guided',
  'feel', 'thinking', 'crisis', 'scripture', 'pray', 'after', 'reach', 'sit', 'keep',
]);

/** Push a new screen (Back returns here). '' is Home. */
export function go(name) {
  location.hash = `#/${name}`;
}
/** Replace the current screen (Back skips it). */
export function replace(name) {
  location.replace(`#/${name}`);
}
export function back() {
  history.back();
}

function parse() {
  const [name = '', param = null] = location.hash.replace(/^#\/?/, '').split('/');
  return { name: name || 'home', param: param ? decodeURIComponent(param) : null };
}

let cleanup = null;
let renderId = 0;

async function render() {
  const id = ++renderId;
  let { name, param } = parse();
  const p = prefs();

  // First run: Language, then the guide, then Home.
  if (!p.lang && name !== 'language') return replace('language');
  if (p.lang && !p.tourDone && !['language', 'onboarding'].includes(name)) return replace('onboarding');
  if (!SCREENS.has(name)) return replace('');

  if (sheetOpen() && name !== 'help') closeSheet();

  const base = `screens/${name}/${name}`;
  let mod, tpl;
  try {
    [mod, tpl] = await Promise.all([import(`../${base}.js`), loadTemplate(`${base}.html`), loadStyle(`${base}.css`)]);
  } catch (e) {
    console.error(e);
    return showError();
  }
  if (id !== renderId) return; // a newer navigation won
  const S = mod.default;

  // Session screens need a moment in progress (after Delete everything, or a stale Back).
  if (S.session && !session()) return replace('');
  if (S.session) focusScreen(name);

  if (cleanup) cleanup();
  cleanup = null;

  const screen = document.getElementById('screen');
  const actions = document.getElementById('actions');
  const body = h('div', { class: `screen__body${S.center ? ' screen__body--center' : ''}` });
  body.append(tpl);
  applyT(body);
  fill(screen, body);
  screen.scrollTop = 0;
  fill(actions);
  actions.hidden = true;
  renderTabs(S.tabs ? name : null);
  renderHeader({});

  const view = {
    name,
    param,
    body,
    header: (opts) => renderHeader(opts),
    /** Sets the sticky actions (one primary button, the rest soft or text). */
    actions: (...nodes) => {
      fill(actions, ...nodes);
      actions.hidden = !actions.children.length;
    },
  };
  try {
    cleanup = (await S.mount(view)) || null;
  } catch (e) {
    console.error(e);
    return showError();
  }
  // Content rises in once; anything added later appears without re-animating the rest.
  setTimeout(() => body.classList.add('is-settled'), 700);
  // Move focus to the heading so screen readers start at the top.
  const h1 = body.querySelector('h1');
  if (h1 && document.activeElement?.closest?.('#sheet') == null) h1.focus({ preventScroll: true });
}

function renderTabs(active) {
  const nav = document.getElementById('tabs');
  if (!active) {
    nav.hidden = true;
    return fill(nav);
  }
  const tab = (name, ic, label) =>
    h('a', { href: `#/${name === 'home' ? '' : name}`, 'aria-current': active === name ? 'page' : null, 'data-testid': `tab-${name}` }, icon(ic), h('span', { text: label }));
  fill(nav, tab('home', 'home', t('tab_home')), tab('moments', 'keep', t('moments_title')), tab('settings', 'more', t('tab_more')));
  nav.hidden = false;
}

function showError() {
  renderHeader({});
  const screen = document.getElementById('screen');
  fill(
    screen,
    h(
      'div',
      { class: 'screen__body screen__body--center' },
      h('h1', { class: 'h1', text: t('error_title') }),
      h('p', { class: 'lead', text: t('error_body') }),
    ),
  );
  const actions = document.getElementById('actions');
  fill(actions, h('button', { type: 'button', class: 'btn btn--primary', text: t('restart'), onClick: () => location.replace('#/') }));
  actions.hidden = false;
}

/** Re-render the current screen (after a language or theme change). */
export const refresh = () => render();

export function startRouter() {
  window.addEventListener('hashchange', render);
  return render();
}
