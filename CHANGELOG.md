# Changelog

Keyball Link（Webアプリ）の変更履歴です。バージョンは [Semantic Versioning](https://semver.org/lang/ja/) に従います。
ファームウェア側の変更履歴は [keyball-link-firmware](https://github.com/Yowkees/keyball-link-firmware/blob/main/CHANGELOG.md) を参照してください（バージョン番号は連動していません）。

## [Unreleased]

## [1.0.0] - 2026-07-22
### Added
- Web版・ファームウェア双方にバージョン管理を導入。接続中のファームウェアのバージョンを画面下部に表示し、配布中の最新版より古い場合は更新を案内するように
### Fixed
- ジェスチャーを大きく振ると同じキーが複数回連続で送られてしまう不具合を修正（発火後にクールダウンを設け、1スイングにつき1回だけ発火するように）
- ジェスチャーの発動しきい値を左右・上下で個別に調整できるように変更（詳細設定タブにスライダーを追加）
