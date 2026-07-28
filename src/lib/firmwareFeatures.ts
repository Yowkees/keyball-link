// ファームウェアの rules.mk と一致させること
// rules.mk を変更したときはここも更新する
export const FIRMWARE_FEATURES = {
  tapDance: false,   // TAP_DANCE_ENABLE = no
  autoShift: false,  // AUTO_SHIFT_ENABLE = no
} as const;

// public/firmware/ に置いている hex（配布中の最新版）のバージョン。
// kb_version.h と一致させること。hex を作り直して差し替えるたびにここも更新する。
export const LATEST_FW_VERSION = { major: 1, minor: 2, patch: 0 };
