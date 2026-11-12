import { useState, useEffect, useRef } from 'react';
import {
  KEYCODES, findKeycode, getKeyDisplayLabel, getKeyDescription, JIS_TAP_KEYS, isKeycodeUnavailable, FW_ALL_AVAILABLE, tl,
} from '../../lib/keycodes';
import type { KeycodeEntry, KeyLayout, FirmwareAvail } from '../../lib/keycodes';
import {
  makeModTapKeycode, makeLtKeycode, getLayerTapLayers,
  makeModsKeycode, MODIFIER_BITS, MOD_RIGHT_BIT,
} from '../../lib/protocol';
import { t, tk } from '../../lib/i18n';
import { useKeySearchNav } from './useKeySearchNav';

export type PanelType = '通常' | 'ホールド' | 'カスタム';

interface KeyConfigModalProps {
  keyIndex?: number;
  currentCode: number;
  keyLayout: KeyLayout;
  defaultPanel?: PanelType;
  hideHold?: boolean;     // ホールドタブを隠す（ジェスチャー割り当てなど押下時間の概念がない用途）
  avail?: FirmwareAvail;  // 接続中ファームで使えない機能のキーをグレーアウト
  layerCount?: number;    // 接続中ファームの実際のレイヤー数（未指定時は4）
  allowedGroups?: string[]; // 指定時、通常パネルの候補をこのグループのみに絞る（マクロ登録など）
  excludeCode?: (code: number) => boolean; // trueのキーは候補から外し、カスタム入力でも設定不可にする
  onSelect: (keycode: number) => void;
  onClose: () => void;
}

// ── グループ定義 ──────────────────────────────────────────
// タップダンス非対応ファーム（AVR版）接続時は「レイヤー」カテゴリからタップダンス
// サブグループ自体を除外する（avail.tapDanceに応じて動的に切り替えるため関数化）。
function buildGroupCategories(tapDanceAvail: boolean): { label: string; groups: string[] }[] {
  return [
    { label: tk('すべて'),     groups: [] },
    { label: tk('文字/数字'),  groups: ['文字', '数字'] },
    { label: tk('記号'),       groups: ['記号', 'Shift記号', 'JIS記号'] },
    { label: tk('操作'),       groups: ['基本', '修飾', '矢印', 'システム'] },
    { label: tk('F/テンキー'), groups: ['F', 'テンキー'] },
    { label: tk('日本語'),     groups: ['日本語'] },
    { label: tk('レイヤー'),   groups: tapDanceAvail ? ['レイヤー', 'ワンショット', 'タップダンス'] : ['レイヤー', 'ワンショット'] },
    { label: tk('マウス'),     groups: ['マウス'] },
    { label: tk('メディア'),   groups: ['メディア'] },
    { label: 'RGB',        groups: ['RGB'] },
    { label: 'Keyball',    groups: ['Keyball'] },
    { label: tk('マクロ'),     groups: ['マクロ'] },
    { label: tk('特殊'),       groups: ['特殊'] },
  ];
}

// 修飾と組み合わせ可能な基本キー（0xFF以下）かどうか
function isBasicKey(code: number): boolean {
  return code > 0 && code <= 0xFF;
}

// MT/LT タップキー用グループ（基本キーコード ≤ 0xFF のみ）
const TAP_KEY_GROUPS: { label: string; keys: KeycodeEntry[] }[] = [
  { label: tk('文字'),    keys: KEYCODES.filter(k => k.group === '文字') },
  { label: tk('数字'),    keys: KEYCODES.filter(k => k.group === '数字') },
  { label: tk('基本'),    keys: KEYCODES.filter(k => k.group === '基本') },
  { label: tk('矢印'),    keys: KEYCODES.filter(k => k.group === '矢印') },
  { label: 'F',       keys: KEYCODES.filter(k => k.group === 'F') },
  { label: tk('修飾'),    keys: KEYCODES.filter(k => k.group === '修飾') },
  { label: tk('記号'),    keys: KEYCODES.filter(k => k.group === '記号') },
  { label: tk('JIS記号'), keys: JIS_TAP_KEYS },
  { label: tk('マウス'),  keys: KEYCODES.filter(k => k.group === 'マウス') },
  { label: tk('日本語'),  keys: KEYCODES.filter(k => k.group === '日本語') },
];

