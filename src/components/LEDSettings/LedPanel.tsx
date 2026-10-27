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
  layer: number;  // キー配列で選んでいるレイヤー。このレイヤーの光り方を設定する（2026-10-27、本人希望）
}

// 「通常」のLED設定と「レイヤー連動LED」を、同じ設定UI（エフェクト・色相バー・スライダー）を
// 使い回しながら1枚のパネルにまとめる。レイヤーごとのON/OFFは各レイヤータブ内のトグルで直接
// 行えるので、別枠の「レイヤー連動LEDを使う」というマスタースイッチはUIに置かず、いずれかの
// レイヤーを有効にした瞬間にファーム側のマスターフラグを裏側で自動的にONにする。
// 保存は画面右上の「保存」ボタン（EEPROM書き込み）に一本化し、ここには置かない。
export function LedPanel({
  led, onLedChange, layerLedEnable, layerLeds, onLayerLedEnableChange, onLayerLedChange, switchableLayers,
  allowedEffectIds, layer,
}: LedPanelProps) {
  // 対象はキー配列で選んでいるレイヤー（パネル内のレイヤーのタブは廃止。トラックボールのパネルと同じ）
  const target: 'normal' | number = layer === 0 || !switchableLayers.includes(layer) || layerLedEnable === null ? 'normal' : layer;

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

  const targetTabs = <span className="ball-panel__layer">{layerLedEnable === null && layer !== 0 ? 'レイヤー0（このファームは全レイヤー共通）' : `レイヤー${target === 'normal' ? 0 : target}`}</span>;

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
