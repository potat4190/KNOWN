/**
 * Reach out. The message is composed from her choices until she edits it;
 * then her edits are kept. Translate (with a back-translation to check the
 * meaning) appears only when an AI relay is set in js/config.js.
 */
import { $, h, fill, put } from '../../js/lib/dom.js';
import { t, hasKey, currentLang, LANGS, LANG_INFO } from '../../js/i18n.js';
import { session, update } from '../../js/state/session-store.js';
import * as S from '../../js/state/session.js';
import { button, chip, noteLine } from '../../js/components/ui.js';
import { copyText, canShare, shareText } from '../../js/services/share.js';
import { relayAvailable, translateMessage } from '../../js/services/matcher.js';
import { back } from '../../js/router.js';

/** Her edited text, or the composed message. */
export const msgText = (s = session(), lang = currentLang()) =>
  s.msg.text != null ? s.msg.text : S.compose(s, lang, t, (k) => hasKey(k, lang));

export default {
  session: true,
  mount(view) {
    const b = view.body;
    const lang = currentLang();
    view.header({ inSession: true, step: 4, back });
    const msg = $('[data-slot=msg]', b);
    const status = $('[data-slot=status]', b);
    let busy = false;

    const say = (text) => (status.textContent = text);
    const copy = async (text) => say((await copyText(text)) ? t('copied') : t('copy_fallback'));

    msg.addEventListener('input', () => {
      update((x) => S.setMsgText(x, msg.value));
      $('[data-slot=edited]', b).hidden = false;
      drawTranslate();
      drawActions();
    });

    const currentTr = () => {
      const s = session();
      return s.msg.tr && s.msg.trFor === `${s.msg.lang}|${msgText()}` ? s.msg.tr : null;
    };

    const drawChips = () => {
      const s = session();
      fill($('[data-slot=to]', b),
        chip(t('to_guide'), s.msg.to === 'guide', () => { update((x) => ({ ...x, msg: { ...x.msg, to: 'guide' } })); drawChips(); }, 'to-guide'),
        chip(t('to_friend'), s.msg.to === 'friend', () => { update((x) => ({ ...x, msg: { ...x.msg, to: 'friend' } })); drawChips(); }, 'to-friend'),
      );
      fill($('[data-slot=need]', b), ['listen', 'pray', 'time'].map((n) =>
        chip(t(`n_${n}`), s.msg.need === n, () => { update((x) => S.setNeed(x, n)); drawAll(); }, `need-${n}`)));
      fill($('[data-slot=reader]', b), LANGS.map((l) => {
        const c = chip(LANG_INFO[l].name, s.msg.lang === l, () => { update((x) => ({ ...x, msg: { ...x.msg, lang: l } })); drawAll(); }, `reader-${l}`);
        c.lang = LANG_INFO[l].tag;
        c.setAttribute('role', 'radio');
        c.setAttribute('aria-checked', s.msg.lang === l ? 'true' : 'false');
        return c;
      }));
    };

    const slotTr = $('[data-slot=translate]', b);
    const drawTranslate = () => {
      const s = session();
      const reader = s.msg.lang;
      if (reader === lang) return fill(slotTr);
      const tr = currentTr();
      if (tr) {
        return fill(slotTr, h('div', { class: 'reach__tr' },
          h('div', { class: 'card card--warm' },
            h('p', { class: 'eyebrow', text: t('tr_label', { lang: LANG_INFO[reader].name }) }),
            h('p', { lang: LANG_INFO[reader].tag, dir: 'auto', 'data-testid': 'translation', text: tr.translation })),
          h('div', { class: 'card' },
            h('p', { class: 'eyebrow', text: t('back_check', { lang: LANG_INFO[lang].name }) }),
            h('p', { 'data-testid': 'back-translation', text: tr.back }))));
      }
      if (!relayAvailable())
        // No relay: no fake Translate button, just the honest fallback.
        return fill(slotTr, h('p', { class: 'secondary muted', 'data-testid': 'tr-off', text: t('tr_off') }));
      fill(slotTr, h('div', { class: 'reach__tr' },
        button(t(busy ? 'translating' : 'translate'), async () => {
          busy = true; say(''); drawTranslate();
          try {
            const r = await translateMessage(msgText(), lang, reader);
            update((x) => ({ ...x, msg: { ...x.msg, tr: r, trFor: `${reader}|${msgText()}` } }));
          } catch {
            say(t('tr_off'));
          }
          busy = false; drawTranslate(); drawActions();
        }, { kind: 'soft', id: 'translate', disabled: busy }),
        noteLine(t('tr_note'), 'spark')));
    };

    const drawActions = () => {
      const tr = session().msg.lang !== lang ? currentTr() : null;
      const text = tr ? tr.translation : msgText();
      view.actions(
        tr ? button(t('copy_tr'), () => copy(tr.translation), { id: 'copy-tr' }) : button(t('share_copy'), () => copy(msgText()), { id: 'copy-msg' }),
        h('div', { class: 'actions__row' },
          tr ? button(t('share_copy'), () => copy(msgText()), { kind: 'plain' }) : null,
          canShare() ? button(t('share_sheet'), () => shareText(text), { kind: 'plain', id: 'share' }) : null),
      );
    };

    const drawKeep = () => {
      const kept = session().msg.keep;
      const slot = $('[data-testid=keep-msg]', b) || $('[data-slot=keep]', b);
      const btn = button(t(kept ? 'keep_msg_done' : 'keep_msg_btn'), () => { update(S.keepMsg); drawKeep(); }, { kind: 'plain', id: 'keep-msg', disabled: kept });
      slot.replaceWith(btn);
    };

    const drawAll = () => {
      const s = session();
      if (!s.msg.edited) msg.value = msgText();
      drawChips();
      drawTranslate();
      drawActions();
    };

    msg.value = msgText();
    $('[data-slot=edited]', b).hidden = !session().msg.edited;
    drawKeep();
    put(b, 'back', button(t('back_choices'), back, { kind: 'soft', id: 'back-choices' }));
    drawAll();
  },
};