// ── タップキーピッカー（ホールドタブのタップ側・ジェスチャーのタップ側で使用） ──────
export function TapKeyPicker({ value, keyLayout, autoFocus, onChange }: {
  value: number;
  keyLayout: KeyLayout;
  autoFocus?: boolean;  // true: 開いた時に検索欄へカーソルを置く（すぐ検索語を打てる）
  onChange: (kc: number) => void;
}) {
  const [search, setSearch] = useState('');
  const [activeGroup, setActiveGroup] = useState('すべて');
  const [hoverDesc, setHoverDesc] = useState<string | null>(null);

  const groups = ['すべて', ...TAP_KEY_GROUPS.map(g => g.label)];
  const allKeys = TAP_KEY_GROUPS.flatMap(g => g.keys.map(k => ({ ...k, groupLabel: g.label })));

  const filtered = allKeys.filter(k => {
    if (activeGroup !== 'すべて' && k.groupLabel !== activeGroup) return false;
    if (k.layout && k.layout !== keyLayout) return false;
    if (search) {
      const q = search.toLowerCase();
      const disp = getKeyDisplayLabel(k.code, keyLayout).toLowerCase();
      return disp.includes(q) || k.short.toLowerCase().includes(q);
    }
    return true;
  });

  // 検索中は矢印キーで結果を選び、Enterで決める
  const { cursor: navCursor, gridRef: navGridRef, onKeyDown: navKeyDown } = useKeySearchNav({
    count: filtered.length,
    active: search.trim() !== '',
    resetKey: `${search}|${activeGroup}`,
    isSelectable: () => true,
    onPick: i => onChange(filtered[i].code),
  });

  return (
    <div className="tap-picker">
      <div className="tap-picker__search-wrap">
        <input
          className="modal-search__input" type="text" placeholder={t('キーを検索…')}
          value={search} onChange={e => { setSearch(e.target.value); setActiveGroup('すべて'); }}
          onKeyDown={navKeyDown}
          autoFocus={autoFocus}
        />
        {search && <button className="modal-search__clear" onClick={() => setSearch('')}>✕</button>}
      </div>
      {!search && (
        <div className="tap-picker__tabs">
          {groups.map(g => (
            <button key={g} className={`tab ${activeGroup === g ? 'tab--active' : ''}`} onClick={() => setActiveGroup(g)}>{t(g)}</button>
          ))}
        </div>
      )}
      <div className="tap-picker__grid" ref={navGridRef}>
        {/* 検索中は「なし」を出さない（一致したキーが先頭に来て、すぐ選べるように） */}
        {!search && (
          <button className={`picker-key ${value === 0 ? 'picker-key--current' : ''}`} onClick={() => onChange(0)} onMouseEnter={() => setHoverDesc(null)} title={t('なし')}>
            <span className="picker-key__char">—</span>
            <span className="picker-key__name">{t('なし')}</span>
          </button>
        )}
        {filtered.map((k, i) => (
          <button
            // 同じキーが別のグループにもある（例: 記号とJIS記号）ので、グループ名も含めて区別する
            key={`${k.groupLabel}-${k.code}`}
            data-nav-idx={i}
            className={`picker-key ${k.code === value ? 'picker-key--current' : ''} ${navCursor === i ? 'picker-key--cursor' : ''}`}
            onClick={() => onChange(k.code)}
            onMouseEnter={() => setHoverDesc(getKeyDescription(k.code, keyLayout))}
            onMouseLeave={() => setHoverDesc(null)}
            title={`${k.short} (0x${k.code.toString(16).toUpperCase()})`}
          >
            <span className="picker-key__char">{getKeyDisplayLabel(k.code, keyLayout)}</span>
            <span className="picker-key__name">{tl(k.short)}</span>
          </button>
        ))}
        {filtered.length === 0 && <p className="picker-empty">{t('一致するキーが見つかりません')}</p>}
      </div>
      <div className="key-desc-bar" style={{ marginTop: 8 }}>
        {hoverDesc ?? t('キーにマウスを乗せると説明が表示されます')}
      </div>
    </div>
  );
}

