# Keyball Link（Web版キーマップ設定ツール） — 引き継ぎメモ

> このファイルは「チャットをリセットしても／別デバイスに移っても作業を続けられるように」まとめた引き継ぎ書です。
> 次のセッションは、まずこのファイルと [README.md](README.md) を読んでから作業してください。

## 0. プロジェクト概要
- **何のアプリか**: Keyball（分割トラックボールキーボード）シリーズ用の、ブラウザから直接キーマップ編集・ファームウェア書き込みができるWebアプリ（WebHID / WebSerial API使用）。
- **アプリ名**: Keyball Link
- **技術**: React + TypeScript + Vite（インストール不要の静的サイト）
- **場所**: `~/keyball-configurator`
- **GitHub**: https://github.com/Yowkees/keyball-link （組織アカウント・Public。旧名 keyball-configurator は自動転送）
- **公開URL**: https://keyball-link.shiroganelab.com （Cloudflare Pages、プロジェクト名 `keyball-link`。DNSはShopify管理の shiroganelab.com にCNAME追加）
- **現在のアプリバージョン**: v1.2.1（`package.json`、footerに `Keyball Link v{__APP_VERSION__}` として表示）
- **対応機種**: Keyball39 / Keyball44 / Keyball61 / Keyball+

---

## 1. ユーザーについて（重要・厳守）
- プログラミング**初心者**。専門用語は必ず簡単な説明を添える。**日本語**で回答。
- **コミット/プッシュは毎回メッセージ案を提案**してから。実際の実行は「お願いします」等の明確な指示があったときだけ。
- 手動作業が必要なときは**ステップごとに**説明。
- ターミナル作業（npm / git 等）は**ClaudeがBashツールで実行**する。
- ユーザーはKeyball販売元「Shirogane Lab」の人間。

---

## 2. ファームウェアとの関係（重要）
このアプリは2つの**別リポジトリ**のファームウェアを配布・書き込みしている。**バージョン番号は連動していない**ので注意。

| 機種 | ファームウェアのリポジトリ | バージョン体系 |
|---|---|---|
| Keyball39 / 44 / 61 | https://github.com/Yowkees/keyball-link-firmware | 現在 v1.2.0 |
| Keyball+ | https://github.com/ineno771/keyball-plus-firmware （別リポジトリ。ローカルは `~/keyball-plus-firmware`） | 現在 v1.0.1 |

hexファイルの置き場所は `public/firmware/*.hex`。**hexを差し替えたら必ず `src/lib/firmwareFeatures.ts` の `LATEST_FW_VERSION`（機種別オブジェクト）も同じバージョンに更新すること**（更新し忘れると「最新版があります」の案内が正しく出ない）。

---

## 3. 直近の作業（2026-08-24〜25）
- Keyball+ファームウェアのLED点灯遅延バグ修正（v1.0.1）に伴い、hexを差し替え
- **既存バグ発見・修正**: `LATEST_FW_VERSION` が全機種共通の1つの定数になっており、Keyball+接続時に無関係なKeyball39/44/61系のバージョンと比較され「更新があります」と誤表示されていた → 機種別（`Record<ModelKey, FirmwareVersion>`）に変更（`src/lib/firmwareFeatures.ts` / `src/App.tsx`）
- README「対応キーボード」一覧にKeyball+が抜けていたのを追記
- CHANGELOG更新、`package.json` のバージョンを1.2.1に

本番デプロイは `npm run deploy` で実施可能（この開発環境はCloudflareにOAuthログイン済みなので、Claude環境からそのまま実行できる。※認証は途切れることがあるので、切れていたら `npx wrangler login` でユーザー自身のブラウザ認証が必要）。今回のv1.2.1（ドキュメント更新のみ）は**ユーザーの判断でデプロイ見送り**。次に機能・hexの変更を伴うコミットをする際は、デプロイの要否を確認すること。

### 2026-09-01: EEPROM設定バグ調査・修正一式（X投稿がきっかけ）
「Keyball Link対応ファームに書き換えたらレイヤーがおかしくなり、通常ファームに戻しても直らない」というX上の報告を受けて調査。原因は「EEPROMはファーム書き換えでは消えない」＋「設定の有効性判定が値の範囲チェックのみでマジックナンバーがなかった」こと。

