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

// public/firmware/ に置いている hex/uf2（配布中の最新版）のバージョン。
// keyball44/61 は keyball-link-firmware（AVR版）のkb_version.hと一致させること。
// keyballplusは2026-09-18よりRP2040版のみ配布（AVR版は停止）のため、
// keyball-rp2040-firmwareのkb_version.hと一致させること（AVR版の
// keyball-plus-firmwareとは別バージョン体系）。
// keyball39はAVR版・RP2040版の両方を配布しているが、この値はAVR版
// （keyball-link-firmware）のバージョンのみを表す。RP2040版keyball39は
// keyball-rp2040-firmware側で別に0.1.0からバージョン管理されており、
// 接続中がRP2040版の場合この比較は正しく機能しない（既知の課題。
// チップ種別ごとに比較対象を分ける改修が必要）。
// hex/uf2 を作り直して差し替えるたびにここも更新する。
export const LATEST_FW_VERSION: Record<ModelKey, FirmwareVersion> = {
  keyball39: { major: 1, minor: 3, patch: 0 },
  keyball44: { major: 1, minor: 3, patch: 0 },
  keyball61: { major: 1, minor: 3, patch: 0 },
  keyballplus: { major: 0, minor: 1, patch: 0 },
};