// ── 通常キーパネル（修飾キー付加対応） ────────────────────
function NormalPanel({ currentCode, keyLayout, avail, allowedGroups, excludeCode, compact, liveMods, onSelect }: {
  currentCode: number;
  keyLayout: KeyLayout;
  avail: FirmwareAvail;
  allowedGroups?: string[];
  excludeCode?: (code: number) => boolean;
  compact?: boolean;  // true: カテゴリはドロップダウン+検索を横並び、キーは5列固定（右側常時パネル用）
  // true: 修飾キーのボタンを押すと、選択中のキーにその場で付け外しする（右側常時パネルでキー選択中のみ。
  // 2026-11-12 本人決定。別ウィンドウの選択画面は従来どおり「先に修飾キー → キーを押す」）
  liveMods?: boolean;
  onSelect: (c: number) => void;
}) {
  const [activeCategory, setActiveCategory] = useState('すべて');
  const [search, setSearch] = useState('');
  const [hoverDesc, setHoverDesc] = useState<string | null>(null);
  // 現在のコードがMODSなら修飾を復元
  const isMods = currentCode >= 0x0100 && currentCode <= 0x1FFF;
  const [mods, setMods] = useState(isMods ? (currentCode >> 8) & 0x1F : 0);

  const baseKeys = KEYCODES.filter(k =>
    (k.group !== 'タップダンス' || avail.tapDance) &&
    (!allowedGroups || allowedGroups.includes(k.group)) &&
    !excludeCode?.(k.code)
  );

  const groupCategories = buildGroupCategories(baseKeys.some(k => k.group === 'タップダンス'));
  const categories = allowedGroups
    ? groupCategories.filter(cat => cat.groups.length === 0 || cat.groups.some(g => allowedGroups.includes(g)))
    : groupCategories;

  const filtered = baseKeys.filter(k => {
    if (k.layout && k.layout !== keyLayout) return false;
    if (activeCategory !== 'すべて') {
      const cat = groupCategories.find(c => c.label === activeCategory);
      if (cat && cat.groups.length > 0 && !cat.groups.includes(k.group)) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      const disp = getKeyDisplayLabel(k.code, keyLayout).toLowerCase();
      return disp.includes(q) || k.short.toLowerCase().includes(q) || k.label.toLowerCase().includes(q);
    }
    return true;
  });

  const right = (mods & MOD_RIGHT_BIT) !== 0;
  const modsActive = (mods & 0x0F) !== 0;

  // 選択中のキーの「元のキー」（Shift+A なら A）。修飾キーと組み合わせられない
  // キー（レイヤー切替・ホールド付きなど）や、なし／透過（0x00〜0x03）なら 0
  const liveBase = (() => {
    if (!liveMods) return 0;
    const isModsCode = currentCode >= 0x0100 && currentCode <= 0x1FFF;
    if (!isModsCode && !isBasicKey(currentCode)) return 0;
    const base = currentCode & 0xFF;
    return base >= 0x04 ? base : 0;
  })();

  const toggleMod = (bit: number) => {
    const next = mods ^ bit;
    setMods(next);
    // 選択中のキーに、その場で修飾キーを付け外しする（例: A → Shift+A → A）。
    // 修飾キーが1つも無くなったら元のキーだけに戻す
    if (liveBase) {
      const code = (next & 0x0F) ? makeModsKeycode(next, liveBase) : liveBase;
      if (code !== currentCode) onSelect(code);
    }
  };

  // キークリック時：修飾が選択されていて基本キーなら MODS、それ以外は素のコード
  const handleKey = (code: number) => {
    if (modsActive && isBasicKey(code)) {
      onSelect(makeModsKeycode(mods, code));
    } else {
      onSelect(code);
    }
  };

  // このファームで使えないキーと、修飾キーと組み合わせられないキーは選べない（薄く表示する）
  const isDimmed = (e: KeycodeEntry) => (modsActive && !isBasicKey(e.code)) || isKeycodeUnavailable(e, avail);

  // 検索中は矢印キーで結果を選び、Enterで決める（クリックと同じ処理）
  const { cursor: navCursor, gridRef: navGridRef, onKeyDown: navKeyDown } = useKeySearchNav({
    count: filtered.length,
    active: search.trim() !== '',
    resetKey: `${search}|${activeCategory}|${mods}`,
    isSelectable: i => !isDimmed(filtered[i]),
    onPick: i => handleKey(filtered[i].code),
  });

  // 右側常時パネルでキーを選んだら、検索欄にカーソルを置く（すぐ検索語を打てる）。
  // 画面が勝手にスクロールしないよう preventScroll を付ける
  const compactSearchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (liveMods) compactSearchRef.current?.focus({ preventScroll: true });
  }, [liveMods]);

  const modLabel = MODIFIER_BITS.filter(m => mods & m.bit)
    .map(m => (right ? 'R' : '') + m.label).join('+');

  return (
    <>
      {/* 修飾キー付加バー */}
      <div className="mod-bar">
        <div className="mod-bar__row">
          {MODIFIER_BITS.map(m => (
            <button
              key={m.bit}
              className={`btn btn--small btn--layer ${mods & m.bit ? 'btn--layer-active' : ''}`}
              onClick={() => toggleMod(m.bit)}
            >
              {(right ? 'R' : '') + m.label}
            </button>
          ))}
          <button
            className={`btn btn--small btn--layer ${right ? 'btn--layer-active' : ''}`}
            onClick={() => toggleMod(MOD_RIGHT_BIT)}
            title={t('左右の修飾キーを切り替え')}
          >
            {t('右側')}
          </button>
        </div>
        {modsActive && (
          <span className="mod-bar__hint">
            {t('選択中:')} <strong>{modLabel}</strong> {t('＋ クリックしたキー')}
          </span>
        )}
      </div>

      {compact ? (
        <div className="key-picker-toolbar">
          <select
            className="key-picker-toolbar__select"
            value={activeCategory}
            onChange={e => setActiveCategory(e.target.value)}
          >
            {categories.map(cat => (
              <option key={cat.label} value={cat.label}>{t(cat.label)}</option>
            ))}
          </select>
          <div className="key-picker-toolbar__search">
            <span className="key-picker-toolbar__chevron">›</span>
            <input
              type="text" placeholder={t('キーを検索…')}
              value={search} onChange={e => setSearch(e.target.value)}
              onKeyDown={navKeyDown}
              ref={compactSearchRef}
            />
          </div>
        </div>
      ) : (
        <>
          <div className="modal-search">
            <input
              className="modal-search__input" type="text" placeholder={t('キーを検索…')}
              value={search} onChange={e => { setSearch(e.target.value); setActiveCategory('すべて'); }}
              onKeyDown={navKeyDown}
              autoFocus
            />
            {search && <button className="modal-search__clear" onClick={() => setSearch('')}>✕</button>}
          </div>
          {!search && (
            <div className="modal-panel__tabs">
              {categories.map(cat => (
                <button key={cat.label} className={`tab ${activeCategory === cat.label ? 'tab--active' : ''}`} onClick={() => setActiveCategory(cat.label)}>{t(cat.label)}</button>
              ))}
            </div>
          )}
        </>
      )}
      <div className="key-desc-bar" style={{ marginBottom: 8 }}>
        {hoverDesc ?? t('キーにマウスを乗せると説明が表示されます')}
      </div>
      <div className={`modal-panel__grid ${compact ? 'modal-panel__grid--compact' : ''}`} ref={navGridRef}>
        {filtered.map((e: KeycodeEntry, i) => {
          const fwUnavail = isKeycodeUnavailable(e, avail);
          const dimmed = isDimmed(e);
          return (
            <button
              key={`${e.group}-${e.code}`}
              data-nav-idx={i}
              className={`picker-key ${e.code === currentCode ? 'picker-key--current' : ''} ${dimmed ? 'picker-key--dim' : ''} ${navCursor === i ? 'picker-key--cursor' : ''}`}
              draggable={!fwUnavail}
              onDragStart={ev => { if (fwUnavail) { ev.preventDefault(); return; } ev.dataTransfer.setData('text/plain', String(modsActive && isBasicKey(e.code) ? makeModsKeycode(mods, e.code) : e.code)); }}
              onClick={() => { if (!fwUnavail) handleKey(e.code); }}
              onMouseEnter={() => setHoverDesc(dimmed ? null : getKeyDescription(e.code, keyLayout))}
              onMouseLeave={() => setHoverDesc(null)}
              title={fwUnavail ? t('{0} — このファーム版では使用できません', tl(e.short)) : dimmed ? t('修飾キーと組み合わせできません') : `${e.short} (0x${e.code.toString(16).toUpperCase()})`}
            >
              <span className="picker-key__char">{getKeyDisplayLabel(e.code, keyLayout)}</span>
              <span className="picker-key__name">{tl(e.short)}</span>
            </button>
          );
        })}
        {filtered.length === 0 && <p className="picker-empty">{t('一致するキーが見つかりません')}</p>}
      </div>
      <p className="modal-result-count">{t('{0} キー', filtered.length)}</p>
    </>
  );
}

