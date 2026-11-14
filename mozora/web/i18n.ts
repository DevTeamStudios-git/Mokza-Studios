// Mozora i18n (brief section 6, rule 3). French (fr-CA) by default. The host's `mokza_language` is
// honoured only when it is exactly "fr" or "en"; anything else, including the host's "es", means fr.
// navigator.language is deliberately ignored.
import en from '../i18n/en.json';
import fr from '../i18n/fr.json';

export type Lang = 'fr' | 'en';
export type MessageKey = keyof typeof fr;

const dictionaries: Record<Lang, Record<MessageKey, string>> = { fr, en };

export function pickLanguage(stored: string | null): Lang {
  return stored === 'en' ? 'en' : 'fr';
}

export function currentLanguage(): Lang {
  try {
    return pickLanguage(localStorage.getItem('mokza_language'));
  } catch {
    return 'fr';
  }
}

export function translate(lang: Lang, key: MessageKey, params: Record<string, string> = {}): string {
  const template = dictionaries[lang][key];
  return template.replace(/\{(\w+)\}/g, (match, name: string) => params[name] ?? match);
}
