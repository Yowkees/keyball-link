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
// keyball39・keyballplusはAVR版・RP2040版の両方を配布しているが、この値は
// AVR版（keyball-link-firmware / keyball-plus-firmware）のバージョンのみを
// 表す。RP2040版（keyball-rp2040-firmware、0.1.0系の別バージョン体系）は
// 接続中がRP2040版の場合この比較が正しく機能しない（既知の課題。チップ種別
// ごとに比較対象を分ける改修が必要。2026-09-25、keyballplusのAVR版配布再開に
// 伴いkeyball39と同じ課題を抱えることになった）。
// hex/uf2 を作り直して差し替えるたびにここも更新する。
export const LATEST_FW_VERSION: Record<ModelKey, FirmwareVersion> = {
  keyball39: { major: 1, minor: 3, patch: 0 },
  keyball44: { major: 1, minor: 3, patch: 0 },
  keyball61: { major: 1, minor: 3, patch: 0 },
  keyballplus: { major: 1, minor: 1, patch: 0 },
};
