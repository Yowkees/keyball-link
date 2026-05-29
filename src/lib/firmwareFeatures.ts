// ファームウェアの rules.mk と一致させること
// rules.mk を変更したときはここも更新する
export const FIRMWARE_FEATURES = {
  tapDance: false,   // TAP_DANCE_ENABLE = no
  autoShift: false,  // AUTO_SHIFT_ENABLE = no
} as const;
