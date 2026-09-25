import { useState } from 'react';
import type { LedConfig, LayerLedConfig } from '../../lib/protocol';
import { LAYER_LED_DEFAULT } from '../LayerFeatures/LayerLedCard';
import { ToggleRow } from '../SettingsControls/SettingsControls';
import { LEDSettings } from './LEDSettings';

interface LedPanelProps {
  led: LedConfig | null;   // 通常LED設定。nullなら通常版ファームでLED自体が非対応
  onLedChange: (cfg: LedConfig) => void;
  layerLedEnable: boolean | null;   // レイヤー連動LED機能の有効/無効。nullなら非対応ファーム
  layerLeds: (LayerLedConfig | null)[];
  onLayerLedEnableChange: (v: boolean) => void;
  onLayerLedChange: (layer: number, cfg: LayerLedConfig) => void;
  switchableLayers: number[];   // レイヤー連動LEDの対象にできるレイヤー番号
  allowedEffectIds?: readonly number[];  // 指定時、エフェクト選択肢をこのIDのみに絞る（AVR接続時など）
}

// 「通常」のLED設定と「レイヤー連動LED」を、同じ設定UI（エフェクト・色相バー・スライダー）を
// 使い回しながら1枚のパネルにまとめる。レイヤーごとのON/OFFは各レイヤータブ内のトグルで直接
// 行えるので、別枠の「レイヤー連動LEDを使う」というマスタースイッチはUIに置かず、いずれかの
// レイヤーを有効にした瞬間にファーム側のマスターフラグを裏側で自動的にONにする。
// 保存は画面右上の「保存」ボタン（EEPROM書き込み）に一本化し、ここには置かない。
export function LedPanel({
  led, onLedChange, layerLedEnable, layerLeds, onLayerLedEnableChange, onLayerLedChange, switchableLayers,
  allowedEffectIds,
}: LedPanelProps) {
  const [target, setTarget] = useState<'normal' | number>('normal');

  if (!led) {
    return (
      <>
        <div className="led-panel__title">LED設定</div>
        <p className="settings-desc" style={{ color: 'var(--red)' }}>
          ⚠ この版（通常版）ではLEDは使用できません。LED版のファームを書き込むと設定できます。
        </p>
      </>
    );
  }

  // タブ形式（横並びボタン）は画面が広い時用。1カラムに畳むほど狭い時は
  // 横にはみ出してしまうため、同じ選択肢をドロップダウンでも用意しておき、
  // CSS側（幅980px以下）でどちらを表示するか切り替える（本人要望）。
  const targetTabs = layerLedEnable !== null && switchableLayers.length > 0 ? (
    <>
      <div className="led-panel__targets">
        <button
          className={`led-panel__target ${target === 'normal' ? 'led-panel__target--active' : ''}`}
          onClick={() => setTarget('normal')}
        >
          レイヤー0
        </button>
        {switchableLayers.map(l => (
          <button
            key={l}
            className={`led-panel__target ${target === l ? 'led-panel__target--active' : ''} ${layerLeds[l]?.enabled ? 'led-panel__target--on' : ''}`}
            onClick={() => setTarget(l)}
          >
            レイヤー{l}
          </button>
        ))}
      </div>
      <select
        className="led-panel__target-select"
        value={String(target)}
        onChange={e => setTarget(e.target.value === 'normal' ? 'normal' : Number(e.target.value))}
      >
        <option value="normal">レイヤー0</option>
        {switchableLayers.map(l => (
          <option key={l} value={l}>
            レイヤー{l}{layerLeds[l]?.enabled ? '（有効）' : ''}
          </option>
        ))}
      </select>
    </>
  ) : undefined;

  // レイヤー0（通常）とレイヤー1以降とで表示するパネルの高さが変わらないよう、
  // どちらの場合も必ずこの行を出す。レイヤー0は常時有効な基本設定なのでON/OFFはできず、
  // その旨を示すだけの無効化トグルにする。
  if (target === 'normal') {
    return (
      <>
        <div className="led-panel__title">LED設定</div>
        <LEDSettings
          config={led}
          onChange={onLedChange}
          headerLeft={targetTabs}
          allowedEffectIds={allowedEffectIds}
          extraRow={
            <ToggleRow
              label="レイヤー0は基本の光り方です（常時有効）"
              desc=""
              checked
              disabled
              onChange={() => {}}
            />
          }
        />
      </>
    );
  }

  const layerCfg = layerLeds[target] ?? LAYER_LED_DEFAULT;

  return (
    <>
      <div className="led-panel__title">LED設定</div>
      <LEDSettings
        config={layerCfg}
        onChange={c => onLayerLedChange(target, { ...layerCfg, ...c })}
        headerLeft={targetTabs}
        allowedEffectIds={allowedEffectIds}
        extraRow={
          <ToggleRow
            label={`レイヤー${target}で専用の光り方を使う`}
            desc=""
            checked={layerCfg.enabled}
            disabled={false}
            onChange={v => {
              onLayerLedChange(target, { ...layerCfg, enabled: v });
              if (v && layerLedEnable === false) onLayerLedEnableChange(true);
            }}
          />
        }
      />
    </>
  );
}
