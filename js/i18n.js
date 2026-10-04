/**
 * Strings in five languages, from data/lang.<code>.json (exported from the
 * phone app; never hand-edited).
 *
 * Lookup order (kept from the Design Lab): her language → English → the key.
 * Placeholders are written {n}; Burmese gets Burmese digits for {n}.
 * Plurals pick key_one / key_two / key_few / key_many / key_other with
 * Intl.PluralRules, as the phone app does.
 */
import { prefs } from './state/prefs.js';

export const LANGS = ['en', 'my', 'zh', 'ja', 'ar'];
export const LANG_INFO = {
  en: { name: 'English', en: 'English', tag: 'en', rtl: false },
  my: { name: 'မြန်မာ', en: 'Burmese', tag: 'my', rtl: false },
  zh: { name: '简体中文', en: 'Simplified Chinese', tag: 'zh-Hans', rtl: false },
  ja: { name: '日本語', en: 'Japanese', tag: 'ja', rtl: false },
  ar: { name: 'العربية', en: 'Arabic', tag: 'ar', rtl: true },
};

const packs = {}; // lang → { strings, paths, bridges }

export async function loadLang(lang) {
  if (!packs[lang]) {
    const res = await fetch(`data/lang.${lang}.json`);
    if (!res.ok) throw new Error(`lang ${lang}: HTTP ${res.status}`);
    packs[lang] = await res.json();
  }
  return packs[lang];
}

export const pack = (lang) => packs[lang];
export const currentLang = () => prefs().lang || 'en';

const MY_DIGITS = '၀၁၂၃၄၅၆၇၈၉';
export const localizeDigits = (s, lang = currentLang()) =>
  lang === 'my' ? String(s).replace(/[0-9]/g, (d) => MY_DIGITS[Number(d)]) : String(s);

function raw(key, lang) {
  return packs[lang]?.strings[key] ?? packs.en?.strings[key];
}

function fill(str, vars, lang) {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (m, k) => {
    if (vars[k] == null) return m;
    return k === 'n' ? localizeDigits(vars[k], lang) : String(vars[k]);
  });
}

/** Translate `key` in the current language. */
export function t(key, vars, lang = currentLang()) {
  const s = raw(key, lang);
  return s == null ? key : fill(s, vars, lang);
}

export const hasKey = (key, lang = currentLang()) => packs[lang]?.strings[key] != null;

/** Plural-aware translate: picks the form for `n` (CLDR rules). */
export function tc(key, n, vars, lang = currentLang()) {
  const v = { ...vars, n };
  const cat = new Intl.PluralRules(LANG_INFO[lang].tag).select(n);
  const own = packs[lang]?.strings;
  const s = own?.[`${key}_${cat}`] ?? own?.[`${key}_other`];
  if (s != null) return fill(s, v, lang);
  const enCat = new Intl.PluralRules('en').select(n);
  const en = packs.en?.strings;
  const e = en?.[`${key}_${enCat}`] ?? en?.[`${key}_other`] ?? raw(key, lang);
  return e == null ? key : fill(e, v, lang);
}

/**
 * Fills static text in a template: data-t="key" sets textContent,
 * data-t-aria="key" sets aria-label, data-t-ph="key" sets placeholder.
 */
export function applyT(root) {
  for (const el of root.querySelectorAll('[data-t]')) el.textContent = t(el.dataset.t);
  for (const el of root.querySelectorAll('[data-t-aria]')) el.setAttribute('aria-label', t(el.dataset.tAria));
  for (const el of root.querySelectorAll('[data-t-ph]')) el.setAttribute('placeholder', t(el.dataset.tPh));
}

/** Sets <html lang/dir>. The browser flips the layout for Arabic: no reload needed. */
export function applyDocumentLang(lang) {
  const info = LANG_INFO[lang];
  document.documentElement.lang = info.tag;
  document.documentElement.dir = info.rtl ? 'rtl' : 'ltr';
}
