/**
 * Feel, step 1. Pictures (choose 1–2) or her own words. "I don't have the
 * words" is always there and opens Psalm 77. Continue is tap 3 to Scripture.
 */
import { $, fill, put, announce } from '../../js/lib/dom.js';
import { t } from '../../js/i18n.js';
import { session, update, openPictures, endSession } from '../../js/state/session-store.js';
import * as S from '../../js/state/session.js';
import { button, noteLine, segmented, onceAtATime } from '../../js/components/ui.js';
import { pictureGrid } from '../../js/components/picture-grid.js';
import { openSheet } from '../../js/components/sheet.js';
import { tip } from '../../js/components/tips.js';
import { currentLang } from '../../js/i18n.js';
import { go, back } from '../../js/router.js';

export default {
  session: true,
  mount(view) {
    const b = view.body;
    const s0 = session();
    view.header({
      inSession: true,
      step: 1,
      back: () => {
        if (S.hasTyped(session(), currentLang())) return openSheet('exit');
        endSession();
        back();
      },
    });

    const grid = pictureGrid(s0.pics, (k) => {
      update((x) => S.togglePic(x, k));
      draw();
      announce(t('pics_count', { n: session().pics.length }));
    });
    fill($('[data-slot=grid]', b), grid);

    const input = $('[data-slot=input]', b);
    input.value = s0.words;
    fill($('[data-slot=ai-note]', b), noteLine(t('ai_note'), 'spark'));
    put(b, 'tip', tip(['feel_tabs', 'feel_nowords'], { guided: s0.guided }));

    const tabs = $('[data-slot=tabs]', b);
    const cont = button(t('continue'), onceAtATime(() => openPictures() && go('scripture')), { id: 'continue' });
    const find = button(t('find_story'), () => session().words.trim() && go('thinking'), { id: 'find-story' });
    const noWords = button(t('no_words'), () => {
      update(S.openNoWords);
      go('scripture');
    }, { kind: 'quiet', id: 'no-words' });

    input.addEventListener('input', () => {
      update((x) => ({ ...x, words: input.value }));
      find.disabled = !input.value.trim();
    });

    const draw = () => {
      const s = session();
      const words = s.mode === 'words';
      $('[data-slot=title]', b).textContent = t(words ? 'words_title' : 'pics_title');
      fill(
        tabs,
        segmented(
          t('pics_eyebrow'),
          [
            { key: 'pics', label: t('tab_pics'), id: 'tab-pics' },
            { key: 'words', label: t('tab_words'), id: 'tab-words' },
          ],
          s.mode,
          (m) => {
            update((x) => ({ ...x, mode: m }));
            draw();
            if (m === 'words') input.focus();
          },
        ),
      );
      $('[data-slot=pics]', b).hidden = words;
      $('[data-slot=words]', b).hidden = !words;
      grid.update(s.pics);
      $('[data-slot=count]', b).textContent = s.pics.length ? t('pics_count', { n: s.pics.length }) : ' ';
      cont.disabled = !s.pics.length;
      find.disabled = !s.words.trim();
      view.actions(words ? find : cont, noWords);
    };
    draw();
  },
};
