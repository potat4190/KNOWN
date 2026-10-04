/**
 * Boot: load the content pack and strings, apply language and theme, run the
 * paused-moment cleanup, then start the router.
 */
import { CONFIG } from './config.js';
import { h, fill } from './lib/dom.js';
import { loadContent } from './content.js';
import { loadLang, applyDocumentLang, currentLang } from './i18n.js';
import { prefs, onPrefs } from './state/prefs.js';
import { cleanupPaused } from './state/session-store.js';
import { store } from './state/store.js';
import { loadRules } from './services/matcher.js';
import { loadHelpLines } from './components/help-lines.js';
import { initSheet } from './components/sheet.js';
import { startRouter, refresh } from './router.js';

function applyTheme(theme) {
  if (theme === 'system') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = theme;
}

function testBanner() {
  const el = document.getElementById('test-banner');
  let hiddenByTester = false;
  try {
    hiddenByTester = !!sessionStorage.getItem('known.banner.hidden');
  } catch {
    /* storage blocked */
  }
  if (!CONFIG.showTestBanner || hiddenByTester) return;
  const where = !store.persistent
    ? 'This browser blocks storage, so nothing is kept.'
    : CONFIG.storage === 'session'
      ? 'Saved items are forgotten when you close this tab.'
      : 'Saved items stay in this browser, unencrypted.';
  fill(
    el,
    h('strong', { text: 'Test build. ' }),
    `Please don’t type anything private. ${where} `,
    CONFIG.feedbackUrl ? [h('a', { href: CONFIG.feedbackUrl, target: '_blank', rel: 'noopener', text: 'Send feedback' }), ' · '] : null,
    h('button', {
      type: 'button',
      text: 'Hide',
      onClick: () => {
        try {
          sessionStorage.setItem('known.banner.hidden', '1');
        } catch {
          /* ignore */
        }
        el.hidden = true;
      },
    }),
  );
  el.hidden = false;
}

/** Cover the page when the tab is hidden, so a task switcher doesn't show her words. */
function privacyCover() {
  const cover = document.getElementById('privacy-cover');
  document.addEventListener('visibilitychange', () => (cover.hidden = document.visibilityState === 'visible'));
}

async function boot() {
  await Promise.all([loadContent(), loadLang('en'), loadRules(), loadHelpLines()]);
  const lang = currentLang();
  if (lang !== 'en') await loadLang(lang);
  applyDocumentLang(lang);
  applyTheme(prefs().theme);
  testBanner();
  privacyCover();
  initSheet();
  cleanupPaused();

  // Language or theme changed in Settings: reload strings and redraw the current screen.
  let last = { lang: prefs().lang, theme: prefs().theme };
  onPrefs(async (p) => {
    if (p.theme !== last.theme) applyTheme(p.theme);
    if (p.lang && p.lang !== last.lang) {
      await loadLang(p.lang);
      applyDocumentLang(p.lang);
      last = { lang: p.lang, theme: p.theme };
      refresh();
      return;
    }
    last = { lang: p.lang, theme: p.theme };
  });

  await startRouter();
}

boot().catch((e) => {
  console.error(e);
  document.getElementById('screen').textContent = 'KNOWN couldn’t load. Please refresh the page.';
});
