import { isLanguage, languageImplementations, setLanguage, TextKey, translate, useLanguage } from './index';

export function LanguageSelect() {
  const language = useLanguage();
  return (
    <label className="language-picker">
      <span>{translate(TextKey.Language)}</span>
      <select
        value={language}
        aria-label={translate(TextKey.ChooseLanguage)}
        onChange={event => {
          if (isLanguage(event.target.value)) setLanguage(event.target.value);
        }}
      >
        {languageImplementations.map(implementation => (
          <option key={implementation.language} value={implementation.language} lang={implementation.language}>
            {implementation.nativeName}
          </option>
        ))}
      </select>
    </label>
  );
}
