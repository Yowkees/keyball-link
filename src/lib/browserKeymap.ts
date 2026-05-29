// ブラウザの KeyboardEvent.code → QMKキーコード変換マップ

// 修飾なし（単押し）
const BASE_MAP: Record<string, number> = {
  KeyA: 0x0004, KeyB: 0x0005, KeyC: 0x0006, KeyD: 0x0007,
  KeyE: 0x0008, KeyF: 0x0009, KeyG: 0x000A, KeyH: 0x000B,
  KeyI: 0x000C, KeyJ: 0x000D, KeyK: 0x000E, KeyL: 0x000F,
  KeyM: 0x0010, KeyN: 0x0011, KeyO: 0x0012, KeyP: 0x0013,
  KeyQ: 0x0014, KeyR: 0x0015, KeyS: 0x0016, KeyT: 0x0017,
  KeyU: 0x0018, KeyV: 0x0019, KeyW: 0x001A, KeyX: 0x001B,
  KeyY: 0x001C, KeyZ: 0x001D,

  Digit1: 0x001E, Digit2: 0x001F, Digit3: 0x0020, Digit4: 0x0021,
  Digit5: 0x0022, Digit6: 0x0023, Digit7: 0x0024, Digit8: 0x0025,
  Digit9: 0x0026, Digit0: 0x0027,

  Enter:     0x0028, Escape:    0x0029, Backspace: 0x002A,
  Tab:       0x002B, Space:     0x002C,
  Minus:     0x002D, Equal:     0x002E,
  BracketLeft: 0x002F, BracketRight: 0x0030,
  Backslash: 0x0031, Semicolon: 0x0033, Quote:    0x0034,
  Backquote: 0x0035, Comma:     0x0036, Period:   0x0037,
  Slash:     0x0038,

  CapsLock: 0x0039,
  F1:  0x003A, F2:  0x003B, F3:  0x003C, F4:  0x003D,
  F5:  0x003E, F6:  0x003F, F7:  0x0040, F8:  0x0041,
  F9:  0x0042, F10: 0x0043, F11: 0x0044, F12: 0x0045,

  Delete: 0x004C, Insert:   0x0049, Home:    0x004A,
  End:    0x004D, PageUp:   0x004B, PageDown: 0x004E,

  ArrowRight: 0x004F, ArrowLeft: 0x0050,
  ArrowDown:  0x0051, ArrowUp:   0x0052,

  ControlLeft: 0x00E0, ShiftLeft:  0x00E1, AltLeft:  0x00E2, MetaLeft:  0x00E3,
  ControlRight:0x00E4, ShiftRight: 0x00E5, AltRight: 0x00E6, MetaRight: 0x00E7,
};

// Shift 同時押し → Shift記号キーコード（QK_LSFT = 0x0200）
const SHIFT_MAP: Record<string, number> = {
  Digit1: 0x021E, // !
  Digit2: 0x021F, // @
  Digit3: 0x0220, // #
  Digit4: 0x0221, // $
  Digit5: 0x0222, // %
  Digit6: 0x0223, // ^
  Digit7: 0x0224, // &
  Digit8: 0x0225, // *
  Digit9: 0x0226, // (
  Digit0: 0x0227, // )
  Minus:       0x022D, // _
  Equal:       0x022E, // +
  BracketLeft: 0x022F, // {
  BracketRight:0x0230, // }
  Backslash:   0x0231, // |
  Semicolon:   0x0233, // :
  Quote:       0x0234, // "
  Backquote:   0x0235, // ~
  Comma:       0x0236, // <
  Period:      0x0237, // >
  Slash:       0x0238, // ?
};

/**
 * KeyboardEvent から QMK キーコードを返す。
 * 対応していないキーは null を返す。
 */
export function browserEventToKeycode(e: KeyboardEvent): number | null {
  // Shift単体・Ctrl単体などの修飾キー自体は除外（文字入力には使わないため）
  if (['ShiftLeft','ShiftRight','ControlLeft','ControlRight',
       'AltLeft','AltRight','MetaLeft','MetaRight'].includes(e.code)) {
    return null;
  }

  if (e.shiftKey && SHIFT_MAP[e.code] !== undefined) {
    return SHIFT_MAP[e.code];
  }

  return BASE_MAP[e.code] ?? null;
}

/** キーコードから短い表示名を返す（録音プレビュー用） */
export function keycodeToDisplayName(kc: number): string {
  for (const [code, val] of Object.entries(BASE_MAP)) {
    if (val === kc) return code.replace('Key','').replace('Digit','').replace('Arrow','↑↓←→'.charAt(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].indexOf(code)));
  }
  for (const [code, val] of Object.entries(SHIFT_MAP)) {
    if (val === kc) {
      const chars: Record<number,string> = {
        0x021E:'!',0x021F:'@',0x0220:'#',0x0221:'$',0x0222:'%',
        0x0223:'^',0x0224:'&',0x0225:'*',0x0226:'(',0x0227:')',
        0x022D:'_',0x022E:'+',0x022F:'{',0x0230:'}',0x0231:'|',
        0x0233:':',0x0234:'"',0x0235:'~',0x0236:'<',0x0237:'>',0x0238:'?',
      };
      return chars[kc] ?? code;
    }
  }
  return `0x${kc.toString(16).toUpperCase()}`;
}