- **keyball-link-firmware**（コミット`841c8ec`・push済み。**hexは未再ビルドで配布物には未反映、後述のタスク参照**）
  - `kb_settings.c`にマジックナンバー方式のEEPROM検証を追加。フォーマット不一致・未初期化時は独自設定領域を安全な既定値へ自動リセット（スクロールレイヤー等の既定値は正規ファームウェアと同じ挙動を維持するよう調整済み）
  - Keyball Linkの「初期化」ボタン（`KB_HID_CMD_RESET_KEYMAP`）の範囲を拡張。従来はキー割り当てのみだったが、Keyball Link独自設定（スクロールレイヤー等）と本体組み込み設定（CPI・スクロール分周・加速度・自動マウスレイヤーON/OFF）も含め、`EE_CLR`キーと同じ範囲をリセットするように
  - キーボード側への`EE_CLR`キー追加は**ユーザーの意向で見送り**（「キー割り当てはユーザーが決めること」のため。EEPROM初期化はKeyball Link側の「初期化」ボタンだけで完結する設計に統一）
- **keyball-configurator**（コミット`8480910`・デプロイ済み）
  - `src/lib/avr109.ts`の`exitBootloader()`が本来送るべき`0x45`('E')ではなく`0x51`('Q')を送信していたバグを修正。書き込み後すぐにアプリが起動しない（ブートローダーが8秒間抜けない）原因だった
  - `FirmwareFlasher.tsx`に「正規ファームウェアなど他のファームウェアに戻す方へ」の案内を追加。先に「初期化」を押してから書き込むよう誘導し、今回のような事故を予防する
  - ファームウェアの書き込み回数（全ユーザー合計）を表示する機能を追加（コミット`935f3f2`・デプロイ済み）。`functions/api/flash-count.ts`（Cloudflare Pages Functions）＋KVネームスペース`FLASH_COUNTS`（ID: `7c34554d9bca42a3b02465ce97bdd0b6`）で集計

---

## 4. 未確定・残タスク

### 2026-09-01の実機確認で判明した追加の不具合と対応状況
上記EEPROM修正の実機確認を進める中で、当初のEEPROM問題とは別に3件の不具合が見つかり、いずれも修正・push済み（実機で解消確認済みのものはチェック済み）。

- [x] **Keyball44/61 LED版のトラックボール方向が90度+反転していた**: ライブラリ標準の向き補正が、通常版のカスタム補正と反転条件が逆だった。通常版に合わせてLED版にも軽量な向き補正を追加（コミット`6f8240c`）。実機で解消確認済み。Keyball39は元々両版でコード共有のため対象外。
- [x] **自動マウスレイヤーとジェスチャーレイヤーが同じレイヤー番号になり得た**: Keyball Linkの「自動マウスレイヤーを使う」トグルだけがレイヤー重複チェックを素通りしていたのが原因。トグルにもチェックを追加（コミット`70ad5ae`）。
- [x] **マジックナンバー(EEPROM検証)が1バイトだと偶然の一致で誤判定する事故が実機で発生**: 2バイトに強化（コミット`8455233`所属の一連の修正、実際は`74feecb`）。
- [x] **hexファイル書き込み後「もう一度書き込む」でファイル選択が消える**: `reset()`がファイル選択まで消していたのを修正（コミット`0854073`）。実機確認済み（要ハードリロード）。
- [x] **画面上の「書き込み回数」表示が書き込み成功時に+1されるか**: 実機で確認済み。
- [x] **配布用hexの再ビルド・差し替え**: v1.3.0として`public/firmware/*.hex`を差し替え、`LATEST_FW_VERSION`・`kb_version.h`とも1.3.0に更新。本番デプロイ済み（コミット`791c667`、本番配信も確認済み）。
- [x] **呼吸エフェクト使用時、OLEDのスクロール分周・レイヤー表示が乱れる（解決・2026-09-10確認）**: 明るさ設定(val)を無視する仕様だったのをパッチで修正済み（`patches/0003-rgblight-breathing-respects-brightness.patch`、コミット`74feecb`+`8455233`）。当時は明るさを下げてもOLEDの乱れ自体は解消しなかったが、その後の作業（RGB_MATRIX移行等）で症状自体が発生しなくなったことを本人が確認。原因はいずれにせよ不明のまま解消。
- [ ] **アシストモード構想（アイデア段階、未着手）**: Keyballに慣れていないユーザー向けに、画面隅にキーマップを表示し続けるモード。レイヤーを切り替えると表示中のキーマップもレイヤーに追従して切り替わる。応用として、レイヤー切り替え時に音で知らせる機能も検討中（表示の切り替えと同じイベントに相乗りできるため実装コストは低い見込み）。
  - 技術的な前提: 現在のKeyball Link（設定時だけ接続する形）とは違い、**常時HID接続を維持してリアルタイムに状態（現在のレイヤー等）を受け取り続ける仕組み**が必要（ブラウザタブ常時起動 or 専用の常駐アプリ）。設計はまだこれから。
  - ファームウェア側の残タスクは `~/keyball-plus-firmware/HANDOFF.md` を参照（RGB_MATRIX移行・リポジトリ移管保留）。keyball-rp2040-firmwareの残タスクは `~/keyball-rp2040-firmware/HANDOFF.md` を参照。