// ── ホールドパネル（Mod-Tap / Layer-Tap） ──
// 2026-09-18: 「ジェスチャー」「精密モード」のホールド割当（タップダンス枠を裏で
// 流用する実装）は、2つ目のキーに設定しようとすると同じTD枠を取り合って1つ目の
// 設定を上書きしてしまう不具合があり、本人判断でこのパネルからは撤去した。
// GST_HOLD/GST_HOLD2〜4・PRC_MOは元々「通常」タブの単純なタップキーとしても
// 選択できる（keycodes.tsのKEYCODES参照）ため、ホールド動作としてではなく
// タップキーとして割り当てる運用に一本化する。
type HoldKind = 'mod' | 'layer';

function HoldPanel({ currentCode, keyLayout, layerCount, onSelect }: {
  currentCode: number;
  keyLayout: KeyLayout;
  layerCount?: number;
  onSelect: (c: number) => void;
}) {
  const isMT = currentCode >= 0x2000 && currentCode <= 0x3FFF;
  // Layer-Tap はレイヤー0〜15（0x4000〜0x4FFF）。以前は0〜3（〜0x43FF）しか見分けられず、
  // RP2040版（8レイヤー）で「長押しでレイヤー4〜7」を開き直すと表示が崩れていた（2026-11-12修正）
  const isLT = currentCode >= 0x4000 && currentCode <= 0x4FFF;
  // タップキーのみ登録済み（通常キー、または修飾+キーのMODS）のところへホールド
  // 動作を追加する場合、既存のタップ内容を引き継ぐ（0にリセットしない）。
  const isMods = currentCode >= 0x0100 && currentCode <= 0x1FFF;
  const existingTapKc = (isMods || isBasicKey(currentCode)) ? currentCode & 0xFF : 0x00;

  // 今の設定にある修飾キー・レイヤーだけを選ばれた状態にする。未設定のキーで
  // Shift やレイヤー1を最初から選んだように見せない（2026-11-12修正）
  const [kind, setKind]     = useState<HoldKind>(isLT ? 'layer' : 'mod');
  const [mod, setMod]       = useState(isMT ? (currentCode >> 8) & 0x1F : 0);
  const [layer, setLayer]   = useState<number | null>(isLT ? (currentCode >> 8) & 0x0F : null);
  const [baseKc, setBaseKc] = useState((isMT || isLT) ? currentCode & 0xFF : existingTapKc);
  const layerTapLayers = getLayerTapLayers(layerCount);

  const modRight  = (mod & MOD_RIGHT_BIT) !== 0;
  const modActive = (mod & 0x0F) !== 0;

  const tapDisp = baseKc ? getKeyDisplayLabel(baseKc, keyLayout).replace('\n', '/') : '—';
  const modLabel = MODIFIER_BITS.filter(m => mod & m.bit).map(m => (modRight ? 'R' : '') + m.label).join('+');
  const holdLabel =
    kind === 'mod' ? (modActive ? modLabel : t('（修飾キー未選択）')) :
    layer === null ? t('（レイヤー未選択）') :
    (layerTapLayers.find(l => l.value === layer)?.label ?? t('レイヤー {0}', layer));

  // 使用者が操作した時だけ、キーボードへ反映する（開いただけ・タブを切り替えただけでは書き込まない）。
  // 「通常」タブが1クリックで即反映されるのと同じ操作感に揃える（適用ボタンは持たない）。
  // ホールドの修飾キーやレイヤーを全部外したら、タップのキーだけに戻して長押しの動きを消す
  // （以前は何も送らず、キーボードに長押しの動きが残っていた。2026-11-12修正）。
  const apply = (next: { kind: HoldKind; mod: number; layer: number | null; baseKc: number }) => {
    if (next.baseKc === 0) return;  // タップのキーが決まるまでは反映しない
    let code: number;
    if (next.kind === 'mod') {
      code = (next.mod & 0x0F) ? makeModTapKeycode(next.mod, next.baseKc) : next.baseKc;
    } else {
      code = next.layer !== null ? makeLtKeycode(next.layer, next.baseKc) : next.baseKc;
    }
    if (code !== currentCode) onSelect(code);
  };

  const toggleMod = (bit: number) => {
    const next = mod ^ bit;
    setMod(next);
    apply({ kind, mod: next, layer, baseKc });
  };
  // 選択中のレイヤーをもう一度押したら解除する
  const clickLayer = (value: number) => {
    const next = layer === value ? null : value;
    setLayer(next);
    apply({ kind, mod, layer: next, baseKc });
  };
  const changeTap = (kc: number) => {
    setBaseKc(kc);
    apply({ kind, mod, layer, baseKc: kc });
  };

  return (
    <div className="builder-panel">
      {/* ホールド時の動作カテゴリ */}
      <div className="builder-section">
        <div className="builder-section__label">{t('ホールド時の動作')}</div>
        <div className="hold-kind-tabs">
          <button className={`tab ${kind === 'mod' ? 'tab--active' : ''}`} onClick={() => setKind('mod')}>{t('修飾キー')}</button>
          <button className={`tab ${kind === 'layer' ? 'tab--active' : ''}`} onClick={() => setKind('layer')}>{t('レイヤー切替')}</button>
        </div>
        {kind === 'mod' && (
          <div className="builder-mod-buttons">
            {MODIFIER_BITS.map(m => (
              <button key={m.bit} className={`btn btn--layer btn--small ${mod & m.bit ? 'btn--layer-active' : ''}`} onClick={() => toggleMod(m.bit)}>
                {(modRight ? 'R' : '') + m.label}
              </button>
            ))}
            <button
              className={`btn btn--layer btn--small ${modRight ? 'btn--layer-active' : ''}`}
              onClick={() => toggleMod(MOD_RIGHT_BIT)}
              title={t('左右の修飾キーを切り替え')}
            >
              {t('右側')}
            </button>
          </div>
        )}
        {kind === 'layer' && (
          <div className="builder-layer-buttons">
            {layerTapLayers.map(l => (
              <button key={l.value} className={`btn btn--layer ${layer === l.value ? 'btn--layer-active' : ''}`} onClick={() => clickLayer(l.value)}>{l.label}</button>
            ))}
          </div>
        )}
      </div>

      {/* タップ時のキー（カテゴリ別）。「通常」タブと同じく、ここだけが縦に伸びて
          スクロールする（見出し・上のホールド設定は常に見えたままにする） */}
      <div className="builder-section builder-section--grow">
        <div className="builder-section__label">{t('タップ時のキー')}</div>
        <TapKeyPicker value={baseKc} keyLayout={keyLayout} autoFocus onChange={changeTap} />
      </div>

      <div className="builder-preview">
        {t('タップ:')} <strong>{tapDisp}</strong>{' / '}{t('ホールド:')} <strong>{holdLabel}</strong>
        {baseKc === 0 && <span className="builder-preview__hint">{t('（タップ時のキーを選択すると反映されます）')}</span>}
      </div>
    </div>
  );
}

