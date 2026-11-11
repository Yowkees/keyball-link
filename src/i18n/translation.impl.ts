import type { Language } from './language.enum';
import type { TextKey } from './text.enum';

export interface TranslationImplementation {
  readonly language: Language;
  readonly nativeName: string;
  readonly messages: Readonly<Record<TextKey, string>>;
}