- [x] **トラックボール超低速（精密作業）モードの感度設定UI**: `PRC_MO`キーコードをキー割り当てUIから選択可能にし、分周値（範囲2-5、既定4。ファーム側の実際の範囲に合わせて20→5に修正済み）・レイヤー連動の設定UIを`SettingsTab`に追加済み（コミット`935d441`→`b9f5644`→`ae50239`→`fbb5be6`）。rp2040-devブランチで完結。
- [x] **複数ジェスチャーモードの設定UI（2026-09-09・実機確認済み）**: ファーム側の4モード化（`~/keyball-rp2040-firmware/HANDOFF.md`参照）に対応し、`SettingsTab`のジェスチャーカードをモードタブ切り替え式に刷新。各モードで方向キー割り当て・方向ごとの連続入力ON/OFF・連動レイヤーを設定できる。`GST_HOLD2`〜`4`(0x7E13〜0x7E15)キーコードも追加。AVR版接続時や旧RP2040ファームでは新HIDコマンドの取得に失敗し、従来の単一モードUIに自動フォールバックする設計。rp2040-devブランチのみ（mainブランチ・AVR版は無変更）。
- [ ] **ポイント設置・スナップ機能構想（アイデア段階、未着手。別リポジトリで開始）**: 画面上の任意の箇所にポイントを登録しておき、そこへカーソルをスナップさせる機能。PC側常駐アプリ本体は `MagSnap`（旧keyball-companion。https://github.com/ineno771/mag-snap 、別デバイスで開発予定）として独立リポジトリ化済み。**Keyballとは無関係な独立製品として展開する方針**（対外的にKeyballへの言及はしない）。詳細・経緯はそちらのHANDOFF.md参照。
  - **ファームウェア単体では実現不可**: キーボードはUSBに対して相対移動量しか送っておらず、現在のカーソル絶対位置を知らないため。実現には**PC側の常駐ネイティブアプリ**が別途必要（ブラウザは仕様上カーソルを直接動かせないためWebアプリ不可）。役割分担は、キーボード側は「スナップ方向へ動いた」という合図を送るだけ、ポイント管理・実際のカーソル移動はPC側アプリが担当する想定。
  - 前述の「アシストモード」構想と同じく常駐アプリが前提になるため、実現するなら合わせて設計するのが効率的。
  - **配布コストの注意**: Mac版はApp Store経由でなくてもコード署名・公証のためApple Developer Program登録（年間$99）が実質必要（無署名でも配布自体は可能だが「開発元未確認」警告が出る）。Windows版は直接配布なら無料（署名なしはSmartScreen警告が出る。Microsoft Store経由なら一度きり約$19）。
- [x] **keyball-rp2040-firmware新機能に対応するWeb UI**: 汎用連続値調整機能（複数ジェスチャーモードの連続入力ON/OFF）・スクロール慣性の強さ調整・LED「波紋」演出（RIPPLE）は`SettingsTab`に実装済み。ジェスチャー連動LEDウェーブの速さ・ON/OFFトグルも実装済み（2026-09-10、`rp2040-dev`ブランチ）。詳細は`~/keyball-rp2040-firmware/HANDOFF.md`参照。
- [ ] **keyball-rp2040-firmware側の残る未着手アイデアに対応するWeb UI**: 矢印キーモード・軸スナップモード・方向別感度調整（8方向）・パイメニュー・OLEDリッチ化は、ファームウェア側がまだアイデア段階で未着手のため、Web UI対応も未着手（ファームウェア側の実装が先行する見込み）。