// ── カスタムパネル（16進数手動入力） ──────────────────────
function CustomPanel({ currentCode, keyLayout, excludeCode, onSelect }: {
  currentCode: number;
  keyLayout: KeyLayout;
  excludeCode?: (code: number) => boolean;
  onSelect: (c: number) => void;
}) {
  const [text, setText] = useState('0x' + currentCode.toString(16).toUpperCase().padStart(4, '0'));

  const parsed = (() => {
    const t = text.trim().replace(/^0x/i, '');
    if (!/^[0-9a-fA-F]{1,4}$/.test(t)) return null;
    return parseInt(t, 16);
  })();

  const valid = parsed !== null && parsed >= 0 && parsed <= 0xFFFF;
  const entry = valid ? findKeycode(parsed) : null;
  const blocked = valid && !!excludeCode?.(parsed);

  return (
    <div className="builder-panel">
      <div className="builder-section">
        <div className="builder-section__label">{t('キーコード（16進数）')}</div>
        <input
          className="modal-search__input custom-hex-input"
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="0x0004"
          spellCheck={false}
          autoFocus
        />
      </div>

      <div className="builder-preview">
        {valid && entry ? (
          <>
            {t('解釈:')} <strong>{getKeyDisplayLabel(parsed, keyLayout).replace('\n', ' / ')}</strong>
            <span className="modal-title__code">（{tl(entry.short)} / 0x{parsed.toString(16).toUpperCase().padStart(4, '0')}）</span>
            {blocked && <div style={{ color: 'var(--red)' }}>{t('このキーはここには設定できません')}</div>}
          </>
        ) : (
          <span style={{ color: 'var(--red)' }}>{t('0x0000〜0xFFFF の16進数を入力してください')}</span>
        )}
      </div>

      <button className="btn btn--primary builder-panel__set" disabled={!valid || blocked} onClick={() => valid && !blocked && onSelect(parsed)}>
        {t('このキーコードを設定')}
      </button>
    </div>
  );
}

