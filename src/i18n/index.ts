import { useSyncExternalStore } from 'react';
import { Language } from './language.enum';
import { TextKey } from './text.enum';
import { japanese } from './impl/japanese.impl';
import { mandarin } from './impl/mandarin.impl';
import { english } from './impl/english.impl';
import { portuguese } from './impl/portuguese.impl';

export { Language, TextKey };

export const languageImplementations = [japanese, mandarin, english, portuguese] as const;
const storageKey = 'keyball.language';
const listeners = new Set<() => void>();

export function isLanguage(value: unknown): value is Language {
  return languageImplementations.some(implementation => implementation.language === value);
}

function readStoredLanguage(): Language {
  try {
    const saved = localStorage.getItem(storageKey);
    return isLanguage(saved) ? saved : Language.Japanese;
  } catch {
    return Language.Japanese;
  }
}

let language = readStoredLanguage();
export const getLanguage = () => language;

export function setLanguage(next: Language): void {
  if (!isLanguage(next)) return;
  try { localStorage.setItem(storageKey, next); } catch { /* Keep the selection in memory. */ }
  if (next === language) return;
  language = next;
  listeners.forEach(listener => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function useLanguage(): Language {
  return useSyncExternalStore(subscribe, getLanguage, () => Language.Japanese);
}

export function translate(key: TextKey, parameters: Record<string, string | number> = {}): string {
  const implementation = languageImplementations.find(item => item.language === language) ?? japanese;
  const message = implementation.messages[key] ?? japanese.messages[key];
  // Replace once, without interpreting values as HTML or as further placeholders.
  return message.replace(/\{(p\d+)\}/g, (placeholder, name: string) =>
    Object.hasOwn(parameters, name) ? String(parameters[name]) : placeholder);
}

// Legacy category/panel names are also used as stable filter values. Translate only
// their displayed labels, never their stored identifiers or device payloads.
const labelKeys = new Map(Object.entries(japanese.messages).map(([key, value]) => [value, key as TextKey]));
export function translateLabel(label: string): string {
  const key = labelKeys.get(label);
  return key ? translate(key) : label;
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', event => {
    if (event.key !== storageKey && event.key !== null) return;
    const next = readStoredLanguage();
    if (language === next) return;
    language = next;
    listeners.forEach(listener => listener());
  });
}
