/**
 * Help lines. The order is the safety floor:
 *  1. findahelpline.com (finds lines in her country), always first
 *  2. her local emergency number (a verified number for her region, else the generic text)
 *  3. US services: 988 (call or text) and 911
 *  4. (full) a copyable message for her community guide
 *  5. (full) her school
 * Every number and link comes from data/help-lines.json (the phone app's src/config/help-lines.ts).
 */
import { h } from '../lib/dom.js';
import { t } from '../i18n.js';
import { button } from './ui.js';
import { copyText } from '../services/share.js';

let LINES = null;
export async function loadHelpLines() {
  if (!LINES) LINES = await (await fetch('data/help-lines.json')).json();
  return LINES;
}

const verified = (l) => Boolean(l.verifiedBy?.trim() && /^\d{4}-\d{2}-\d{2}$/.test(l.verifiedOn || ''));

function region() {
  try {
    return new Intl.Locale(navigator.language).maximize().region || null;
  } catch {
    return null;
  }
}

const card = (title, desc, ...children) =>
  h('div', { class: 'card' }, h('p', { class: 'bold', text: title }), desc ? h('p', { class: 'secondary muted', text: desc }) : null, ...children);

const num = (value) => h('p', { class: 'h2 ltr', text: value, 'aria-label': value.split('').join(' ') });

const linkBtn = (label, href, id) =>
  h('a', { class: 'btn btn--soft', href, 'data-testid': id, target: href.startsWith('http') ? '_blank' : null, rel: 'noopener' }, label);

export function helpLines({ full = false } = {}) {
  const L = LINES.lines;
  const r = region();
  const local = r ? LINES.localEmergency.find((l) => l.region === r.toUpperCase() && verified(l)) : null;
  const status = h('p', { class: 'status-line', role: 'status' });

  return h(
    'div',
    { class: 'help-lines', 'data-testid': 'help-lines', style: 'display:flex;flex-direction:column;gap:12px' },
    card(t('help_world_t'), t('help_world_d'), linkBtn(`${t('help_open')} ↗`, L.findahelpline.value, 'help-findahelpline')),
    card(t('help_local'), t('help_local_d'), local ? [num(local.value), linkBtn(t('help_call'), `tel:${local.value}`)] : null),
    card(
      t('help_988'),
      `${t('help_us')} ${t('help_988_d')}`,
      num(L.us988Call.value),
      h(
        'div',
        { style: 'display:flex;gap:8px' },
        linkBtn(t('help_call'), `tel:${L.us988Call.value}`, 'help-988-call'),
        linkBtn(t('help_text'), `sms:${L.us988Text.value}`, 'help-988-text'),
      ),
      h('p', { class: 'secondary muted', text: `${t('help_911')} · ${t('help_911_d')}` }),
      h('a', { class: 'btn btn--plain', href: `tel:${L.us911.value}` }, `${t('help_call')} ${L.us911.value}`),
    ),
    full
      ? [
          card(
            t('help_guide_t'),
            null,
            h('p', { class: 'card card--warm', text: t('help_msg') }),
            button(
              t('share_copy'),
              async () => {
                status.textContent = (await copyText(t('help_msg'))) ? t('copied') : t('copy_fallback');
              },
              { kind: 'plain', id: 'help-copy' },
            ),
            status,
          ),
          card(t('help_school'), t('help_school_d')),
        ]
      : null,
  );
}
