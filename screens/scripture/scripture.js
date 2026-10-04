/**
 * Scripture, step 2. Continue → Pray. "This doesn't fit me" opens the sheet
 * with another story, the lament psalms, or different pictures.
 */
import { $, h, put } from '../../js/lib/dom.js';
import { t, currentLang } from '../../js/i18n.js';
import { C, P, B, sceneUrl, storySource } from '../../js/content.js';
import { session } from '../../js/state/session-store.js';
import * as S from '../../js/state/session.js';
import { button, heading, lead, saidCard } from '../../js/components/ui.js';
import { icon } from '../../js/components/icons.js';
import { pageCard } from '../../js/components/page-card.js';
import { openSheet } from '../../js/components/sheet.js';
import { tip } from '../../js/components/tips.js';
import { go, back } from '../../js/router.js';

export default {
  session: true,
  mount(view) {
    const b = view.body;
    const s = session();
    const lang = currentLang();
    const path = s.path;
    view.header({ inSession: true, step: 2, back });

    $('[data-slot=scene-img]', b).src = sceneUrl(path);
    $('[data-slot=name]', b).textContent = P(path, 'name', lang);
    $('[data-slot=title]', b).textContent = P(path, 'title', lang);

    // Own words: "You said", then the AI's one-line reason (never Scripture), or the unsure line.
    if (s.from === 'words') {
      const ai = s.ai;
      const extra = [h('p', { class: 'secondary', text: t('ai_thanks') })];
      if (!s.swapped && ai?.unsure) extra.push(h('p', { class: 'secondary', 'data-testid': 'ai-reason', text: t('ai_start') }));
      if (!s.swapped && ai && !ai.unsure && ai.reason)
        extra.push(h('p', { class: 'secondary ai-reason', 'data-testid': 'ai-reason' }, icon('spark', 16), h('span', { text: ai.reason })));
      if (!s.swapped && ai?.source === 'local' && !ai.unsure)
        extra.push(h('p', { class: 'eyebrow', 'data-testid': 'ai-local-tag', text: t('ai_local') }));
      put(b, 'intro', saidCard(t('you_said'), s.words.trim(), ...extra), heading(`${P(path, 'name', lang)}: ${P(path, 'title', lang)}`, { srOnly: true }));
    } else {
      const br = S.bridgeFor(s, lang, B);
      put(b, 'intro', br ? [heading(br.h), lead(br.p)] : null);
    }

    // Psalm 77 is honest lament: pair it with Help.
    put(b, 'nw-help', path === C.nw ? button(t('help_title'), () => go('help'), { kind: 'plain', id: 'nw-help' }) : null);
    put(b, 'tip', tip(['scripture_full', 'scripture_nofit'], { guided: s.guided }));
    put(b, 'card', pageCard(path));
    $('[data-slot=invite]', b).textContent = P(path, 'invite', lang);

    const story = P(path, 'story', lang);
    put(
      b,
      'about',
      story.length
        ? h(
            'details',
            { class: 'about', 'data-testid': 'about' },
            h('summary', { 'data-testid': 'about-toggle' }, h('span', { text: t('about', { name: P(path, 'name', lang) }) }), icon('chevron', 20)),
            h(
              'div',
              { class: 'about__body' },
              h('p', { text: P(path, 'intro', lang) }),
              story.map((para) => h('p', { text: para })),
              h('p', { class: 'secondary muted', 'data-testid': 'story-src', text: t('story_src', { ref: storySource(path, lang) }) }),
            ),
          )
        : h('p', { class: 'secondary muted', text: P(path, 'intro', lang) }),
    );

    view.actions(
      button(t('continue_ready'), () => go('pray'), { id: 'to-pray' }),
      button(t('not_fit'), () => openSheet('nofit'), { kind: 'quiet', id: 'not-fit' }),
    );
  },
};