// ── メインモーダル ────────────────────────────────────────
function detectPanelType(code: number): PanelType {
  if (code >= 0x2000 && code <= 0x4FFF) return 'ホールド';  // MT / LT
  return '通常';
}

interface KeyConfigPanelProps {
  currentCode: number;
  keyLayout: KeyLayout;
  avail?: FirmwareAvail;
  layerCount?: number;
  selLabel?: string;   // 選択中キーの位置ラベル（例: "R1 C3"）
  selected?: boolean;  // false＝キー未選択（ドラッグでの配置のみ。ホールド/カスタムタブは無効）
  onSelect: (keycode: number) => void;
}

// キーマップタブ右側に常時表示するキー設定パネル（モーダル版と中身は共通）。
// 選択中のキーが変わるたびに呼び出し側で key={} を変えて再マウントし、
// パネル種別やカテゴリ選択などの内部状態を選択キーごとにリセットする想定。
// キー未選択時は「通常」タブ（＝キー一覧）のみを表示し、そこからキーボードへの
// ドラッグ&ドロップで配置できるようにする。
export function KeyConfigPanel({
  currentCode, keyLayout, avail = FW_ALL_AVAILABLE, layerCount, selLabel, selected = true, onSelect,
}: KeyConfigPanelProps) {
  const [panel, setPanel] = useState<PanelType>(selected ? detectPanelType(currentCode) : '通常');
  const effectivePanel: PanelType = selected ? panel : '通常';
  const entry = findKeycode(currentCode);
  const dispLabel = getKeyDisplayLabel(currentCode, keyLayout);

  // キー未選択のままホールド/カスタムタブを押した時の案内。画面下部の共通トーストだと
  // 遠くて目に入りにくいとの指摘があったため、パネル自身の右隣にposition:fixedで
  // 浮かせて表示する（本人・2026-09-18）。クリック時点のパネルの実座標を測って
  // 都度位置を計算し、一定時間で自動的に消す。
  const panelRef = useRef<HTMLDivElement>(null);
  const [disabledHint, setDisabledHint] = useState(false);
  const [hintTop, setHintTop] = useState(0);
  const disabledHintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showDisabledHint = () => {
    // パネルは常にページの一番右の列なので、右側の余白はページの外側パディング分しか
    // 無いことが多い。leftをパネルの右端基準で計算すると画面外にはみ出して見えなく
    // なるため、横位置はページ右端に固定（CSS側でright指定）し、縦位置だけパネルの
    // 実座標（上端）に合わせる。
    const rect = panelRef.current?.getBoundingClientRect();
    if (rect) setHintTop(rect.top);
    setDisabledHint(true);
    if (disabledHintTimer.current) clearTimeout(disabledHintTimer.current);
    disabledHintTimer.current = setTimeout(() => setDisabledHint(false), 2500);
  };

  return (
    <div className="key-config-panel" data-guide="key-picker" ref={panelRef}>
      <div className="key-config-panel__header">
        <span className="key-config-panel__title">{t('キー設定')}</span>
        <span className="key-config-panel__current">{t('現在:')} <strong>{selected ? dispLabel.replace('\n', ' / ') : '—'}</strong></span>
        {selected && <span className="key-config-panel__code">{tl(entry.short)}</span>}
        {selected && selLabel && <span className="key-config-panel__pos">{selLabel}</span>}
      </div>

      <div className="modal-type-tabs">
        {(['通常', 'ホールド', 'カスタム'] as PanelType[]).map(p => {
          const disabled = !selected && p !== '通常';
          return (
            <button
              key={p}
              className={`tab ${effectivePanel === p ? 'tab--active' : ''} ${disabled ? 'tab--disabled' : ''}`}
              data-guide={p === 'ホールド' ? 'hold-tab' : undefined}
              onClick={() => { if (disabled) { showDisabledHint(); return; } setPanel(p); }}
            >
              {t(p)}
            </button>
          );
        })}
      </div>
      {disabledHint && (
        <p className="key-config-panel__side-hint" style={{ top: hintTop }}>{t('先にキーマップ上のキーを選択してください')}</p>
      )}

      <div className="modal-body key-config-panel__body">
        {effectivePanel === '通常'    && <NormalPanel currentCode={currentCode} keyLayout={keyLayout} avail={avail} compact liveMods={selected} onSelect={onSelect} />}
        {effectivePanel === 'ホールド' && <HoldPanel   currentCode={currentCode} keyLayout={keyLayout} layerCount={layerCount} onSelect={onSelect} />}
        {effectivePanel === 'カスタム' && <CustomPanel currentCode={currentCode} keyLayout={keyLayout} onSelect={onSelect} />}
      </div>
    </div>
  );
}

