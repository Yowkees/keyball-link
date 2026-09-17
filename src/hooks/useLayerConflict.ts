import { useState } from 'react';
import type { KbSettings, GestureConfig, GestureModeConfig, PrecisionConfig } from '../lib/protocol';
import { LAYER_NONE } from '../lib/protocol';

export type LayerLinkTarget = 'aml' | 'scroll' | 'gesture' | 'gestureMode' | 'precision';

export interface LayerWarn {
  target: LayerLinkTarget;
  msg: string;
  mode?: number;
}

// トラックボール動作レイヤー（自動マウス/スクロール/ジェスチャー/精密モード）が
// お互い同じレイヤーに重複設定されるのを防ぐための共通ロジック。
// SettingsTab（詳細設定タブ）とキーマップタブのレイヤー連動パネルの両方から使う。
export function useLayerConflict(
  settings: KbSettings,
  gesture: GestureConfig | null,
  gestureModes: GestureModeConfig[] | null,
  precision: PrecisionConfig | null,
) {
  const [layerWarn, setLayerWarn] = useState<LayerWarn | null>(null);

  // target を val にしたとき、併用できない他機能と同じレイヤーになっていたらその名前を返す。
  // 精密モードは「動きの意味」ではなく「感度」を変えるだけなので、自動マウス・スクロールとは
  // 併用可能（例：スクロールレイヤーと同じにすれば精密な低速スクロールになる）。ただし
  // ジェスチャーとは併用不可（本人希望、2026-09-11。同じレイヤーにするとジェスチャー中は
  // 精密モードが効かず紛らわしいため）。
  const conflictName = (target: LayerLinkTarget, val: number, excludeMode?: number): string | null => {
    if (val === LAYER_NONE) return null;  // 「なし」は重複しない
    const others: [string, number][] = [];
    const isGestureFamily = target === 'gesture' || target === 'gestureMode';
    if (target !== 'precision') {
      if (target !== 'aml' && settings.autoMouseEnable)
        others.push(['自動マウスレイヤー', settings.autoMouseLayer]);
      if (target !== 'scroll' && settings.scrollLayer !== LAYER_NONE)
        others.push(['スクロールレイヤー', settings.scrollLayer]);
    }
    if (target !== 'gesture' && gesture && gesture.layer !== LAYER_NONE)
      others.push(['ジェスチャーレイヤー', gesture.layer]);
    if (gestureModes) {
      gestureModes.forEach((m, i) => {
        if (target === 'gestureMode' && i === excludeMode) return;
        if (m.layer !== LAYER_NONE) others.push([`ジェスチャー${i + 1}`, m.layer]);
      });
    }
    if (isGestureFamily && precision && precision.layer !== LAYER_NONE)
      others.push(['精密モードレイヤー', precision.layer]);
    const hit = others.find(([, l]) => l === val);
    return hit ? hit[0] : null;
  };

  // レイヤー選択の共通ハンドラ。重複なら警告して保存しない。
  // excludeModeは対象が'gestureMode'のとき、今編集中のモード自身を重複判定から除くために使う。
  const changeLayer = (target: LayerLinkTarget, val: number, save: () => void, excludeMode?: number) => {
    const c = conflictName(target, val, excludeMode);
    if (c) {
      setLayerWarn({ target, msg: `${c}と同じレイヤーのため保存できません。別のレイヤーを選んでください。`, mode: excludeMode });
    } else {
      setLayerWarn(null);
      save();
    }
  };

  return { layerWarn, setLayerWarn, conflictName, changeLayer };
}