### 2026-09-11: OS自動判別・DPIカーブ・キーコード監査（`rp2040-dev`ブランチのみ、ビルド確認のみ・実機未確認・未コミット）
- [ ] **OS自動判別UI**: 接続中OSの判別結果表示＋macOS/iOS接続時にCmd/Ctrl自動入れ替えのON/OFFトグルを追加（`SettingsTab`）。ファーム側実装は`~/keyball-rp2040-firmware/HANDOFF.md`参照。
- [ ] **DPIカーブ編集UI**: `src/components/DpiCurveEditor/DpiCurveEditor.tsx`（新規）。Photoshopのトーンカーブ風に、SVG上の点をドラッグしてトラックボールの速度カーブを編集できる。ファーム側の実際の補間（モノトニック3次エルミートスプライン）と見た目を合わせるため、`computeDpiCurveLut()`（`protocol.ts`）でJS側にも同じLUT計算ロジックを移植済み。
- [x] **「この版（LED版）では使用できません」の誤表示を解除**: Tapping Term・Permissive Hold・Auto ShiftはRP2040版では制約がないのに、AVR版LED版向けの古い制限表示が残っていた。`SettingsTab.tsx`の`tappingUnavail`判定ごと削除。
- [x] **キーコード全数監査で発覚した不具合の修正**（`src/lib/keycodes.ts`）:
  - **ワンショットモディファイア(OSM)が反応しない不具合**: OSM(Ctrl/Shift/Alt/GUI)のキーコード値が誤り（`0x5501/02/04/08`→正しくは`0x52A1/02/04/08`）だった。**注意**: 既にこの誤った値でWeb UI経由保存済みのキーは、ファーム/Web更新だけでは直らない。ユーザーがそのキーを選び直して保存する必要がある。
  - **死んだキーコード`RGB_MODE_PLAIN`等(`0x782B`-`0x7834`)をパレットから削除**: 現行QMKに処理コードが存在しない値だった。`presets.ts`の「Keyball39 デフォルト」プリセットがこれを直接使っていたため、UG_PREV/UG_NEXTによる循環に置き換え済み（本人選択。輝度調整キーへの変更は試したが本人希望により見送り・元に戻し済み）。`via*`系プリセット（本家キーマップの機械的変換、意図的に無変更の方針）はそのまま。
- [x] **PC画面の明るさキーを追加**: 標準USB HIDキー`KC_BRIGHTNESS_UP`/`DOWN`(`0x00BD`/`0x00BE`)を「メディア」パレットに追加（ファーム側は`EXTRAKEY_ENABLE`が元々ONのため無変更）。OS・ディスプレイが対応している場合のみ有効。
- （一時実装→完全削除）OLED画面の明るさ調整UI: 「Val」の誤解から一時実装したが、本人が求めていたのはPC画面側だったため関連コード一式を削除済み。
- **重要**: 上記は全て`rp2040-dev`ブランチのみの変更。`npm run build`は通り、**`wrangler pages deploy dist --project-name=keyball-link --branch=rp2040-dev`で https://rp2040-dev.keyball-link.pages.dev には反映済み**（動作確認用途のデプロイ。originへのgit pushは行っていない）。一方で**ソースコードのgitコミットはまだ**（作業ツリーに変更が残ったまま）。次回セッションでまず`git status`（`rp2040-dev`ブランチにいることを確認）し、実機テスト後にコミットの要否を本人に確認すること。

---

## 5. 主要ファイル
| ファイル/ディレクトリ | 内容 |
|---|---|
| `src/App.tsx` | 中心。接続状態管理・タブ切り替え・footerのバージョン表示など |
| `src/hooks/useKeyball.ts` | WebHID通信のラッパーhook（接続・キーマップ取得・各種設定の読み書き） |
| `src/lib/hid.ts` | WebHID低レベル通信（`KeyballHID`クラス） |
| `src/lib/protocol.ts` | HIDプロトコルの型・コマンド定義・バージョン比較関数 |
| `src/lib/firmwareFeatures.ts` | 機種別の最新ファームウェアバージョン・機能フラグ |
| `src/lib/avr109.ts` + `ihex.ts` | ブラウザから直接書き込むためのAVR109プロトコル・Intel HEXパーサ |
| `src/components/FirmwareFlasher/` | ファームウェア書き込みUI |
| `src/components/SettingsTab/` | LED・トラックボール・マクロ等の設定タブ群 |
| `public/firmware/*.hex` | 配布中のビルド済みファームウェア本体 |
| `wrangler.jsonc` | Cloudflare Pages設定 |

---

## 6. 開発・確認のやり方
```bash
cd ~/keyball-configurator
npm install          # 初回のみ
npm run dev           # 開発サーバー（http://localhost:5173）
npx tsc --noEmit       # 型チェック（ビルド前の確認に）
npm run build          # 本番ビルド（dist/に出力）
npm run deploy          # ビルド＋Cloudflare Pagesへ本番デプロイ
```

---

## 7. ハマりやすい点メモ
- 対応ブラウザは **Chrome / Edge のみ**（WebHID・WebSerial非対応のSafari/Firefoxは不可）
- ファームウェア書き込みは、機種によって「通常版」「LED版」の2種類あり、**hexファイル名の末尾 `_led` の有無**で区別している（`FirmwareFlasher.tsx` の `BUILTIN_FIRMWARE` / `BUILTIN_FIRMWARE_LED`）
- LED版は容量の都合でマクロ・ジェスチャー等が使えない機種が多い。機種ごとに正確な差分が違うので、UIの案内文言を変更する際は各ファームウェアリポジトリの `rules.mk` を確認すること
