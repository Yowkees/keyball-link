import type { ModelKey } from '../layouts';
import type { FirmwareVersion } from './protocol';

// ファームウェアの rules.mk と一致させること
// rules.mk を変更したときはここも更新する
export const FIRMWARE_FEATURES = {
  tapDance: true,    // TAP_DANCE_ENABLE = yes（RP2040版のみ。2026-09-11〜「ダブルタップ機能」として）
  autoShift: true,   // AUTO_SHIFT_ENABLE = yes（RP2040版のみ。2026-09-11〜）
  combo: true,       // COMBO_ENABLE = yes（RP2040版のみ。2026-09-10〜）
  osDetection: true, // OS_DETECTION_ENABLE = yes（RP2040版のみ。2026-09-11〜）
  dpiCurve: true,    // DPIカーブ（トーンカーブ風の速度調整。RP2040版のみ。2026-09-11〜）
} as const;

// public/firmware/ に置いている hex（配布中の最新版）のバージョン。
// keyball39/44/61 は keyball-link-firmware、keyballplus は keyball-plus-firmware（別リポジトリ・別バージョン体系）の kb_version.h と一致させること。
// hex を作り直して差し替えるたびにここも更新する。
export const LATEST_FW_VERSION: Record<ModelKey, FirmwareVersion> = {
  keyball39: { major: 1, minor: 3, patch: 0 },
  keyball44: { major: 1, minor: 3, patch: 0 },
  keyball61: { major: 1, minor: 3, patch: 0 },
  keyballplus: { major: 1, minor: 0, patch: 1 },
};
