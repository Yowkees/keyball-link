// Focused regression checks; runs in the Docker build, without browser or USB access.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function createRuntime(savedLanguage = null, blockedStorage = false, realReact = false) {
  let stored = savedLanguage;
  let updates = 0;
  const storageEvents = [];
  const cache = new Map();
  const storage = {
    getItem() { if (blockedStorage) throw new Error('Storage blocked'); return stored; },
    setItem(_key, value) { if (blockedStorage) throw new Error('Storage blocked'); stored = value; },
  };
  function load(filename) {
    const resolved = [filename, `${filename}.ts`, `${filename}.tsx`, path.join(filename, 'index.ts')].find(file => fs.existsSync(file) && fs.statSync(file).isFile());
    assert.ok(resolved, `Cannot resolve ${filename}`);
    if (cache.has(resolved)) return cache.get(resolved).exports;
    const module = { exports: {} };
    cache.set(resolved, module);
    const compiled = ts.transpileModule(fs.readFileSync(resolved, 'utf8'), {
      compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
      fileName: resolved,
    }).outputText;
    const requireSource = specifier => {
      if (realReact && (specifier === 'react' || specifier === 'react/jsx-runtime')) return require(specifier);
      if (specifier === 'react') return {
        useSyncExternalStore(subscribe, getSnapshot) {
          subscribe(() => { updates++; });
          return getSnapshot();
        },
      };
      assert.ok(specifier.startsWith('.'), `Unexpected dependency ${specifier}`);
      return load(path.resolve(path.dirname(resolved), specifier));
    };
    vm.runInNewContext(compiled, {
      module, exports: module.exports, require: requireSource, localStorage: storage,
      window: { addEventListener: (_name, callback) => storageEvents.push(callback) },
    }, { filename: resolved });
    return module.exports;
  }
  return {
    load: file => load(path.resolve(__dirname, '..', file)),
    stored: () => stored,
    updates: () => updates,
    externalLanguage(value) { stored = value; storageEvents.forEach(callback => callback({ key: 'keyball.language' })); },
  };
}

const runtime = createRuntime();
const i18n = runtime.load('src/i18n/index.ts');
const { Language, TextKey, translate, translateLabel, setLanguage, getLanguage, languageImplementations } = i18n;
const allKeys = Object.values(TextKey).sort();
const tokens = message => [...message.matchAll(/\{p\d+\}/g)].map(match => match[0]).sort().join(',');
const sourceMessages = languageImplementations[0].messages;
assert.equal(getLanguage(), Language.Japanese, 'Japanese must be the default');
assert.equal(new Set(languageImplementations.map(item => item.nativeName)).size, 4);
for (const implementation of languageImplementations) {
  assert.deepEqual(Object.keys(implementation.messages).sort(), allKeys, `Incomplete ${implementation.language} implementation`);
  for (const key of allKeys) {
    assert.ok(implementation.messages[key].trim(), `Empty ${implementation.language}/${key}`);
    assert.equal(tokens(implementation.messages[key]), tokens(sourceMessages[key]), `Incorrect placeholders in ${implementation.language}/${key}`);
  }
}

const keycodes = runtime.load('src/lib/keycodes.ts');
const protocol = runtime.load('src/lib/protocol.ts');
const macros = runtime.load('src/lib/textToMacro.ts');
const tips = runtime.load('src/lib/tips.ts');
const groupSnapshot = () => JSON.stringify(keycodes.KEYCODES.map(key => [key.code, key.group, !!keycodes.isKeycodeUnavailable(key, { ...keycodes.FW_ALL_AVAILABLE, media: false, gesture: false, macro: false, tapDance: false })]));
const baseGroups = groupSnapshot();
const inputSnapshot = JSON.stringify(macros.textToMacro('abc かな @', 'JIS'));
const ledIds = JSON.stringify(protocol.LED_EFFECTS.map(effect => effect.id));
const japaneseTip = tips.TIPS.cpi;
i18n.useLanguage();

for (const language of Object.values(Language)) {
  setLanguage(language);
  assert.equal(getLanguage(), language);
  assert.equal(runtime.stored(), language);
  assert.equal(groupSnapshot(), baseGroups, 'Translations must not change category identity or firmware availability');
  assert.equal(JSON.stringify(macros.textToMacro('abc かな @', 'JIS')), inputSnapshot, 'UI language must not change typed macro bytes');
  assert.equal(JSON.stringify(protocol.LED_EFFECTS.map(effect => effect.id)), ledIds);
  assert.equal(keycodes.getKeyDisplayLabel(0x87, 'JIS'), 'ろ', 'JIS characters are keyboard data');
  assert.ok(protocol.LED_EFFECTS[0].label.length);
  assert.ok(translateLabel('ホールド').length);
  if (language !== Language.Japanese) assert.notEqual(tips.TIPS.cpi, japaneseTip, 'Shared metadata must update after changing language');
}
setLanguage(Language.English);
assert.equal(translateLabel('レイヤー'), 'Layers');
assert.equal(translateLabel('MO(3)'), 'MO(3)');
assert.equal(translate(TextKey.TrackballLayerHint, { p0: 2, p1: '<script>{p0}</script>' }), 'Trackball (layer 2): <script>{p0}</script> (click to configure)', 'Parameters must remain plain text and must not be recursively interpolated');
runtime.externalLanguage(Language.Mandarin);
assert.equal(getLanguage(), Language.Mandarin);
assert.ok(runtime.updates() > 0, 'Language changes must notify React');
assert.equal(createRuntime(Language.Portuguese).load('src/i18n/index.ts').getLanguage(), Language.Portuguese);
assert.equal(createRuntime('invalid').load('src/i18n/index.ts').getLanguage(), Language.Japanese);
const blocked = createRuntime(null, true).load('src/i18n/index.ts');
blocked.setLanguage(Language.English);
assert.equal(blocked.getLanguage(), Language.English, 'Language switching must work even if storage is blocked');

// Render selectors without a browser or any hardware API. This catches translated
// labels accidentally replacing the stable category/panel values used by filters.
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const uiRuntime = createRuntime(null, false, true);
const uiLanguage = uiRuntime.load('src/i18n/index.ts');
const { TapKeyPicker, KeyConfigModal } = uiRuntime.load('src/components/KeyConfigModal/KeyConfigModal.tsx');
for (const language of Object.values(Language)) {
  uiLanguage.setLanguage(language);
  const props = { value: 0, keyLayout: 'JIS', onChange() {} };
  const picker = renderToStaticMarkup(React.createElement(TapKeyPicker, props));
  const modal = renderToStaticMarkup(React.createElement(KeyConfigModal, {
    currentCode: 4, keyLayout: 'JIS', defaultPanel: '通常', onSelect() {}, onClose() {},
  }));
  assert.ok(picker.includes(uiLanguage.translate(TextKey.All)), 'Tap picker must display the translated All category');
  assert.ok(modal.includes(uiLanguage.translate(TextKey.Custom)), 'Panel labels must translate without changing panel IDs');
  assert.ok((picker.match(/class="picker-key/g) ?? []).length > 20, 'All-category filtering must still show keys');
  assert.ok(modal.includes('picker-key'), 'Normal panel must render after selecting another language');
}
console.log(`i18n checks passed: ${allKeys.length} messages, four implementations, persistence, placeholders and keyboard invariants.`);