export function KeyConfigModal({
  currentCode, keyLayout, defaultPanel, hideHold, avail = FW_ALL_AVAILABLE, layerCount, allowedGroups, excludeCode, onSelect, onClose,
}: KeyConfigModalProps) {
  const initialPanel = defaultPanel ?? detectPanelType(currentCode);
  const [panel, setPanel] = useState<PanelType>(
    hideHold && initialPanel === 'ホールド' ? '通常' : initialPanel
  );

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const entry = findKeycode(currentCode);
  const dispLabel = getKeyDisplayLabel(currentCode, keyLayout);

  const handleSelect = (code: number) => {
    onSelect(code);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-dialog" data-guide="key-picker">
        <div className="modal-header">
          <span className="modal-title">
            {t('キー設定 — 現在:')} <strong>{dispLabel.replace('\n', ' / ')}</strong>
            <span className="modal-title__code">({tl(entry.short)})</span>
          </span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-type-tabs">
          {(['通常', 'ホールド', 'カスタム'] as PanelType[]).filter(p => !(hideHold && p === 'ホールド')).map(p => (
            <button key={p} className={`tab ${panel === p ? 'tab--active' : ''}`} data-guide={p === 'ホールド' ? 'hold-tab' : undefined} onClick={() => setPanel(p)}>{t(p)}</button>
          ))}
        </div>

        <div className="modal-body">
          {panel === '通常'    && <NormalPanel currentCode={currentCode} keyLayout={keyLayout} avail={avail} allowedGroups={allowedGroups} excludeCode={excludeCode} onSelect={handleSelect} />}
          {panel === 'ホールド' && <HoldPanel   currentCode={currentCode} keyLayout={keyLayout} layerCount={layerCount} onSelect={handleSelect} />}
          {panel === 'カスタム' && <CustomPanel currentCode={currentCode} keyLayout={keyLayout} excludeCode={excludeCode} onSelect={handleSelect} />}
        </div>
      </div>
    </div>
  );
}
