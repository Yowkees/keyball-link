import type { ModelKey } from '../layouts';
import type { FirmwareVersion } from './protocol';
import type { Chip } from './deviceIds';

// ファームウェアの rules.mk と一致させること（rules.mk を変更したときはここも更新する）。
// tapDance/autoShift/combo/osDetectionはAVR版のrules.mkでは
// TAP_DANCE_ENABLE・AUTO_SHIFT_ENABLEがコメントアウト、COMBO_ENABLE・
// OS_DETECTION_ENABLEは未設定のため、AVR版ファームには実装自体が存在しない
// （選択・操作してもファーム側で無視される）。2026-09-25、静的な定数から
// 接続中チップ種別で切り替える関数に変更し、AVR接続時はUI上でも操作不可にした。
// chipがundefined（未接続、または旧ファームでチップ種別を特定できない場合）は
// 「不明＝グレーアウトしない」の既存方針に合わせ、全機能ありとして扱う。
export function firmwareFeaturesForChip(chip: Chip | undefined) {
  const avr = chip === 'avr';
  return {
    tapDance: !avr,    // TAP_DANCE_ENABLE = yes（RP2040版のみ。2026-09-11〜「ダブルタップ機能」として）
    autoShift: !avr,   // AUTO_SHIFT_ENABLE = yes（RP2040版のみ。2026-09-11〜）
    combo: !avr,       // COMBO_ENABLE = yes（RP2040版のみ。2026-09-10〜）
    osDetection: !avr, // OS_DETECTION_ENABLE = yes（RP2040版のみ。2026-09-11〜）
    dpiCurve: !avr,    // DPIカーブ（トーンカーブ風の速度調整。RP2040版のみ。2026-09-11〜）
  } as const;
}

// public/firmware/ に置いている hex/uf2（配布中の最新版）のバージョン。
// keyball44/61 は keyball-link-firmware（AVR版）のkb_version.hと一致させること。
// この値はAVR版（keyball-link-firmware / keyball-plus-firmware）のバージョン。
// RP2040版（keyball-rp2040-firmware、0.x系の別バージョン体系）は全機種共通で
// LATEST_FW_VERSION_RP2040を使う（2026-10-02、チップ種別ごとに比較対象を分けた。
// 以前はRP2040版接続時もAVR版の値と比べてしまい「最新版 v1.4.1 があります」と誤表示していた）。
// hex/uf2 を作り直して差し替えるたびにここも更新する。
export const LATEST_FW_VERSION: Record<ModelKey, FirmwareVersion> = {
  keyball39: { major: 1, minor: 4, patch: 2 },
  keyball44: { major: 1, minor: 4, patch: 2 },
  keyball61: { major: 1, minor: 4, patch: 2 },
  keyballplus: { major: 1, minor: 1, patch: 1 },
};

// RP2040版（keyball-rp2040-firmwareのkb_version.h）。全機種同じソースからビルドしているため共通。
export const LATEST_FW_VERSION_RP2040: FirmwareVersion = { major: 0, minor: 4, patch: 15 };

export function latestFwVersion(model: ModelKey, chip: Chip | undefined): FirmwareVersion {
  return chip === 'rp2040' ? LATEST_FW_VERSION_RP2040 : LATEST_FW_VERSION[model];
}
