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

本番デプロイは `npm run deploy` で実施可能（この開発環境はCloudflareにOAuthログイン済みなので、Claude環境からそのまま実行できる）。今回のv1.2.1（ドキュメント更新のみ）は**ユーザーの判断でデプロイ見送り**。次に機能・hexの変更を伴うコミットをする際は、デプロイの要否を確認すること。

---

## 4. 未確定・残タスク
- [ ] **アシストモード構想（アイデア段階、未着手）**: Keyballに慣れていないユーザー向けに、画面隅にキーマップを表示し続けるモード。レイヤーを切り替えると表示中のキーマップもレイヤーに追従して切り替わる。応用として、レイヤー切り替え時に音で知らせる機能も検討中（表示の切り替えと同じイベントに相乗りできるため実装コストは低い見込み）。
  - 技術的な前提: 現在のKeyball Link（設定時だけ接続する形）とは違い、**常時HID接続を維持してリアルタイムに状態（現在のレイヤー等）を受け取り続ける仕組み**が必要（ブラウザタブ常時起動 or 専用の常駐アプリ）。設計はまだこれから。
  - ファームウェア側の残タスクは `~/keyball-plus-firmware/HANDOFF.md` を参照（RGB_MATRIX移行・リポジトリ移管保留）。keyball-rp2040-firmwareの残タスクは `~/keyball-rp2040-firmware/HANDOFF.md` を参照。
- [ ] **トラックボール超低速（精密作業）モードの感度設定UI（アイデア段階、未着手）**: keyball-rp2040-firmware側で検討中の「対応キーを押している間だけ移動量を下げるモード」に対応するため、低速時の倍率をKeyball Linkの設定画面から調整できるようにしたい（本人希望。固定値ではなくUIから変更可能にする）。ファームウェア側の実装が先行する見込み。詳細は `~/keyball-rp2040-firmware/HANDOFF.md` 参照。

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
