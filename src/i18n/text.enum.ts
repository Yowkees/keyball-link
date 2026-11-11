// Shared identifiers. Add new members without renumbering existing keys.
export enum TextKey {
  /** src/App.tsx:39 — Keyball Link 開発用 */
  DevelopmentTitle = "Text0001",
  /** src/App.tsx:90 — スクロール */
  Scroll = "Text0002",
  /** src/App.tsx:91 — 精密 */
  Precision = "Text0003",
  /** src/App.tsx:93 — ジェスチャー{p0} */
  GestureNumber = "Text0004",
  /** src/App.tsx:94 — ジェスチャー */
  Gesture = "Text0005",
  /** src/App.tsx:95 — カーソル */
  Cursor = "Text0006",
  /** src/App.tsx:147 — トラックボール（レイヤー{p0}）: {p1}（クリックで設定） */
  TrackballLayerHint = "Text0007",
  /** src/App.tsx:304 — レイヤーの並べ替えを保存しました */
  AppLayerOrderSaved = "Text0008",
  /** src/App.tsx:306 — 保存に失敗しました: {p0} */
  SaveError = "Text0009",
  /** src/App.tsx:328 — 並べ替え中はキー編集できません。保存または取り消してください。 */
  AppKeysCannotBeEditedWhileReordering = "Text0010",
  /** src/App.tsx:349 — キーコード書き込み失敗: {p0} */
  AppCouldNotWriteKeycode = "Text0011",
  /** src/App.tsx:363 — 元に戻す操作に失敗: {p0} */
  AppCouldNotUndo = "Text0012",
  /** src/App.tsx:377 — やり直し操作に失敗: {p0} */
  AppCouldNotRedo = "Text0013",
  /** src/App.tsx:409 — トラックボール設定失敗: {p0} */
  AppCouldNotConfigureTrackball = "Text0014",
  /** src/App.tsx:415 — LED設定失敗: {p0} */
  AppCouldNotConfigureLEDs = "Text0015",
  /** src/App.tsx:420 — 詳細設定の保存失敗: {p0} */
  AppCouldNotSaveAdvancedSettings = "Text0016",
  /** src/App.tsx:425 — ジェスチャー設定の保存失敗: {p0} */
  AppCouldNotSaveGestureSettings = "Text0017",
  /** src/App.tsx:430 — ジェスチャーモード設定の保存失敗: {p0} */
  AppCouldNotSaveGestureMode = "Text0018",
  /** src/App.tsx:435 — ジェスチャー感度の保存失敗: {p0} */
  AppCouldNotSaveGestureSensitivity = "Text0019",
  /** src/App.tsx:440 — ジェスチャーウェーブ速度の保存失敗: {p0} */
  AppCouldNotSaveGestureWaveSpeed = "Text0020",
  /** src/App.tsx:445 — ジェスチャーウェーブ有効/無効の保存失敗: {p0} */
  AppCouldNotSaveGestureWaveSwitch = "Text0021",
  /** src/App.tsx:450 — ジェスチャーウェーブの見た目の保存失敗: {p0} */
  AppCouldNotSaveGestureWaveStyle = "Text0022",
  /** src/App.tsx:455 — ジェスチャーウェーブの色の保存失敗: {p0} */
  AppCouldNotSaveGestureWaveColor = "Text0023",
  /** src/App.tsx:460 — シェイク設定の保存失敗: {p0} */
  AppCouldNotSaveShakeSettings = "Text0024",
  /** src/App.tsx:465 — ダブルフリック設定の保存失敗: {p0} */
  AppCouldNotSaveDoubleFlickSettings = "Text0025",
  /** src/App.tsx:470 — コンボ設定の保存失敗: {p0} */
  AppCouldNotSaveComboSettings = "Text0026",
  /** src/App.tsx:475 — DPIカーブ設定の保存失敗: {p0} */
  AppCouldNotSaveDPICurve = "Text0027",
  /** src/App.tsx:480 — タップダンス設定の保存失敗: {p0} */
  AppCouldNotSaveTapDance = "Text0028",
  /** src/App.tsx:485 — 精密モード設定の保存失敗: {p0} */
  AppCouldNotSavePrecisionMode = "Text0029",
  /** src/App.tsx:490 — 慣性スクロール設定の保存失敗: {p0} */
  AppCouldNotSaveScrollInertia = "Text0030",
  /** src/App.tsx:495 — レイヤー連動LED設定の保存失敗: {p0} */
  AppCouldNotSaveLayerLEDs = "Text0031",
  /** src/App.tsx:507 — Macro {p0} を保存しました */
  AppMacroSaved = "Text0032",
  /** src/App.tsx:509 — マクロ保存失敗: {p0} */
  AppCouldNotSaveMacro = "Text0033",
  /** src/App.tsx:552 — JSONをエクスポートしました */
  AppJSONExported = "Text0034",
  /** src/App.tsx:562 — keymap が見つかりません */
  AppMissingKeymap = "Text0035",
  /** src/App.tsx:564 — このファイルは {p0} 用です。接続中の {p1} に読み込むとキー配置が崩れる可能性があります。続行しますか？ */
  AppThisFileIsForImportingIt = "Text0036",
  /** src/App.tsx:566 — キーマップ（と各種設定）をインポートします。現在の設定は上書きされます。よろしいですか？ */
  AppImportKeymapAndSettingsCurrentSettings = "Text0037",
  /** src/App.tsx:698 — インポート完了（{p0}キー書き込み） */
  AppImportCompleteKeysWritten = "Text0038",
  /** src/App.tsx:700 — インポート失敗: {p0} */
  AppImportFailed = "Text0039",
  /** src/App.tsx:708 — キーマップをファームウェアのデフォルトに戻します。よろしいですか？ */
  AppResetTheKeymapToFirmwareDefaults = "Text0040",
  /** src/App.tsx:711 — キーマップをリセットしました */
  AppKeymapReset = "Text0041",
  /** src/App.tsx:713 — リセット失敗: {p0} */
  AppResetFailed = "Text0042",
  /** src/App.tsx:722 — キーマップを「{p0}」に置き換えます。現在のキー配置は上書きされます。よろしいですか？ */
  AppReplaceTheKeymapWithCurrentKey = "Text0043",
  /** src/App.tsx:728 — 「{p0}」を読み込みました */
  AppLoaded = "Text0044",
  /** src/App.tsx:730 — 読み込み失敗: {p0} */
  AppCouldNotLoad = "Text0045",
  /** src/App.tsx:741 — EEPROMに保存しました */
  AppSavedToEEPROM = "Text0046",
  /** src/App.tsx:743 — 保存失敗: {p0} */
  AppSaveFailed = "Text0047",
  /** src/App.tsx:832 — WEB CONFIGURATOR */
  AppWEBCONFIGURATOR = "Text0048",
  /** src/App.tsx:834 — テーマ切替 */
  SwitchTheme = "Text0049",
  /** src/App.tsx:835 — ☀ ライト */
  LightTheme = "Text0050",
  /** src/App.tsx:835 — ☾ ダーク */
  DarkTheme = "Text0051",
  /** src/App.tsx:843 — アクセントカラー: {p0} */
  AppAccentColor = "Text0052",
  /** src/App.tsx:852 — 切断 */
  Disconnect = "Text0053",
  /** src/App.tsx:855 — 初期化 */
  AppReset = "Text0054",
  /** src/App.tsx:863 — すべての設定を初期化する */
  AppResetAllSettings = "Text0055",
  /** src/App.tsx:864 — キーマップ・トラックボール（CPI/スクロール等）など全ての設定をKeyball Linkの初期状態に戻します */
  AppRestoreKeymapTrackballCPIScrollEtc = "Text0056",
  /** src/App.tsx:871 — キーマップをRemap版の初期設定にする */
  AppRestoreTheRemapDefaultKeymap = "Text0057",
  /** src/App.tsx:873 — キーマップだけを置き換えます（トラックボールなど他の設定はそのまま） */
  AppReplacesOnlyTheKeymapTrackballAnd = "Text0058",
  /** src/App.tsx:873 — このモデルには未対応です */
  AppNotSupportedOnThisModel = "Text0059",
  /** src/App.tsx:883 — 元に戻す操作がありません */
  AppNothingToUndo = "Text0060",
  /** src/App.tsx:883 — 直前のキー変更を元に戻す (Cmd/Ctrl+Z) */
  AppUndoTheLastKeyChangeCmd = "Text0061",
  /** src/App.tsx:885 — ↩ 元に戻す */
  AppUndo = "Text0062",
  /** src/App.tsx:891 — やり直す操作がありません */
  AppNothingToRedo = "Text0063",
  /** src/App.tsx:891 — 元に戻した変更をやり直す (Cmd/Ctrl+Shift+Z) */
  AppRedoTheUndoneChangeCmdCtrl = "Text0064",
  /** src/App.tsx:893 — ↪ やり直し */
  AppRedo = "Text0065",
  /** src/App.tsx:895 — キーマップ・マクロ・コンボ・タップダンス・ジェスチャー・精密モード・レイヤー連動LED・トラックボール設定などをJSONファイルに保存 */
  AppExportKeymapMacrosCombosTapDance = "Text0066",
  /** src/App.tsx:895 — エクスポート */
  AppExport = "Text0067",
  /** src/App.tsx:896 — JSONファイルからキーマップ・マクロ・各種設定を読み込む */
  AppImportKeymapMacrosAndSettingsFrom = "Text0068",
  /** src/App.tsx:897 — インポート */
  AppImport = "Text0069",
  /** src/App.tsx:904 — 未保存の変更があります */
  AppYouHaveUnsavedChanges = "Text0070",
  /** src/App.tsx:904 — 設定をキーボードに保存 */
  AppSaveSettingsToTheKeyboard = "Text0071",
  /** src/App.tsx:909 — ● 保存する */
  AppSaveChanges = "Text0072",
  /** src/App.tsx:910 — 保存 */
  Save = "Text0073",
  /** src/App.tsx:917 — WebHID非対応ブラウザです (Chrome推奨) */
  AppThisBrowserDoesNotSupportWebHID = "Text0074",
  /** src/App.tsx:931 — 接続中... */
  AppConnecting = "Text0075",
  /** src/App.tsx:931 — キーボードに接続 */
  ConnectKeyboard = "Text0076",
  /** src/App.tsx:956 — キーマップを読み込んでいます… */
  AppLoadingKeymap = "Text0077",
  /** src/App.tsx:957 — しばらくお待ちください（数秒かかる場合があります） */
  AppPleaseWaitThisMayTakeA = "Text0078",
  /** src/App.tsx:962 — キーマップ */
  Keymap = "Text0079",
  /** src/App.tsx:963 — トラックボール設定 */
  TrackballSettings = "Text0080",
  /** src/App.tsx:964 — マクロ拡張 */
  MacroSettings = "Text0081",
  /** src/App.tsx:965 — 詳細設定 */
  AdvancedSettings = "Text0082",
  /** src/App.tsx:966 — ファームウェア */
  Firmware = "Text0083",
  /** src/App.tsx:968 — タイピングゲーム */
  TypingGame = "Text0084",
  /** src/App.tsx:969 — ご意見・要望 */
  Feedback = "Text0085",
  /** src/App.tsx:975 — キーボードを USB で接続して「キーボードに接続」を押してください。 */
  AppConnectTheKeyboardViaUSBThen = "Text0086",
  /** src/App.tsx:976 — ※ Chrome / Edge などの WebHID 対応ブラウザが必要です。 */
  AppABrowserWithWebHIDSupportSuch = "Text0087",
  /** src/App.tsx:991 — 初めての方はこちら → */
  AppNewHereStartHere = "Text0088",
  /** src/App.tsx:1001 — モデルID */
  AppModelID = "Text0089",
  /** src/App.tsx:1001 — は未対応です */
  AppIsNotSupported = "Text0090",
  /** src/App.tsx:1002 — keyball39 / 44 / 61 のみサポートしています */
  AppOnlyKeyballAreSupported = "Text0091",
  /** src/App.tsx:1010 — 🔀 並べ替えをプレビュー中です。「保存」で確定します（レイヤー切替キーの番号も自動で調整されます）。 */
  AppPreviewingTheNewLayerOrderSave = "Text0092",
  /** src/App.tsx:1012 — 保存中… */
  AppSaving = "Text0093",
  /** src/App.tsx:1015 — 取り消し */
  AppCancel = "Text0094",
  /** src/App.tsx:1027 — 元レイヤー{p0}（ドラッグで並べ替え） */
  AppOriginalLayerDragToReorder = "Text0095",
  /** src/App.tsx:1027 — ドラッグで並べ替えできます */
  AppDragToReorder = "Text0096",
  /** src/App.tsx:1048 — すべてのレイヤーを並べて表示します（同じ位置のキーを見比べられます） */
  AppShowAllLayersSideBySide = "Text0097",
  /** src/App.tsx:1050 — 全レイヤー */
  AppAllLayers = "Text0098",
  /** src/App.tsx:1055 — オートマウス */
  AppAutoMouse = "Text0099",
  /** src/App.tsx:1058 — ボール（自動） */
  AppBallAutomatic = "Text0100",
  /** src/App.tsx:1058 — ボール */
  AppBall = "Text0101",
  /** src/App.tsx:1059 — キーボードから読み取ったボールの位置を表示しています */
  AppShowingTheBallPositionReportedBy = "Text0102",
  /** src/App.tsx:1060 — 左 */
  AppLeft = "Text0103",
  /** src/App.tsx:1061 — 右 */
  AppRight = "Text0104",
  /** src/App.tsx:1072 — Layer */
  AppLayer = "Text0105",
  /** src/App.tsx:1093 — キーをクリックすると、そのレイヤーに移動して編集できます */
  AppClickAKeyToSwitchTo = "Text0106",
  /** src/App.tsx:1146 — 並べ替え中はキー編集できません */
  AppCannotEditKeysWhileReordering = "Text0107",
  /** src/App.tsx:1200 — ・ ファームウェア: */
  AppFirmware = "Text0108",
  /** src/App.tsx:1206 — （最新版 */
  AppLatest = "Text0109",
  /** src/App.tsx:1206 — があります。「ファームウェア」タブから更新できます） */
  AppAvailableUpdateFromTheFirmwareTab = "Text0110",
  /** src/App.tsx:1211 — バージョン情報なし（古い版の可能性があります。更新をおすすめします） */
  AppNoVersionInformationPossiblyOutdatedUpdate = "Text0111",
  /** src/components/BallPanel/BallPanel.tsx:84 — {p0}（レイヤー{p1}） */
  BallPanelLayer = "Text0112",
  /** src/components/BallPanel/BallPanel.tsx:145 — 速さ（CPI） */
  BallPanelSpeedCPI = "Text0113",
  /** src/components/BallPanel/BallPanel.tsx:148 — 加速度 */
  BallPanelAcceleration = "Text0114",
  /** src/components/BallPanel/BallPanel.tsx:150 — オフ */
  BallPanelOff = "Text0115",
  /** src/components/BallPanel/BallPanel.tsx:151 — この版（LED版）では加速度は使用できません */
  BallPanelAccelerationIsUnavailableInThisLED = "Text0116",
  /** src/components/BallPanel/BallPanel.tsx:159 — スクロール速度 */
  BallPanelScrollSpeed = "Text0117",
  /** src/components/BallPanel/BallPanel.tsx:162 — 縦スクロールを反転 */
  BallPanelInvertVerticalScroll = "Text0118",
  /** src/components/BallPanel/BallPanel.tsx:164 — 横スクロールを反転 */
  BallPanelInvertHorizontalScroll = "Text0119",
  /** src/components/BallPanel/BallPanel.tsx:166 — スクロール方向 */
  BallPanelScrollDirection = "Text0120",
  /** src/components/BallPanel/BallPanel.tsx:169 — 縦のみ */
  BallPanelVerticalOnly = "Text0121",
  /** src/components/BallPanel/BallPanel.tsx:170 — 横のみ */
  BallPanelHorizontalOnly = "Text0122",
  /** src/components/BallPanel/BallPanel.tsx:171 — 自由（縦横） */
  BallPanelBothAxes = "Text0123",
  /** src/components/BallPanel/BallPanel.tsx:177 — 慣性スクロール */
  BallPanelScrollInertia = "Text0124",
  /** src/components/BallPanel/BallPanel.tsx:179 — 慣性レベル */
  BallPanelInertiaLevel = "Text0125",
  /** src/components/BallPanel/BallPanel.tsx:182 — 発動しやすさ */
  BallPanelTriggerSensitivity = "Text0126",
  /** src/components/BallPanel/BallPanel.tsx:193 — 精密モード */
  BallPanelPrecisionMode = "Text0127",
  /** src/components/BallPanel/BallPanel.tsx:197 — 減速レベル */
  BallPanelSlowdownLevel = "Text0128",
  /** src/components/BallPanel/BallPanel.tsx:198 — 分の1 */
  BallPanelOfNormalSpeed = "Text0129",
  /** src/components/BallPanel/BallPanel.tsx:206 — 上 ↑ */
  BallPanelUp = "Text0130",
  /** src/components/BallPanel/BallPanel.tsx:206 — 下 ↓ */
  BallPanelDown = "Text0131",
  /** src/components/BallPanel/BallPanel.tsx:207 — 左 ← */
  BallPanelLeft = "Text0132",
  /** src/components/BallPanel/BallPanel.tsx:207 — 右 → */
  BallPanelRight = "Text0133",
  /** src/components/BallPanel/BallPanel.tsx:215 — 未設定 */
  BallPanelNotSet = "Text0134",
  /** src/components/BallPanel/BallPanel.tsx:221 — 連続入力 */
  BallPanelRepeatInput = "Text0135",
  /** src/components/BallPanel/BallPanel.tsx:231 — 感度（横） */
  BallPanelHorizontalSensitivity = "Text0136",
  /** src/components/BallPanel/BallPanel.tsx:234 — 感度（縦） */
  BallPanelVerticalSensitivity = "Text0137",
  /** src/components/BallPanel/BallPanel.tsx:245 — ジェスチャーウェーブ */
  BallPanelGestureWave = "Text0138",
  /** src/components/BallPanel/BallPanel.tsx:250 — シャープ（瞬間的に光る） */
  BallPanelSharpBriefFlash = "Text0139",
  /** src/components/BallPanel/BallPanel.tsx:251 — ブリージング（柔らかく流れる） */
  BallPanelBreathingSoftFlow = "Text0140",
  /** src/components/BallPanel/BallPanel.tsx:256 — 色相 */
  BallPanelHue = "Text0141",
  /** src/components/BallPanel/BallPanel.tsx:258 — 彩度 */
  BallPanelSaturation = "Text0142",
  /** src/components/BallPanel/BallPanel.tsx:261 — 明るさ */
  BallPanelBrightness = "Text0143",
  /** src/components/BallPanel/BallPanel.tsx:268 — ウェーブの速さ */
  BallPanelWaveSpeed = "Text0144",
  /** src/components/BallPanel/BallPanel.tsx:278 — の設定は全レイヤー共通です（精密モードはレイヤーごと） */
  BallPanelSettingsApplyToAllLayersPrecision = "Text0145",
  /** src/components/BallPanel/BallPanel.tsx:287 — 通常 */
  BallPanelNormal = "Text0146",
  /** src/components/DpiCurveEditor/DpiCurveEditor.tsx:119 — 速い */
  DpiCurveEditorFast = "Text0147",
  /** src/components/DpiCurveEditor/DpiCurveEditor.tsx:120 — 出力の速さ */
  DpiCurveEditorOutputSpeed = "Text0148",
  /** src/components/DpiCurveEditor/DpiCurveEditor.tsx:121 — 遅い */
  DpiCurveEditorSlow = "Text0149",
  /** src/components/DpiCurveEditor/DpiCurveEditor.tsx:127 — 動きの速さ（入力） */
  DpiCurveEditorMovementSpeedInput = "Text0150",
  /** src/components/DpiCurveEditor/DpiCurveEditor.tsx:137 — 直線にリセット */
  DpiCurveEditorResetToLinear = "Text0151",
  /** src/components/FeedbackTab/FeedbackTab.tsx:12 — ※ 投稿には無料の GitHub アカウントが必要です（お持ちでない方はアカウント作成画面が表示されます）。 */
  FeedbackTabPostingRequiresAFreeGitHubAccount = "Text0152",
  /** src/components/FeedbackTab/FeedbackTab.tsx:17 — 不具合・エラーの報告 */
  FeedbackTabReportAProblem = "Text0153",
  /** src/components/FeedbackTab/FeedbackTab.tsx:21 — アプリが動かない・設定が保存できない・表示がおかしいなどの不具合は、 GitHub の Issues からご報告ください。できるだけ「何をしたか」「何が起きたか」を書いていただけると助かります。 */
  FeedbackTabReportAppErrorsSettingsThatDo = "Text0154",
  /** src/components/FeedbackTab/FeedbackTab.tsx:25 — GitHub Issues で報告する ↗ */
  FeedbackTabReportOnGitHubIssues = "Text0155",
  /** src/components/FeedbackTab/FeedbackTab.tsx:32 — 要望・アイデアの投稿 */
  FeedbackTabSuggestAFeature = "Text0156",
  /** src/components/FeedbackTab/FeedbackTab.tsx:36 — 「こんな機能が欲しい」「Keyball がこうなったら嬉しい」というアイデアは GitHub の Discussions へ。他の人の投稿も見られて、👍 で応援（投票）もできます。 */
  FeedbackTabShareFeatureRequestsAndIdeasFor = "Text0157",
  /** src/components/FeedbackTab/FeedbackTab.tsx:40 — 無線化してほしい */
  FeedbackTabWirelessSupport = "Text0158",
  /** src/components/FeedbackTab/FeedbackTab.tsx:41 — ロープロファイル版が欲しい */
  FeedbackTabALowProfileVersion = "Text0159",
  /** src/components/FeedbackTab/FeedbackTab.tsx:42 — 本体ケースを販売してほしい */
  FeedbackTabACaseForTheKeyboard = "Text0160",
  /** src/components/FeedbackTab/FeedbackTab.tsx:43 — アプリにこんな機能を追加してほしい */
  FeedbackTabAdditionalAppFeatures = "Text0161",
  /** src/components/FeedbackTab/FeedbackTab.tsx:46 — GitHub Discussions で投稿・閲覧する ↗ */
  FeedbackTabPostOrBrowseGitHubDiscussions = "Text0162",
  /** src/components/FirmwareFlasher/FirmwareFlasher.tsx:110 — この機種のRP2040版ファームウェアはまだありません */
  FirmwareFlasherRPFirmwareIsNotYetAvailable = "Text0163",
  /** src/components/FirmwareFlasher/FirmwareFlasher.tsx:112 — ファームウェア取得失敗: {p0} */
  FirmwareFlasherCouldNotDownloadFirmware = "Text0164",
  /** src/components/FirmwareFlasher/FirmwareFlasher.tsx:117 — この機種のAVR版ファームウェアは配布していません */
  FirmwareFlasherAVRFirmwareIsNotDistributedFor = "Text0165",
  /** src/components/FirmwareFlasher/FirmwareFlasher.tsx:122 — ファイルが選択されていません */
  FirmwareFlasherNoFileSelected = "Text0166",
  /** src/components/FirmwareFlasher/FirmwareFlasher.tsx:132 — ファームウェアを読み込んでいます… */
  FirmwareFlasherLoadingFirmware = "Text0167",
  /** src/components/FirmwareFlasher/FirmwareFlasher.tsx:136 — ブートローダーモードに切り替え中… */
  FirmwareFlasherSwitchingToBootloaderMode = "Text0168",
  /** src/components/FirmwareFlasher/FirmwareFlasher.tsx:159 — このブラウザはWeb Serial非対応のため書き込みできません。Chrome または Edge をご利用ください。 */
  FirmwareFlasherCannotFlashThisBrowserDoesNot = "Text0169",
  /** src/components/FirmwareFlasher/FirmwareFlasher.tsx:163 — シリアルポートを選択してください（「ProMicro 5V」を選ぶ） */
  FirmwareFlasherSelectTheSerialPortProMicroV = "Text0170",
  /** src/components/FirmwareFlasher/FirmwareFlasher.tsx:170 — ポート選択がキャンセルされました。 */
  FirmwareFlasherPortSelectionCancelled = "Text0171",
  /** src/components/FirmwareFlasher/FirmwareFlasher.tsx:177 — ポートに接続中… */
  FirmwareFlasherConnectingToPort = "Text0172",
  /** src/components/FirmwareFlasher/FirmwareFlasher.tsx:184 — 書き込み完了！ キーボードが再起動します。 */
  FirmwareFlasherFlashCompleteTheKeyboardWillRestart = "Text0173",
  /** src/components/FirmwareFlasher/FirmwareFlasher.tsx:204 — このブラウザはFile System Access API非対応のため書き込みできません。Chrome または Edge をご利用ください。 */
  FirmwareFlasherCannotFlashThisBrowserDoesNot2 = "Text0174",
  /** src/components/FirmwareFlasher/FirmwareFlasher.tsx:208 — 「RPI-RP2」という名前のドライブを選択してください */
  FirmwareFlasherSelectTheDriveNamedRPIRP = "Text0175",
  /** src/components/FirmwareFlasher/FirmwareFlasher.tsx:215 — フォルダ選択がキャンセルされました。 */
  FirmwareFlasherFolderSelectionCancelled = "Text0176",
  /** src/components/FirmwareFlasher/FirmwareFlasher.tsx:252 — ファームウェア書き込み */
  FirmwareFlasherFlashFirmware = "Text0177",
  /** src/components/FirmwareFlasher/FirmwareFlasher.tsx:258 — File System Access API 非対応のブラウザです。Chrome または Edge をお使いください。 */
  FirmwareFlasherThisBrowserDoesNotSupportThe = "Text0178",
  /** src/components/FirmwareFlasher/FirmwareFlasher.tsx:259 — WebSerial API 非対応のブラウザです。Chrome または Edge をお使いください。 */
  FirmwareFlasherThisBrowserDoesNotSupportWeb = "Text0179",
  /** src/components/FirmwareFlasher/FirmwareFlasher.tsx:264 — ファームウェアを選択 */
  FirmwareFlasherSelectFirmware = "Text0180",
  /** src/components/FirmwareFlasher/FirmwareFlasher.tsx:266 — モデル */
  FirmwareFlasherModel = "Text0181",
  /** src/components/FirmwareFlasher/FirmwareFlasher.tsx:278 — ✓ 接続中と一致 */
  FirmwareFlasherMatchesConnectedKeyboard = "Text0182",
  /** src/components/FirmwareFlasher/FirmwareFlasher.tsx:278 — ⚠ 接続中: {p0} */
  FirmwareFlasherConnected = "Text0183",
  /** src/components/FirmwareFlasher/FirmwareFlasher.tsx:283 — マイコン */
  FirmwareFlasherMicrocontroller = "Text0184",
  /** src/components/FirmwareFlasher/FirmwareFlasher.tsx:287 — この機種はRP2040版のみ配布しています */
  FirmwareFlasherOnlyRPFirmwareIsAvailableFor = "Text0185",
  /** src/components/FirmwareFlasher/FirmwareFlasher.tsx:288 — AVR版（Pro Micro等） */
  FirmwareFlasherAVRProMicroEtc = "Text0186",
  /** src/components/FirmwareFlasher/FirmwareFlasher.tsx:291 — (書き込み回数: */
  FirmwareFlasherFlashCount = "Text0187",
  /** src/components/FirmwareFlasher/FirmwareFlasher.tsx:297 — この機種のRP2040版はまだありません */
  FirmwareFlasherRPIsNotYetAvailableFor = "Text0188",
  /** src/components/FirmwareFlasher/FirmwareFlasher.tsx:298 — RP2040版（RP2040 ProMicro） */
  FirmwareFlasherRPRPProMicro = "Text0189",
  /** src/components/FirmwareFlasher/FirmwareFlasher.tsx:310 — ビルド済みを使用 */
  FirmwareFlasherUseBundledFirmware = "Text0190",
  /** src/components/FirmwareFlasher/FirmwareFlasher.tsx:314 — .uf2 ファイルを選択 */
  FirmwareFlasherChooseUfFile = "Text0191",
  /** src/components/FirmwareFlasher/FirmwareFlasher.tsx:314 — .hex ファイルを選択 */
  FirmwareFlasherChooseHexFile = "Text0192",
  /** src/components/FirmwareFlasher/FirmwareFlasher.tsx:321 — バージョン（この機種は容量の都合で2種類あります） */
  FirmwareFlasherVersionTwoVariantsDueToMemory = "Text0193",
  /** src/components/FirmwareFlasher/FirmwareFlasher.tsx:326 — 通常版（音量キーあり・マクロあり・LEDなし） */
  FirmwareFlasherStandardMediaKeysAndMacrosNo = "Text0194",
  /** src/components/FirmwareFlasher/FirmwareFlasher.tsx:333 — LED版（LEDあり・音量キーあり・マクロなし） */
  FirmwareFlasherLEDLEDsAndMediaKeysNo = "Text0195",
  /** src/components/FirmwareFlasher/FirmwareFlasher.tsx:341 — LEDが光ります。音量などのメディアキー・キーごとのタップ判定調整も使えます。かわりにマクロ・ジェスチャー・トラックボール加速は使えません。 */
  FirmwareFlasherIncludesLEDsMediaKeysAndPer = "Text0196",
  /** src/components/FirmwareFlasher/FirmwareFlasher.tsx:342 — 音量などのメディアキー・マクロ・ジェスチャー・キーごとの詳細設定が使えます。LEDは光りません。 */
  FirmwareFlasherIncludesMediaKeysMacrosGesturesAnd = "Text0197",
  /** src/components/FirmwareFlasher/FirmwareFlasher.tsx:346 — 以前からLED版をお使いで、マクロを設定していた方へ */
  FirmwareFlasherForExistingLEDFirmwareUsersWith = "Text0198",
  /** src/components/FirmwareFlasher/FirmwareFlasher.tsx:347 — v1.1.0からLED版はマクロが使えなくなり、かわりに音量などのメディアキーが使えるようになりました。 */
  FirmwareFlasherSinceVLEDFirmwareSupportsMedia = "Text0199",
  /** src/components/FirmwareFlasher/FirmwareFlasher.tsx:348 — 書き込むと、これまで設定していたマクロの内容は確認・編集できなくなります（取り出す機能はありません）。 */
  FirmwareFlasherAfterFlashingExistingMacrosCannotBe = "Text0200",
  /** src/components/FirmwareFlasher/FirmwareFlasher.tsx:349 — 必要な内容は、書き込む前に控えておいてください。 */
  FirmwareFlasherKeepASeparateCopyOfAnything = "Text0201",
  /** src/components/FirmwareFlasher/FirmwareFlasher.tsx:365 — 書き込む */
  FirmwareFlasherFlash = "Text0202",
  /** src/components/FirmwareFlasher/FirmwareFlasher.tsx:368 — 「書き込む」を押すと自動でブートローダーモードに切り替わります。 */
  FirmwareFlasherClickFlashToSwitchToBootloader = "Text0203",
  /** src/components/FirmwareFlasher/FirmwareFlasher.tsx:371 — 💡 「書き込む」を押すとポート選択ダイアログが開きます。 */
  FirmwareFlasherClickFlashToOpenThePort = "Text0204",
  /** src/components/FirmwareFlasher/FirmwareFlasher.tsx:372 — ダイアログが開いた状態で */
  FirmwareFlasherWithTheDialogOpen = "Text0205",
  /** src/components/FirmwareFlasher/FirmwareFlasher.tsx:372 — リセットボタンを素早く2回押してください。 */
  FirmwareFlasherQuicklyPressTheResetButtonTwice = "Text0206",
  /** src/components/FirmwareFlasher/FirmwareFlasher.tsx:373 — 「ProMicro 5V」がリストに現れたら選択すると書き込み開始です。 */
  FirmwareFlasherWhenProMicroVAppearsSelectIt = "Text0207",
  /** src/components/FirmwareFlasher/FirmwareFlasher.tsx:378 — 「書き込む」を押すと自動でブートローダーモードに切り替わり、フォルダ選択ダイアログが開きます。 */
  FirmwareFlasherClickFlashToEnterBootloaderMode = "Text0208",
  /** src/components/FirmwareFlasher/FirmwareFlasher.tsx:381 — 💡 「書き込む」を押すとフォルダ選択ダイアログが開きます。 */
  FirmwareFlasherClickFlashToOpenTheFolder = "Text0209",
  /** src/components/FirmwareFlasher/FirmwareFlasher.tsx:382 — すでにKeyball Linkのファームウェアが入っている場合 */
  FirmwareFlasherIfKeyballLinkFirmwareIsAlready = "Text0210",
  /** src/components/FirmwareFlasher/FirmwareFlasher.tsx:382 — ：リセットボタンを素早く2回押すとブートローダーモードになります。 */
  FirmwareFlasherQuicklyPressResetTwiceToEnter = "Text0211",
  /** src/components/FirmwareFlasher/FirmwareFlasher.tsx:383 — 初めて書き込む・工場出荷状態の場合 */
  FirmwareFlasherForTheFirstFlashOrFactory = "Text0212",
  /** src/components/FirmwareFlasher/FirmwareFlasher.tsx:383 — ：BOOTSELボタンを押しながらUSBケーブルを挿し直してください。 */
  FirmwareFlasherHoldBOOTSELWhileReconnectingTheUSB = "Text0213",
  /** src/components/FirmwareFlasher/FirmwareFlasher.tsx:384 — 「RPI-RP2」という名前のドライブがリストに現れたら選択すると書き込み開始です。 */
  FirmwareFlasherSelectTheRPIRPDriveWhen = "Text0214",
  /** src/components/FirmwareFlasher/FirmwareFlasher.tsx:415 — うまくいかない場合 */
  FirmwareFlasherTroubleshooting = "Text0215",
  /** src/components/FirmwareFlasher/FirmwareFlasher.tsx:418 — ブラウザからの書き込みは環境によって失敗することがあります。 */
  FirmwareFlasherBrowserFlashingMayFailDependingOn = "Text0216",
  /** src/components/FirmwareFlasher/FirmwareFlasher.tsx:419 — うまくいかない場合は */
  FirmwareFlasherIfFlashingFailsUse = "Text0217",
  /** src/components/FirmwareFlasher/FirmwareFlasher.tsx:419 — で初回書き込みを行ってください。 */
  FirmwareFlasherForTheInitialFlash = "Text0218",
  /** src/components/FirmwareFlasher/FirmwareFlasher.tsx:420 — 初回書き込み後は「キーボードに接続」→「書き込む」で自動的にブートローダーに切り替わります。 */
  FirmwareFlasherAfterTheInitialFlashConnectKeyboard = "Text0219",
  /** src/components/FirmwareFlasher/FirmwareFlasher.tsx:425 — 左右の両方に書き込む */
  FirmwareFlasherFlashBothHalves = "Text0220",
  /** src/components/FirmwareFlasher/FirmwareFlasher.tsx:428 — Keyballは左右の基板それぞれにマイコンがあります。書き込み・更新をする時は、 USBケーブルを反対側に挿し替えて */
  FirmwareFlasherEachHalfHasItsOwnMicrocontroller = "Text0221",
  /** src/components/FirmwareFlasher/FirmwareFlasher.tsx:429 — 左右の両方に同じファームウェアを書き込んでください */
  FirmwareFlasherFlashTheSameFirmwareToBoth = "Text0222",
  /** src/components/FirmwareFlasher/FirmwareFlasher.tsx:430 — 片側だけ更新すると、LEDの光り方などが左右で合わなくなることがあります。 */
  FirmwareFlasherUpdatingOnlyOneHalfMayCause = "Text0223",
  /** src/components/FirmwareFlasher/FirmwareFlasher.tsx:435 — 公式ファームからの乗り換え */
  FirmwareFlasherSwitchingFromOfficialFirmware = "Text0224",
  /** src/components/FirmwareFlasher/FirmwareFlasher.tsx:438 — 書き込むと今のキー設定は引き継がれません。 */
  FirmwareFlasherYourCurrentKeySettingsWillNot = "Text0225",
  /** src/components/FirmwareFlasher/FirmwareFlasher.tsx:439 — などで現在のキーマップを保存（バックアップ）してから書き込んでください。 */
  FirmwareFlasherOrASimilarToolToBack = "Text0226",
  /** src/components/FirmwareFlasher/FirmwareFlasher.tsx:444 — 他のファームに戻す */
  FirmwareFlasherSwitchingToAnotherFirmware = "Text0227",
  /** src/components/FirmwareFlasher/FirmwareFlasher.tsx:447 — Keyball Linkから正規ファームウェアなど別のファームウェアに書き戻す場合は、 */
  FirmwareFlasherBeforeReplacingKeyballLinkWithOfficial = "Text0228",
  /** src/components/FirmwareFlasher/FirmwareFlasher.tsx:448 — 先に画面上部の「初期化」▾ から「すべての設定を初期化する」を選んでKeyball Link独自の設定を消してから */
  FirmwareFlasherChooseResetResetAllSettingsAt = "Text0229",
  /** src/components/FirmwareFlasher/FirmwareFlasher.tsx:449 — 書き込んでください（「キーマップをRemap版の初期設定にする」ではKeyball Link独自の設定は消えないのでご注意ください）。 */
  FirmwareFlasherFlashTheOtherFirmwareRestoringThe = "Text0230",
  /** src/components/FirmwareFlasher/FirmwareFlasher.tsx:450 — 設定を消さずに書き込むと、Keyball Link独自の設定がEEPROMに残ったまま新しいファームウェアが動き出し、 レイヤーが正しく切り替わらないなど意図しない動作の原因になることがあります。 */
  FirmwareFlasherOtherwiseKeyballLinkSettingsRemainIn = "Text0231",
  /** src/components/KeyboardLayout/KeyboardLayout.tsx:261 — キーをクリックで設定 ／ マウスを乗せると説明が表示されます */
  KeyboardLayoutClickAKeyToConfigureIt = "Text0232",
  /** src/components/KeyConfigModal/KeyConfigModal.tsx:32 — すべて */
  All = "Text0233",
  /** src/components/KeyConfigModal/KeyConfigModal.tsx:33 — 文字/数字 */
  KeyConfigModalLettersNumbers = "Text0234",
  /** src/components/KeyConfigModal/KeyConfigModal.tsx:33 — 文字 */
  KeyConfigModalLetters = "Text0235",
  /** src/components/KeyConfigModal/KeyConfigModal.tsx:33 — 数字 */
  KeyConfigModalNumbers = "Text0236",
  /** src/components/KeyConfigModal/KeyConfigModal.tsx:34 — 記号 */
  KeyConfigModalSymbols = "Text0237",
  /** src/components/KeyConfigModal/KeyConfigModal.tsx:34 — Shift記号 */
  KeyConfigModalShiftSymbols = "Text0238",
  /** src/components/KeyConfigModal/KeyConfigModal.tsx:34 — JIS記号 */
  KeyConfigModalJISSymbols = "Text0239",
  /** src/components/KeyConfigModal/KeyConfigModal.tsx:35 — 操作 */
  KeyConfigModalActions = "Text0240",
  /** src/components/KeyConfigModal/KeyConfigModal.tsx:35 — 基本 */
  KeyConfigModalBasic = "Text0241",
  /** src/components/KeyConfigModal/KeyConfigModal.tsx:35 — 修飾 */
  KeyConfigModalModifiers = "Text0242",
  /** src/components/KeyConfigModal/KeyConfigModal.tsx:35 — 矢印 */
  KeyConfigModalArrows = "Text0243",
  /** src/components/KeyConfigModal/KeyConfigModal.tsx:35 — システム */
  KeyConfigModalSystem = "Text0244",
  /** src/components/KeyConfigModal/KeyConfigModal.tsx:36 — F/テンキー */
  KeyConfigModalFKeysNumpad = "Text0245",
  /** src/components/KeyConfigModal/KeyConfigModal.tsx:36 — テンキー */
  KeyConfigModalNumpad = "Text0246",
  /** src/components/KeyConfigModal/KeyConfigModal.tsx:37 — 日本語 */
  KeyConfigModalJapanese = "Text0247",
  /** src/components/KeyConfigModal/KeyConfigModal.tsx:38 — レイヤー */
  KeyConfigModalLayers = "Text0248",
  /** src/components/KeyConfigModal/KeyConfigModal.tsx:38 — ワンショット */
  KeyConfigModalOneShot = "Text0249",
  /** src/components/KeyConfigModal/KeyConfigModal.tsx:38 — タップダンス */
  KeyConfigModalTapDance = "Text0250",
  /** src/components/KeyConfigModal/KeyConfigModal.tsx:39 — マウス */
  KeyConfigModalMouse = "Text0251",
  /** src/components/KeyConfigModal/KeyConfigModal.tsx:40 — メディア */
  KeyConfigModalMedia = "Text0252",
  /** src/components/KeyConfigModal/KeyConfigModal.tsx:43 — マクロ */
  KeyConfigModalMacros = "Text0253",
  /** src/components/KeyConfigModal/KeyConfigModal.tsx:44 — 特殊 */
  KeyConfigModalSpecial = "Text0254",
  /** src/components/KeyConfigModal/KeyConfigModal.tsx:95 — キーを検索… */
  KeyConfigModalSearchKeys = "Text0255",
  /** src/components/KeyConfigModal/KeyConfigModal.tsx:108 — なし */
  KeyConfigModalNone = "Text0256",
  /** src/components/KeyConfigModal/KeyConfigModal.tsx:125 — 一致するキーが見つかりません */
  KeyConfigModalNoMatchingKeys = "Text0257",
  /** src/components/KeyConfigModal/KeyConfigModal.tsx:128 — キーにマウスを乗せると説明が表示されます */
  KeyConfigModalHoverOverAKeyForIts = "Text0258",
  /** src/components/KeyConfigModal/KeyConfigModal.tsx:209 — 左右の修飾キーを切り替え */
  KeyConfigModalSwitchBetweenLeftAndRightModifiers = "Text0259",
  /** src/components/KeyConfigModal/KeyConfigModal.tsx:211 — 右側 */
  KeyConfigModalRightSide = "Text0260",
  /** src/components/KeyConfigModal/KeyConfigModal.tsx:216 — 選択中: */
  KeyConfigModalSelected = "Text0261",
  /** src/components/KeyConfigModal/KeyConfigModal.tsx:216 — ＋ クリックしたキー */
  KeyConfigModalClickedKey = "Text0262",
  /** src/components/KeyConfigModal/KeyConfigModal.tsx:275 — {p0} — このファーム版では使用できません */
  KeyConfigModalUnavailableInThisFirmware = "Text0263",
  /** src/components/KeyConfigModal/KeyConfigModal.tsx:275 — 修飾キーと組み合わせできません */
  KeyConfigModalCannotCombineWithModifiers = "Text0264",
  /** src/components/KeyConfigModal/KeyConfigModal.tsx:284 — キー */
  KeyConfigModalKey = "Text0265",
  /** src/components/KeyConfigModal/KeyConfigModal.tsx:324 — （修飾キー未選択） */
  KeyConfigModalNoModifierSelected = "Text0266",
  /** src/components/KeyConfigModal/KeyConfigModal.tsx:325 — レイヤー {p0} */
  KeyConfigModalLayer = "Text0267",
  /** src/components/KeyConfigModal/KeyConfigModal.tsx:348 — ホールド時の動作 */
  KeyConfigModalActionWhenHeld = "Text0268",
  /** src/components/KeyConfigModal/KeyConfigModal.tsx:350 — 修飾キー */
  KeyConfigModalModifierKey = "Text0269",
  /** src/components/KeyConfigModal/KeyConfigModal.tsx:351 — レイヤー切替 */
  KeyConfigModalSwitchLayer = "Text0270",
  /** src/components/KeyConfigModal/KeyConfigModal.tsx:381 — タップ時のキー */
  KeyConfigModalKeyWhenTapped = "Text0271",
  /** src/components/KeyConfigModal/KeyConfigModal.tsx:386 — タップ: */
  KeyConfigModalTap = "Text0272",
  /** src/components/KeyConfigModal/KeyConfigModal.tsx:386 — ホールド: */
  KeyConfigModalHold = "Text0273",
  /** src/components/KeyConfigModal/KeyConfigModal.tsx:387 — （タップ時のキーを選択すると反映されます） */
  KeyConfigModalAppliedAfterSelectingATapKey = "Text0274",
  /** src/components/KeyConfigModal/KeyConfigModal.tsx:415 — キーコード（16進数） */
  KeyConfigModalKeycodeHexadecimal = "Text0275",
  /** src/components/KeyConfigModal/KeyConfigModal.tsx:430 — 解釈: */
  KeyConfigModalInterpretedAs = "Text0276",
  /** src/components/KeyConfigModal/KeyConfigModal.tsx:432 — このキーはここには設定できません */
  KeyConfigModalThisKeyCannotBeAssignedHere = "Text0277",
  /** src/components/KeyConfigModal/KeyConfigModal.tsx:435 — 0x0000〜0xFFFF の16進数を入力してください */
  KeyConfigModalEnterAHexadecimalValueFromX = "Text0278",
  /** src/components/KeyConfigModal/KeyConfigModal.tsx:440 — このキーコードを設定 */
  KeyConfigModalAssignThisKeycode = "Text0279",
  /** src/components/KeyConfigModal/KeyConfigModal.tsx:448 — ホールド */
  Hold = "Text0280",
  /** src/components/KeyConfigModal/KeyConfigModal.tsx:498 — キー設定 */
  KeyConfigModalKeySettings = "Text0281",
  /** src/components/KeyConfigModal/KeyConfigModal.tsx:499 — 現在: */
  KeyConfigModalCurrent = "Text0282",
  /** src/components/KeyConfigModal/KeyConfigModal.tsx:505 — カスタム */
  Custom = "Text0283",
  /** src/components/KeyConfigModal/KeyConfigModal.tsx:520 — 先にキーマップ上のキーを選択してください */
  KeyConfigModalSelectAKeyOnTheKeymap = "Text0284",
  /** src/components/KeyConfigModal/KeyConfigModal.tsx:559 — キー設定 — 現在: */
  KeyConfigModalKeySettingsCurrent = "Text0285",
  /** src/components/KeyLayoutCards/KeyLayoutCards.tsx:37 — JIS配列 */
  KeyLayoutCardsJISLayout = "Text0287",
  /** src/components/KeyLayoutCards/KeyLayoutCards.tsx:43 — US配列 */
  KeyLayoutCardsUSLayout = "Text0288",
  /** src/components/KeyLayoutCards/KeyLayoutCards.tsx:77 — 使用する配列： */
  KeyLayoutCardsKeyboardLayout = "Text0289",
  /** src/components/KeyLayoutCards/KeyLayoutCards.tsx:83 — @ は独立キー */
  KeyLayoutCardsHasItsOwnKey = "Text0290",
  /** src/components/KeyLayoutCards/KeyLayoutCards.tsx:90 — @ は Shift+2 */
  KeyLayoutCardsIsShift = "Text0291",
  /** src/components/KeyLayoutCards/KeyLayoutCards.tsx:96 — キーボードを接続すると、そのモデル専用のコマンドが表示されます。 */
  KeyLayoutCardsConnectTheKeyboardToDisplayThe = "Text0292",
  /** src/components/KeyLayoutCards/KeyLayoutCards.tsx:101 — 対象モデル: */
  KeyLayoutCardsTargetModel = "Text0293",
  /** src/components/KeyLayoutCards/KeyLayoutCards.tsx:107 — ターミナルを開く（Finder → アプリケーション → ユーティリティ → ターミナル） */
  KeyLayoutCardsOpenTerminalFinderApplicationsUtilitiesTerminal = "Text0294",
  /** src/components/KeyLayoutCards/KeyLayoutCards.tsx:111 — 以下のコマンドをコピーして貼り付け、Enterを押す */
  KeyLayoutCardsCopyAndPasteTheCommandBelow = "Text0295",
  /** src/components/KeyLayoutCards/KeyLayoutCards.tsx:121 — ✅ コピー済み */
  KeyLayoutCardsCopied = "Text0296",
  /** src/components/KeyLayoutCards/KeyLayoutCards.tsx:121 — 📋 コピー */
  KeyLayoutCardsCopy = "Text0297",
  /** src/components/KeyLayoutCards/KeyLayoutCards.tsx:127 — コマンド実行後、キーボードを一度抜き差しする */
  KeyLayoutCardsAfterRunningTheCommandDisconnectAnd = "Text0298",
  /** src/components/KeyLayoutCards/KeyLayoutCards.tsx:131 — ※ 一度設定すれば次回以降は不要です。JIS/USを切り替えたい場合は配列を選び直してコマンドを再実行してください。 */
  KeyLayoutCardsThisOnlyNeedsToBeDone = "Text0299",
  /** src/components/KeyLayoutCards/KeyLayoutCards.tsx:132 — ※ このMacで初めて接続する機種・ファームウェアの場合、抜き差しだけでは反映されないことがあります。その場合はMacを再起動してから確認してください。 */
  KeyLayoutCardsForAModelOrFirmwareConnected = "Text0300",
  /** src/components/KeyPicker/KeyPicker.tsx:66 — タップ → 通常キー / ホールド → 修飾キー として動作します。 */
  KeyPickerTapSendsANormalKeyHolding = "Text0301",
  /** src/components/KeyPicker/KeyPicker.tsx:69 — ホールド時の修飾キー */
  KeyPickerModifierWhenHeld = "Text0302",
  /** src/components/KeyPicker/KeyPicker.tsx:79 — （なし） */
  KeyPickerNone = "Text0303",
  /** src/components/KeyPicker/KeyPicker.tsx:86 — プレビュー: タップ= */
  KeyPickerPreviewTap = "Text0304",
  /** src/components/KeyPicker/KeyPicker.tsx:86 — / ホールド= */
  KeyPickerHold = "Text0305",
  /** src/components/KeyPicker/KeyPicker.tsx:93 — このMod-Tapを設定 */
  KeyPickerAssignThisModTap = "Text0306",
  /** src/components/KeyPicker/KeyPicker.tsx:113 — タップ → 通常キー / ホールド → レイヤー有効化 として動作します。 */
  KeyPickerTapSendsANormalKeyHolding2 = "Text0307",
  /** src/components/KeyPicker/KeyPicker.tsx:116 — ホールド時のレイヤー */
  KeyPickerLayerWhenHeld = "Text0308",
  /** src/components/KeyPicker/KeyPicker.tsx:140 — このLayer-Tapを設定 */
  KeyPickerAssignThisLayerTap = "Text0309",
  /** src/components/LayerFeatures/AutoMouseLayerCard.tsx:22 — 切り替わるレイヤー */
  AutoMouseLayerCardTargetLayer = "Text0310",
  /** src/components/LayerFeatures/AutoMouseLayerCard.tsx:44 — 通常レイヤーに戻るまでの時間 */
  AutoMouseLayerCardTimeBeforeReturningToTheNormal = "Text0311",
  /** src/components/LayerFeatures/AutoMouseLayerCard.tsx:55 — 感度 */
  AutoMouseLayerCardSensitivity = "Text0312",
  /** src/components/LayerFeatures/DoubleFlickCard.tsx:21 — このファームは非対応です。 */
  DoubleFlickCardNotSupportedByThisFirmware = "Text0313",
  /** src/components/LayerFeatures/DoubleFlickCard.tsx:38 — フリック判定の感度 */
  DoubleFlickCardFlickSensitivity = "Text0314",
  /** src/components/LayerFeatures/DoubleFlickCard.tsx:47 — フリック受付動作時間 */
  DoubleFlickCardMaximumFlickDuration = "Text0315",
  /** src/components/LayerFeatures/DoubleFlickCard.tsx:56 — 2回目の受付時間 */
  DoubleFlickCardSecondFlickTimeWindow = "Text0316",
  /** src/components/LayerFeatures/GestureCard.tsx:103 — 連動レイヤー */
  GestureCardLinkedLayer = "Text0317",
  /** src/components/LayerFeatures/GestureCard.tsx:124 — 感度（4モード共通） */
  GestureCardSensitivitySharedByModes = "Text0318",
  /** src/components/LayerFeatures/GestureCard.tsx:125 — 左右方向 */
  GestureCardHorizontal = "Text0319",
  /** src/components/LayerFeatures/GestureCard.tsx:131 — 上下方向 */
  GestureCardVertical = "Text0320",
  /** src/components/LayerFeatures/GestureCard.tsx:161 — ブリージング（柔らかく呼吸するように流れる） */
  GestureCardBreathingSoftBreathingFlow = "Text0321",
  /** src/components/LayerFeatures/GestureCard.tsx:207 — 速さ */
  GestureCardSpeed = "Text0322",
  /** src/components/LayerFeatures/GestureCard.tsx:257 — タップ */
  GestureCardTap = "Text0323",
  /** src/components/LayerFeatures/GestureCard.tsx:259 — なし（長押し専用） */
  GestureCardNoneHoldOnly = "Text0324",
  /** src/components/LayerFeatures/GestureCard.tsx:267 — ジェスチャーレイヤー */
  GestureCardGestureLayer = "Text0325",
  /** src/components/LayerFeatures/GestureCard.tsx:320 — ジェスチャーキーをタップした時のキー */
  GestureCardKeySentWhenTappingTheGesture = "Text0326",
  /** src/components/LayerFeatures/ScrollLayerCard.tsx:29 — スクロールになるレイヤー */
  ScrollLayerCardScrollLayer = "Text0327",
  /** src/components/LayerFeatures/ScrollLayerCard.tsx:69 — 反転 */
  ScrollLayerCardInvert = "Text0328",
  /** src/components/LayerFeatures/ScrollLayerCard.tsx:75 — 縦 */
  ScrollLayerCardVertical = "Text0329",
  /** src/components/LayerFeatures/ScrollLayerCard.tsx:75 — ON */
  ScrollLayerCardON = "Text0330",
  /** src/components/LayerFeatures/ScrollLayerCard.tsx:75 — OFF */
  ScrollLayerCardOFF = "Text0331",
  /** src/components/LayerFeatures/ScrollLayerCard.tsx:82 — 横 */
  ScrollLayerCardHorizontal = "Text0332",
  /** src/components/LayerFeatures/ShakeCard.tsx:27 — 発動キー */
  ShakeCardTriggerKey = "Text0333",
  /** src/components/LayerFeatures/ShakeCard.tsx:43 — シェイク回数 */
  ShakeCardShakeCount = "Text0334",
  /** src/components/LayerFeatures/ShakeCard.tsx:46 — 回 */
  ShakeCardTimes = "Text0335",
  /** src/components/LayerFeatures/ShakeCard.tsx:52 — 振り切る時間の上限 */
  ShakeCardMaximumShakeDuration = "Text0336",
  /** src/components/LEDSettings/LedPanel.tsx:32 — LED設定 */
  LedPanelLEDSettings = "Text0337",
  /** src/components/LEDSettings/LedPanel.tsx:34 — ⚠ この版（通常版）ではLEDは使用できません。LED版のファームを書き込むと設定できます。 */
  LedPanelLEDsAreUnavailableInStandardFirmware = "Text0338",
  /** src/components/LEDSettings/LEDSettings.tsx:119 — オフの間はレイヤー0の光り方で光ります */
  LEDSettingsWhenOffUsesLayerLighting = "Text0339",
  /** src/components/LEDSettings/LEDSettings.tsx:119 — 色相固定のエフェクトです（彩度・明度は調整できます） */
  LEDSettingsThisEffectUsesAFixedHue = "Text0340",
  /** src/components/LEDSettings/LEDSettings.tsx:140 — 明度 */
  LEDSettingsBrightness = "Text0341",
  /** src/components/LEDSettings/LEDSettings.tsx:142 — 速度 */
  LEDSettingsSpeed = "Text0342",
  /** src/components/LedTestPanel/LedTestPanel.tsx:143 — LED {p0}: 未記録 */
  LedTestPanelLEDNotRecorded = "Text0343",
  /** src/components/LedTestPanel/LedTestPanel.tsx:144 — LED {p0}: スキップ */
  LedTestPanelLEDSkipped = "Text0344",
  /** src/components/LedTestPanel/LedTestPanel.tsx:145 — LED {p0}: アンダーグロウ (x={p1}, y={p2}) */
  LedTestPanelLEDUnderglowXY = "Text0345",
  /** src/components/LedTestPanel/LedTestPanel.tsx:165 — LED診断 — 完了 */
  LedTestPanelLEDDiagnosticsComplete = "Text0346",
  /** src/components/LedTestPanel/LedTestPanel.tsx:167 — 記録が完了しました。「クリップボードにコピー」を押して、チャットにそのまま貼り付けてください。 */
  LedTestPanelRecordingCompleteClickCopyToClipboard = "Text0347",
  /** src/components/LedTestPanel/LedTestPanel.tsx:170 — コピーしました！ */
  LedTestPanelCopied = "Text0348",
  /** src/components/LedTestPanel/LedTestPanel.tsx:170 — クリップボードにコピー */
  LedTestPanelCopyToClipboard = "Text0349",
  /** src/components/LedTestPanel/LedTestPanel.tsx:181 — 未記録 */
  LedTestPanelNotRecorded = "Text0350",
  /** src/components/LedTestPanel/LedTestPanel.tsx:183 — スキップ */
  LedTestPanelSkip = "Text0351",
  /** src/components/LedTestPanel/LedTestPanel.tsx:185 — アンダーグロウ (x={p0}, y={p1}) */
  LedTestPanelUnderglowXY = "Text0352",
  /** src/components/LedTestPanel/LedTestPanel.tsx:214 — 「テスト開始」を押すと LED 0 がオレンジ色で点灯します。 キーLEDはレイアウト図のキーをクリック、アンダーグロウは「アンダーグロウ位置を指定」を押してからキーとキーの間など実際の位置をクリックしてください。 */
  LedTestPanelStartTestLightsLEDOrangeFor = "Text0353",
  /** src/components/LedTestPanel/LedTestPanel.tsx:218 — テスト開始 */
  LedTestPanelStartTest = "Text0354",
  /** src/components/LedTestPanel/LedTestPanel.tsx:225 — 記録済み */
  LedTestPanelRecorded = "Text0355",
  /** src/components/LedTestPanel/LedTestPanel.tsx:226 — ← 戻る */
  LedTestPanelBack = "Text0356",
  /** src/components/LedTestPanel/LedTestPanel.tsx:232 — ▶ 位置をクリック中… */
  LedTestPanelClickAPosition = "Text0357",
  /** src/components/LedTestPanel/LedTestPanel.tsx:232 — アンダーグロウ位置を指定 */
  LedTestPanelSetUnderglowPosition = "Text0358",
  /** src/components/LedTestPanel/LedTestPanel.tsx:235 — 終了 */
  LedTestPanelFinish = "Text0359",
  /** src/components/LedTestPanel/LedTestPanel.tsx:240 — 光っているアンダーグロウLEDの位置をキーとキーの間などクリックして指定してください */
  LedTestPanelClickThePhysicalPositionOfThe = "Text0360",
  /** src/components/LedTestPanel/LedTestPanel.tsx:244 — 点灯したキーをクリック、アンダーグロウの場合は上のボタンを押してください */
  LedTestPanelClickTheLitKeyOrUse = "Text0361",
  /** src/components/MacroEditor/ComboSection.tsx:24 — 同時押しするキー → 発動するキー */
  ComboSectionKeysPressedTogetherOutputKey = "Text0362",
  /** src/components/MacroEditor/ComboSection.tsx:44 — このファーム（機種・バージョン）はコンボの編集に非対応です。 */
  ComboSectionThisKeyboardOrFirmwareVersionDoes = "Text0363",
  /** src/components/MacroEditor/MacroEditor.tsx:42 — （キーなし） */
  MacroEditorNoKey = "Text0364",
  /** src/components/MacroEditor/MacroEditor.tsx:62 — 遅延を削除 */
  MacroEditorRemoveDelay = "Text0365",
  /** src/components/MacroEditor/MacroEditor.tsx:65 — 遅延を追加 */
  MacroEditorAddDelay = "Text0366",
  /** src/components/MacroEditor/MacroEditor.tsx:65 — ＋ 遅延 */
  MacroEditorDelay = "Text0367",
  /** src/components/MacroEditor/MacroEditor.tsx:70 — ドラッグで並べ替え */
  MacroEditorDragToReorder = "Text0368",
  /** src/components/MacroEditor/MacroEditor.tsx:78 — マクロキーを押している間ずっと押し続けます */
  MacroEditorHeldDownWhileTheMacroKey = "Text0369",
  /** src/components/MacroEditor/MacroEditor.tsx:78 — 押して離します */
  MacroEditorPressAndRelease = "Text0370",
  /** src/components/MacroEditor/MacroEditor.tsx:80 — 🔒 ホールド */
  MacroEditorHold = "Text0371",
  /** src/components/MacroEditor/MacroEditor.tsx:82 — 1つ上へ */
  MacroEditorMoveUp = "Text0372",
  /** src/components/MacroEditor/MacroEditor.tsx:83 — 1つ下へ */
  MacroEditorMoveDown = "Text0373",
  /** src/components/MacroEditor/MacroEditor.tsx:84 — 削除 */
  MacroEditorDelete = "Text0374",
  /** src/components/MacroEditor/MacroEditor.tsx:172 — 文 */
  MacroEditorText = "Text0375",
  /** src/components/MacroEditor/MacroEditor.tsx:173 — クリックして文を編集 */
  MacroEditorClickToEditText = "Text0376",
  /** src/components/MacroEditor/MacroEditor.tsx:173 — 実際に打つキー: {p0}（クリックして文を編集） */
  MacroEditorActualKeysClickToEditText = "Text0377",
  /** src/components/MacroEditor/MacroEditor.tsx:176 — 1キーずつのステップに分けて表示 */
  MacroEditorShowAsIndividualKeySteps = "Text0378",
  /** src/components/MacroEditor/MacroEditor.tsx:176 — 分ける */
  MacroEditorSplit = "Text0379",
  /** src/components/MacroEditor/MacroEditor.tsx:185 — 反映 */
  MacroEditorApply = "Text0380",
  /** src/components/MacroEditor/MacroEditor.tsx:187 — ローマ字で保存されている日本語を、かなに戻して表示します（英単語もかなになるので注意） */
  MacroEditorConvertSavedRomajiBackToKana = "Text0381",
  /** src/components/MacroEditor/MacroEditor.tsx:187 — ローマ字をかなに戻す */
  MacroEditorConvertRomajiToKana = "Text0382",
  /** src/components/MacroEditor/MacroEditor.tsx:188 — キャンセル */
  MacroEditorCancel = "Text0383",
  /** src/components/MacroEditor/MacroEditor.tsx:376 — マクロの保存に失敗しました: {p0} */
  MacroEditorCouldNotSaveMacro = "Text0384",
  /** src/components/MacroEditor/MacroEditor.tsx:391 — キーボードに接続するとマクロを編集できます。 */
  MacroEditorConnectTheKeyboardToEditMacros = "Text0385",
  /** src/components/MacroEditor/MacroEditor.tsx:396 — バッファ使用量 */
  MacroEditorBufferUsage = "Text0386",
  /** src/components/MacroEditor/MacroEditor.tsx:417 — {p0}ステップ:  */
  MacroEditorSteps = "Text0387",
  /** src/components/MacroEditor/MacroEditor.tsx:418 — （空） */
  MacroEditorEmpty = "Text0388",
  /** src/components/MacroEditor/MacroEditor.tsx:432 — ● 記録開始 */
  MacroEditorStartRecording = "Text0389",
  /** src/components/MacroEditor/MacroEditor.tsx:433 — ✎ 手動編集 */
  MacroEditorEditManually = "Text0390",
  /** src/components/MacroEditor/MacroEditor.tsx:434 — Aa 文を登録 */
  MacroEditorAaAddText = "Text0391",
  /** src/components/MacroEditor/MacroEditor.tsx:438 — ■ 記録停止 */
  MacroEditorStopRecording = "Text0392",
  /** src/components/MacroEditor/MacroEditor.tsx:442 — ＋ キー追加 */
  MacroEditorAddKey = "Text0393",
  /** src/components/MacroEditor/MacroEditor.tsx:443 — ＋ 文を追加 */
  MacroEditorAddText = "Text0394",
  /** src/components/MacroEditor/MacroEditor.tsx:445 — 続けて打つ文字を「文」としてまとめて表示します */
  MacroEditorGroupConsecutiveCharactersIntoText = "Text0395",
  /** src/components/MacroEditor/MacroEditor.tsx:445 — 文をまとめる */
  MacroEditorGroupText = "Text0396",
  /** src/components/MacroEditor/MacroEditor.tsx:447 — 遅延を全削除 */
  MacroEditorRemoveAllDelays = "Text0397",
  /** src/components/MacroEditor/MacroEditor.tsx:448 — 全クリア */
  MacroEditorClearAll = "Text0398",
  /** src/components/MacroEditor/MacroEditor.tsx:457 — 記録中… キーを押してください */
  MacroEditorRecordingPressKeys = "Text0399",
  /** src/components/MacroEditor/MacroEditor.tsx:459 — ステップ記録済み（上限 */
  MacroEditorStepsRecordedLimit = "Text0400",
  /** src/components/MacroEditor/MacroEditor.tsx:482 — 登録したい文を入力（例: Thank you! / よろしくおねがいします） */
  MacroEditorEnterTextEGThankYou = "Text0401",
  /** src/components/MacroEditor/MacroEditor.tsx:489 — 日本語はローマ字で送ります: */
  MacroEditorJapaneseIsSentAsRomaji = "Text0402",
  /** src/components/MacroEditor/MacroEditor.tsx:490 — 送る側のPCで日本語入力をONにしておくと、ひらがなで入力されます（漢字には変換されません）。 */
  MacroEditorEnableJapaneseInputOnTheReceiving = "Text0403",
  /** src/components/MacroEditor/MacroEditor.tsx:493 — 送れない文字があります（漢字など）: */
  MacroEditorSomeCharactersCannotBeSentE = "Text0404",
  /** src/components/MacroEditor/MacroEditor.tsx:495 — ステップ（約 */
  MacroEditorStepsAbout = "Text0405",
  /** src/components/MacroEditor/MacroEditor.tsx:495 — バイト）を追加します。 */
  MacroEditorBytesWillBeAdded = "Text0406",
  /** src/components/MacroEditor/MacroEditor.tsx:499 — ステップに追加 */
  MacroEditorAddToSteps = "Text0407",
  /** src/components/MacroEditor/MacroEditor.tsx:500 — 閉じる */
  MacroEditorClose = "Text0408",
  /** src/components/MacroEditor/MacroEditor.tsx:508 — キーがありません。「記録開始」または「＋ キー追加」で登録できます。 */
  MacroEditorNoKeysUseStartRecordingOr = "Text0409",
  /** src/components/MacroEditor/MacroEditor.tsx:550 — バッファ容量を超えています。ステップを減らすか、他のスロットのマクロを削除してください。 */
  MacroEditorBufferCapacityExceededReduceStepsOr = "Text0410",
  /** src/components/MacroEditor/MacroEditor.tsx:554 — 保存中... */
  MacroEditorSaving = "Text0411",
  /** src/components/MacroEditor/MacroEditor.tsx:554 — キーボードに保存 */
  MacroEditorSaveToKeyboard = "Text0412",
  /** src/components/MacroEditor/MacroTab.tsx:42 — ⚠ この版（LED版）ではマクロは使用できません（v1.1.0でメディアキーと引き換えに廃止されました）。 */
  MacroTabLEDFirmwareDoesNotSupportMacros = "Text0413",
  /** src/components/MacroEditor/MacroTab.tsx:43 — 通常版のファームを書き込むとマクロが使えます。「ファームウェア」タブから書き込めます。 */
  MacroTabFlashTheStandardFirmwareFromThe = "Text0414",
  /** src/components/MacroEditor/MacroTab.tsx:53 — コンボ */
  MacroTabCombos = "Text0415",
  /** src/components/MacroEditor/TapDanceSection.tsx:16 — ダブルタップ */
  TapDanceSectionDoubleTap = "Text0416",
  /** src/components/MacroEditor/TapDanceSection.tsx:16 — 長押し */
  TapDanceSectionLongPress = "Text0417",
  /** src/components/MatrixTestPanel/MatrixTestPanel.tsx:83 — ● テスト中（キーを押すと反応します） */
  MatrixTestPanelTestingPressKeysToSeeTheir = "Text0418",
  /** src/components/SettingsTab/SettingsTab.tsx:53 — キー動作オプション */
  SettingsTabKeyBehaviorOptions = "Text0419",
  /** src/components/SettingsTab/SettingsTab.tsx:56 — 長押し判定時間 */
  SettingsTabHoldDetectionTime = "Text0420",
  /** src/components/SettingsTab/SettingsTab.tsx:66 — Auto Shift */
  SettingsTabAutoShift = "Text0421",
  /** src/components/SettingsTab/SettingsTab.tsx:73 — Permissive Hold */
  SettingsTabPermissiveHold = "Text0422",
  /** src/components/SettingsTab/SettingsTab.tsx:84 — OS自動判別 */
  SettingsTabAutomaticOSDetection = "Text0423",
  /** src/components/SettingsTab/SettingsTab.tsx:89 — 現在の判定結果 */
  SettingsTabDetectedSystem = "Text0424",
  /** src/components/SettingsTab/SettingsTab.tsx:93 — 未接続 */
  SettingsTabDisconnected = "Text0425",
  /** src/components/SettingsTab/SettingsTab.tsx:94 — 不明 */
  Unknown = "Text0426",
  /** src/components/SettingsTab/SettingsTab.tsx:99 — OSに合わせて ⌘(Cmd) と Ctrl を自動で入れ替える */
  SettingsTabAutomaticallySwapCmdAndCtrlFor = "Text0427",
  /** src/components/SettingsTab/SettingsTab.tsx:110 — アニメーション */
  SettingsTabAnimations = "Text0428",
  /** src/components/SettingsTab/SettingsTab.tsx:115 — 起動アニメーション */
  SettingsTabStartupAnimation = "Text0429",
  /** src/components/SettingsTab/SettingsTab.tsx:126 — OLEDアニメーション */
  SettingsTabOLEDAnimation = "Text0430",
  /** src/components/SettingsTab/SettingsTab.tsx:139 — キー表示の配列設定 */
  SettingsTabDisplayedKeyLayout = "Text0431",
  /** src/components/SettingsTab/SettingsTab.tsx:143 — macOS キーボードタイプ設定 */
  SettingsTabMacOSKeyboardType = "Text0432",
  /** src/components/SettingsTab/SettingsTab.tsx:147 — LED位置実測（開発用） */
  SettingsTabMeasureLEDPositionsDevelopment = "Text0433",
  /** src/components/SettingsTab/SettingsTab.tsx:163 — 未実施 */
  SettingsTabNotStarted = "Text0434",
  /** src/components/SettingsTab/SettingsTab.tsx:174 — 次へ → */
  SettingsTabNext = "Text0435",
  /** src/components/SettingsTab/SettingsTab.tsx:193 — テストマトリクス */
  SettingsTabKeyMatrixTest = "Text0436",
  /** src/components/SettingsTab/SettingsTab.tsx:203 — キーボードに接続すると設定を変更できます。 */
  SettingsTabConnectTheKeyboardToChangeSettings = "Text0437",
  /** src/components/TapDanceSettings/TapDanceSettings.tsx:31 — ── レイヤー ── */
  TapDanceSettingsLayers = "Text0438",
  /** src/components/TapDanceSettings/TapDanceSettings.tsx:57 — タップダンス設定 */
  TapDanceSettingsTapDanceSettings = "Text0439",
  /** src/components/TapDanceSettings/TapDanceSettings.tsx:59 — 各スロットにタップ・ホールド・ダブルタップの動作を設定します。 */
  TapDanceSettingsSetTapHoldAndDoubleTap = "Text0440",
  /** src/components/TapDanceSettings/TapDanceSettings.tsx:60 — キーマップでキーに */
  TapDanceSettingsAssign = "Text0441",
  /** src/components/TapDanceSettings/TapDanceSettings.tsx:60 — を割り当てると、そのスロットの設定が使われます。 */
  TapDanceSettingsToAKeyOnTheKeymap = "Text0442",
  /** src/components/TapDanceSettings/TapDanceSettings.tsx:74 — / ホールド: */
  TapDanceSettingsHold = "Text0443",
  /** src/components/TapDanceSettings/TapDanceSettings.tsx:80 — 選択中のキーにこのスロットを割り当てる */
  TapDanceSettingsAssignThisSlotToTheSelected = "Text0444",
  /** src/components/TapDanceSettings/TapDanceSettings.tsx:82 — 選択キーに割り当て */
  TapDanceSettingsAssignToSelectedKey = "Text0445",
  /** src/components/TapDanceSettings/TapDanceSettings.tsx:89 — タップ（1回押し） */
  TapDanceSettingsTapOnePress = "Text0446",
  /** src/components/TapDanceSettings/TapDanceSettings.tsx:96 — ホールド（長押し） */
  TapDanceSettingsHoldLongPress = "Text0447",
  /** src/components/TapDanceSettings/TapDanceSettings.tsx:104 — ダブルタップ（2回押し） */
  TapDanceSettingsDoubleTapTwoPresses = "Text0448",
  /** src/components/TrackballSettings/TrackballSettings.tsx:51 — このファーム版（LED版）では加速度は使用できません */
  TrackballSettingsAccelerationIsUnavailableInThisLED = "Text0449",
  /** src/components/TrackballSettings/TrackballSettings.tsx:66 — この版では無効 */
  TrackballSettingsDisabledInThisVersion = "Text0450",
  /** src/components/TrackballSettings/TrackballSettings.tsx:87 — トラックボール */
  TrackballSettingsTrackball = "Text0451",
  /** src/components/TrackballSettingsTab/TrackballSettingsTab.tsx:97 — ボール動作・精密モード */
  TrackballSettingsTabBallBehaviorPrecisionMode = "Text0452",
  /** src/components/TrackballSettingsTab/TrackballSettingsTab.tsx:117 — スクロール設定 */
  TrackballSettingsTabScrollSettings = "Text0453",
  /** src/components/TrackballSettingsTab/TrackballSettingsTab.tsx:147 — オートマウスレイヤー */
  TrackballSettingsTabAutoMouseLayer = "Text0454",
  /** src/components/TrackballSettingsTab/TrackballSettingsTab.tsx:158 — シェイク・ダブルフリック */
  TrackballSettingsTabShakeDoubleFlick = "Text0455",
  /** src/components/TrackballSettingsTab/TrackballSettingsTab.tsx:163 — シェイク */
  TrackballSettingsTabShake = "Text0456",
  /** src/components/TrackballSettingsTab/TrackballSettingsTab.tsx:170 — ダブルフリック */
  TrackballSettingsTabDoubleFlick = "Text0457",
  /** src/components/TypingGame/TypingGame.tsx:20 — かんたん */
  TypingGameEasy = "Text0458",
  /** src/components/TypingGame/TypingGame.tsx:20 — 短い言葉・ゆっくり */
  TypingGameShortWordsSlowMovement = "Text0459",
  /** src/components/TypingGame/TypingGame.tsx:21 — ふつう */
  TypingGameNormal = "Text0460",
  /** src/components/TypingGame/TypingGame.tsx:21 — いろいろな長さ */
  TypingGameWordsOfDifferentLengths = "Text0461",
  /** src/components/TypingGame/TypingGame.tsx:22 — むずかしい */
  TypingGameHard = "Text0462",
  /** src/components/TypingGame/TypingGame.tsx:22 — 長い言葉・小さく速いカード */
  TypingGameLongWordsSmallFastCards = "Text0463",
  /** src/components/TypingGame/TypingGame.tsx:248 — +{p0}{p1} */
  TypingGame2 = "Text0464",
  /** src/components/TypingGame/TypingGame.tsx:248 —   {p0}コンボ */
  TypingGameCombo = "Text0465",
  /** src/components/TypingGame/TypingGame.tsx:263 — 時間切れ */
  TypingGameTimeUp = "Text0466",
  /** src/components/TypingGame/TypingGame.tsx:289 — 先に打ちたいカードをクリックしてください */
  TypingGameClickTheCardYouWantTo = "Text0467",
  /** src/components/TypingGame/TypingGame.tsx:292 — 「{p0}」は違います */
  TypingGameIsIncorrect = "Text0468",
  /** src/components/TypingGame/TypingGame.tsx:304 — 英単語は日本語入力をオフ（英数）にして打ちます */
  TypingGameTurnOffJapaneseInputToType = "Text0469",
  /** src/components/TypingGame/TypingGame.tsx:313 — 違う文字が入っています（BackSpaceで消して打ち直し） */
  TypingGameIncorrectCharactersUseBackspaceAndTry = "Text0470",
  /** src/components/TypingGame/TypingGame.tsx:322 — 違う言葉で確定されました。もう一度打ってください */
  TypingGameIncorrectWordCommittedPleaseTryAgain = "Text0471",
  /** src/components/TypingGame/TypingGame.tsx:333 — ライフ{p0} */
  TypingGameLives = "Text0472",
  /** src/components/TypingGame/TypingGame.tsx:336 — 点 */
  TypingGamePoints = "Text0473",
  /** src/components/TypingGame/TypingGame.tsx:338 — 残り */
  TypingGameRemaining = "Text0474",
  /** src/components/TypingGame/TypingGame.tsx:338 — 語 */
  TypingGameWords = "Text0475",
  /** src/components/TypingGame/TypingGame.tsx:341 — ベスト */
  TypingGameBest = "Text0476",
  /** src/components/TypingGame/TypingGame.tsx:349 — 入力 */
  TypingGameInput = "Text0477",
  /** src/components/TypingGame/TypingGame.tsx:358 — 動いているカードから好きなものをトラックボールで狙ってクリックし、その言葉を打ちます。 */
  TypingGameUseTheTrackballToAimAt = "Text0478",
  /** src/components/TypingGame/TypingGame.tsx:360 — カードの下のバーは残り時間です。時間切れで消えるとライフ（♥）が減り、0でゲームオーバー */
  TypingGameTheBarBelowEachCardShows = "Text0479",
  /** src/components/TypingGame/TypingGame.tsx:361 — 間違えずに続けて打つとコンボで点数アップ。金色のカードは点数3倍（小さくて速い） */
  TypingGameConsecutiveCorrectWordsEarnComboPoints = "Text0480",
  /** src/components/TypingGame/TypingGame.tsx:362 — 日本語は、日本語入力オン・オフどちらでも打てます（オフの時はローマ字で。し＝shi / si など、どの打ち方でもOK） */
  TypingGameJapaneseWorksWithTheIMEOn = "Text0481",
  /** src/components/TypingGame/TypingGame.tsx:363 — 英単語は日本語入力をオフ（英数）にして打ちます。途中でやめる時は Esc */
  TypingGameTurnOffJapaneseInputForEnglish = "Text0482",
  /** src/components/TypingGame/TypingGame.tsx:373 — スタート */
  TypingGameStart = "Text0483",
  /** src/components/TypingGame/TypingGame.tsx:435 — ゲームオーバー */
  TypingGameGameOver = "Text0484",
  /** src/components/TypingGame/TypingGame.tsx:435 — クリア！ おつかれさまでした */
  TypingGameCompleteWellDone = "Text0485",
  /** src/components/TypingGame/TypingGame.tsx:438 — 打てた言葉 */
  TypingGameWordsCompleted = "Text0486",
  /** src/components/TypingGame/TypingGame.tsx:439 — 最大コンボ */
  TypingGameBestCombo = "Text0487",
  /** src/components/TypingGame/TypingGame.tsx:440 — 狙う時間（1語あたり） */
  TypingGameAimingTimePerWord = "Text0488",
  /** src/components/TypingGame/TypingGame.tsx:440 — 秒 */
  TypingGameSeconds = "Text0489",
  /** src/components/TypingGame/TypingGame.tsx:441 — 打つ時間（1語あたり） */
  TypingGameTypingTimePerWord = "Text0490",
  /** src/components/TypingGame/TypingGame.tsx:442 — 打ち間違い */
  TypingGameTypingMistakes = "Text0491",
  /** src/components/TypingGame/TypingGame.tsx:443 — 正確さ */
  TypingGameAccuracy = "Text0492",
  /** src/components/TypingGame/TypingGame.tsx:445 — ベスト更新！ */
  TypingGameNewBest = "Text0493",
  /** src/components/TypingGame/TypingGame.tsx:447 — もう一度 */
  TypingGamePlayAgain = "Text0494",
  /** src/components/TypingGame/TypingGame.tsx:448 — 難易度を変える */
  TypingGameChangeDifficulty = "Text0495",
  /** src/components/TypingGame/TypingGame.tsx:456 — 打ちたいカードをクリック（残り時間の少ないカードから片付けよう） */
  TypingGameClickACardToTypeIt = "Text0496",
  /** src/components/TypingGame/TypingGame.tsx:456 — 打ってください（別のカードをクリックすると替えられます／Escでやめる） */
  TypingGameTypeNowClickAnotherCardTo = "Text0497",
  /** src/components/WelcomeGuide/WelcomeGuide.tsx:29 — ファームウェアを書き込む（初回のみ） */
  WelcomeGuideFlashFirmwareFirstTimeOnly = "Text0498",
  /** src/components/WelcomeGuide/WelcomeGuide.tsx:30 — Keyball Linkを使うには、専用のファームウェアが必要です。購入時のファームウェア（Remap用）のままでは接続できません。「ファームウェア」タブを開き、①で機種・チップ（AVR/RP2040）・内蔵ファームウェ */
  WelcomeGuideKeyballLinkRequiresItsOwnFirmware = "Text0499",
  /** src/components/WelcomeGuide/WelcomeGuide.tsx:37 — キーボードをUSBでつないでから、このボタンを押し、一覧から Keyball を選んで「接続」を押してください。 */
  WelcomeGuideConnectTheKeyboardViaUSBClick = "Text0500",
  /** src/components/WelcomeGuide/WelcomeGuide.tsx:41 — キーをクリック */
  WelcomeGuideClickAKey = "Text0501",
  /** src/components/WelcomeGuide/WelcomeGuide.tsx:42 — 変更したいキーをクリックしてください。右側のキー設定パネルに、割り当てられるキーの一覧が出ます。 */
  WelcomeGuideClickAKeyYouWantTo = "Text0502",
  /** src/components/WelcomeGuide/WelcomeGuide.tsx:47 — 新しいキーを選ぶ */
  WelcomeGuideChooseANewKey = "Text0503",
  /** src/components/WelcomeGuide/WelcomeGuide.tsx:48 — 右側の一覧から割り当てたいキーをクリックすると、選んだキーにすぐ設定されます。 */
  WelcomeGuideClickAnAssignmentInTheList = "Text0504",
  /** src/components/WelcomeGuide/WelcomeGuide.tsx:53 — 修飾キーとホールド */
  WelcomeGuideModifiersAndHoldActions = "Text0505",
  /** src/components/WelcomeGuide/WelcomeGuide.tsx:54 — 右側のキー設定パネルの「ホールド」タブでは、タップ＝通常キー／長押し＝Shift・Ctrl やレイヤー切替、という1キー2役の設定ができます。 */
  WelcomeGuideTheHoldTabInTheRight = "Text0506",
  /** src/components/WelcomeGuide/WelcomeGuide.tsx:60 — レイヤーはキー配列の切り替えページです。MO(1) などの切替キーを押している間だけ別の配列になります。ここで編集するレイヤーを選べます。「全レイヤー」で全部を並べて見比べたり、ドラッグで並べ替えたりもできます。 */
  WelcomeGuideLayersAreAlternativeKeymapsKeysSuch = "Text0507",
  /** src/components/WelcomeGuide/WelcomeGuide.tsx:66 — キー配列の下のLEDパネルで、LEDの光り方（エフェクト）・色・明るさ・速さを変えられます。レイヤーごとに光り方を変える「レイヤー連動LED」も設定できます。（LEDなしのファームウェアでは灰色で表示されます） */
  WelcomeGuideTheLEDPanelBelowTheKeymap = "Text0508",
  /** src/components/WelcomeGuide/WelcomeGuide.tsx:71 — 保存する */
  WelcomeGuideSaveChanges = "Text0509",
  /** src/components/WelcomeGuide/WelcomeGuide.tsx:72 — このボタンを押して、設定をキーボード本体に保存しましょう。保存しないと、電源を抜いた時に元に戻ります。 */
  WelcomeGuideClickThisButtonToSaveSettings = "Text0510",
  /** src/components/WelcomeGuide/WelcomeGuide.tsx:77 — 「トラックボール設定」タブでは、左の一覧から項目を選んで調整します。ボール動作（カーソルの速さ・精密モード）、スクロール、ジェスチャー、オートマウスレイヤー、シェイク・ダブルフリックが設定できます。 */
  WelcomeGuideInTrackballSettingsSelectAnItem = "Text0511",
  /** src/components/WelcomeGuide/WelcomeGuide.tsx:82 — その他の設定 */
  WelcomeGuideOtherSettings = "Text0512",
  /** src/components/WelcomeGuide/WelcomeGuide.tsx:83 — 「マクロ拡張」ではマクロ・タップダンス・コンボ、「詳細設定」ではキー動作（長押しの判定時間など）・OS自動判別・キー表示の配列（JIS/US）などを設定できます。項目にマウスを乗せると説明が出ます。以上で基本の使い方は終 */
  WelcomeGuideMacrosMoreContainsMacrosTapDance = "Text0513",
  /** src/components/WelcomeGuide/WelcomeGuide.tsx:88 — キーマップに戻る */
  WelcomeGuideReturnToKeymap = "Text0514",
  /** src/components/WelcomeGuide/WelcomeGuide.tsx:89 — 「キーマップ」タブをクリックして、続きの設定に進みましょう。 */
  WelcomeGuideClickTheKeymapTabToContinue = "Text0515",
  /** src/components/WelcomeGuide/WelcomeGuide.tsx:143 — 設定完了！お疲れ様でした */
  WelcomeGuideSetupComplete = "Text0516",
  /** src/components/WelcomeGuide/WelcomeGuide.tsx:193 — ステップ {p0} / {p1} */
  WelcomeGuideStep = "Text0517",
  /** src/components/WelcomeGuide/WelcomeGuide.tsx:193 — チュートリアル */
  WelcomeGuideTutorial = "Text0518",
  /** src/components/WelcomeGuide/WelcomeGuide.tsx:195 — ✕ 閉じる */
  WelcomeGuideClose = "Text0519",
  /** src/components/WelcomeGuide/WelcomeGuide.tsx:202 — 完了 */
  WelcomeGuideDone = "Text0520",
  /** src/components/WelcomeGuide/WelcomeGuide.tsx:202 — 次へ */
  WelcomeGuideNext = "Text0521",
  /** src/hooks/useLayerConflict.ts:37 — スクロールレイヤー */
  UseLayerConflictScrollLayer = "Text0522",
  /** src/hooks/useLayerConflict.ts:48 — 精密モードレイヤー */
  UseLayerConflictPrecisionModeLayer = "Text0523",
  /** src/hooks/useLayerConflict.ts:58 — {p0}と同じレイヤーのため保存できません。別のレイヤーを選んでください。 */
  UseLayerConflictCannotSaveThisLayerIsAlready = "Text0524",
  /** src/lib/avr109.ts:58 — read timeout after {p0}ms */
  Avr109ReadTimedOutAfterMs = "Text0525",
  /** src/lib/avr109.ts:67 — port not writable */
  Avr109PortIsNotWritable = "Text0526",
  /** src/lib/avr109.ts:103 — ブートローダーと同期できませんでした。   */
  Avr109CouldNotSynchronizeWithTheBootloader = "Text0527",
  /** src/lib/avr109.ts:104 — 【確認事項】  */
  Avr109CheckTheFollowingN = "Text0528",
  /** src/lib/avr109.ts:105 — ・ポート選択ダイアログで「ProMicro 5V」を選びましたか？  */
  Avr109DidYouSelectProMicroVIn = "Text0529",
  /** src/lib/avr109.ts:106 — ・ダイアログを開いてからリセットを2回押しましたか？   */
  Avr109DidYouPressResetTwiceAfter = "Text0530",
  /** src/lib/avr109.ts:107 — 繰り返し失敗する場合は QMK Toolbox をお試しください。  */
  Avr109IfItKeepsFailingTryQMK = "Text0531",
  /** src/lib/avr109.ts:121 — プログラムモード開始失敗 (0x{p0}) */
  Avr109CouldNotEnterProgrammingModeX = "Text0532",
  /** src/lib/avr109.ts:127 — チップ消去失敗 (0x{p0}) */
  Avr109ChipEraseFailedX = "Text0533",
  /** src/lib/avr109.ts:133 — アドレス設定失敗 */
  Avr109CouldNotSetAddress = "Text0534",
  /** src/lib/avr109.ts:141 — ブロック書き込み失敗 (0x{p0}) */
  Avr109BlockWriteFailedX = "Text0535",
  /** src/lib/avr109.ts:147 — プログラムモード終了失敗 */
  Avr109CouldNotLeaveProgrammingMode = "Text0536",
  /** src/lib/avr109.ts:157 — ブートローダー確認中… */
  Avr109CheckingBootloader = "Text0537",
  /** src/lib/avr109.ts:160 — プログラムモードへ… */
  Avr109EnteringProgrammingMode = "Text0538",
  /** src/lib/avr109.ts:174 — 書き込み中… {p0}% */
  Avr109Flashing = "Text0539",
  /** src/lib/flashCount.ts:14 — 書き込み回数の取得に失敗: {p0} */
  FlashCountCouldNotRetrieveFlashCounts = "Text0540",
  /** src/lib/flashCount.ts:26 — 書き込み回数の加算に失敗: {p0} */
  FlashCountCouldNotUpdateFlashCount = "Text0541",
  /** src/lib/hid.ts:44 — デバイスが選択されませんでした */
  HidNoDeviceSelected = "Text0542",
  /** src/lib/hid.ts:76 — タイムアウト */
  HidTimedOut = "Text0543",
  /** src/lib/hid.ts:118 — SET_KEYCODE 応答異常 (cmd=0x{p0}) — ファームウェアがコマンドを認識していない可能性があります */
  HidUnexpectedSETKEYCODEResponseCmdX = "Text0544",
  /** src/lib/hid.ts:122 — 書き込み検証失敗 — 書き込み値: 0x{p0}, 読み取り値: 0x{p1} (ファームウェアがSET_KEYCODEをサポートしていない可能性があります) */
  HidWriteVerificationFailedSentXRead = "Text0545",
  /** src/lib/hid.ts:160 — SAVE 応答異常 (cmd=0x{p0}) */
  HidUnexpectedSAVEResponseCmdX = "Text0546",
  /** src/lib/hid.ts:171 — LED非対応のファームです */
  HidFirmwareDoesNotSupportLEDs = "Text0547",
  /** src/lib/hid.ts:182 — レイヤー連動LED非対応のファームです */
  HidFirmwareDoesNotSupportLayerLEDs = "Text0548",
  /** src/lib/hid.ts:274 — ジェスチャー非対応のファームです */
  HidFirmwareDoesNotSupportGestures = "Text0549",
  /** src/lib/hid.ts:305 — 複数ジェスチャーモード非対応のファームです */
  HidFirmwareDoesNotSupportMultipleGesture = "Text0550",
  /** src/lib/hid.ts:352 — ジェスチャーウェーブ非対応のファームです */
  HidFirmwareDoesNotSupportGestureWaves = "Text0551",
  /** src/lib/hid.ts:373 — ジェスチャーウェーブのスタイル切り替えに非対応のファームです */
  HidFirmwareDoesNotSupportGestureWave = "Text0552",
  /** src/lib/hid.ts:383 — ジェスチャーウェーブの色設定に非対応のファームです */
  HidFirmwareDoesNotSupportGestureWave2 = "Text0553",
  /** src/lib/hid.ts:395 — OS自動判別非対応のファームです */
  HidFirmwareDoesNotSupportOSDetection = "Text0554",
  /** src/lib/hid.ts:402 — DPIカーブ非対応のファームです */
  HidFirmwareDoesNotSupportDPICurves = "Text0555",
  /** src/lib/hid.ts:415 — シェイク機能非対応のファームです */
  HidFirmwareDoesNotSupportShake = "Text0556",
  /** src/lib/hid.ts:442 — ダブルフリック非対応のファームです */
  HidFirmwareDoesNotSupportDoubleFlick = "Text0557",
  /** src/lib/hid.ts:475 — コンボ非対応のファームです */
  HidFirmwareDoesNotSupportCombos = "Text0558",
  /** src/lib/hid.ts:510 — 精密モード非対応のファームです */
  HidFirmwareDoesNotSupportPrecisionMode = "Text0559",
  /** src/lib/hid.ts:524 — 慣性スクロール非対応のファームです */
  HidFirmwareDoesNotSupportScrollInertia = "Text0560",
  /** src/lib/hid.ts:543 — バージョン情報非対応のファームです */
  HidFirmwareDoesNotSupportVersionInformation = "Text0561",
  /** src/lib/hid.ts:551 — ボールの左右の取得に非対応のファームです */
  HidFirmwareDoesNotReportTheBall = "Text0562",
  /** src/lib/hid.ts:562 — OLEDアニメーションの設定に非対応のファームです */
  HidFirmwareDoesNotSupportOLEDAnimation = "Text0563",
  /** src/lib/hid.ts:572 — 起動アニメーションの設定に非対応のファームです */
  HidFirmwareDoesNotSupportStartupAnimation = "Text0564",
  /** src/lib/hid.ts:613 — マクロ非対応のファームです */
  HidFirmwareDoesNotSupportMacros = "Text0565",
  /** src/lib/ihex.ts:37 — 有効なデータが見つかりません。Intel HEX形式のファームウェアファイルか確認してください。 */
  IhexNoValidDataFoundCheckThat = "Text0566",
  /** src/lib/keycodes.ts:102 — ろ */
  Keycodes = "Text0567",
  /** src/lib/keycodes.ts:103 — かな(JIS) */
  KeycodesKanaJIS = "Text0568",
  /** src/lib/keycodes.ts:105 — 変換 */
  KeycodesConvert = "Text0569",
  /** src/lib/keycodes.ts:106 — 無変換 */
  KeycodesNonConvert = "Text0570",
  /** src/lib/keycodes.ts:107 — かな (Mac) */
  KeycodesKanaMac = "Text0571",
  /** src/lib/keycodes.ts:107 — LANG1(かな)/Mac推奨 */
  KeycodesLANGKanaRecommendedOnMac = "Text0572",
  /** src/lib/keycodes.ts:108 — 英数 (Mac) */
  KeycodesAlphanumericMac = "Text0573",
  /** src/lib/keycodes.ts:108 — LANG2(英数)/Mac推奨 */
  KeycodesLANGAlphanumericRecommendedOnMac = "Text0574",
  /** src/lib/keycodes.ts:219 — 画面 明るさ+ */
  KeycodesScreenBrightness = "Text0575",
  /** src/lib/keycodes.ts:220 — 画面 明るさ- */
  KeycodesScreenBrightness2 = "Text0576",
  /** src/lib/keycodes.ts:261 — Scroll 縦 */
  KeycodesScrollVertical = "Text0577",
  /** src/lib/keycodes.ts:262 — Scroll 横 */
  KeycodesScrollHorizontal = "Text0578",
  /** src/lib/keycodes.ts:263 — Scroll 自由 */
  KeycodesScrollBothAxes = "Text0579",
  /** src/lib/keycodes.ts:264 — ジェスチャー1 */
  KeycodesGesture = "Text0580",
  /** src/lib/keycodes.ts:266 — AML解除 */
  KeycodesDisableAML = "Text0581",
  /** src/lib/keycodes.ts:267 — ジェスチャー2 */
  KeycodesGesture2 = "Text0582",
  /** src/lib/keycodes.ts:268 — ジェスチャー3 */
  KeycodesGesture3 = "Text0583",
  /** src/lib/keycodes.ts:269 — ジェスチャー4 */
  KeycodesGesture4 = "Text0584",
  /** src/lib/keycodes.ts:270 — ジェスチャー5 */
  KeycodesGesture5 = "Text0585",
  /** src/lib/keycodes.ts:271 — ジェスチャー6 */
  KeycodesGesture6 = "Text0586",
  /** src/lib/keycodes.ts:329 — 半角 */
  KeycodesHalfWidth = "Text0587",
  /** src/lib/keycodes.ts:471 — 何も割り当てられていません */
  KeycodesNoKeyAssigned = "Text0588",
  /** src/lib/keycodes.ts:472 — 透過：下のレイヤーのキーがそのまま使われます */
  KeycodesTransparentUsesTheKeyFromThe = "Text0589",
  /** src/lib/keycodes.ts:476 — スペースを入力します */
  KeycodesTypesASpace = "Text0590",
  /** src/lib/keycodes.ts:477 — 改行・確定します（Enter） */
  KeycodesInsertsALineBreakOrConfirms = "Text0591",
  /** src/lib/keycodes.ts:478 — カーソルの左の文字を1つ削除します（Backspace） */
  KeycodesDeletesTheCharacterToTheLeft = "Text0592",
  /** src/lib/keycodes.ts:479 — 操作をキャンセルします（Esc） */
  KeycodesCancelsTheCurrentActionEsc = "Text0593",
  /** src/lib/keycodes.ts:480 — タブを入力・次の入力欄に移動します（Tab） */
  KeycodesInsertsATabOrMovesTo = "Text0594",
  /** src/lib/keycodes.ts:481 — 大文字/小文字のロックを切り替えます（CapsLock） */
  KeycodesTogglesUppercaseLockCapsLock = "Text0595",
  /** src/lib/keycodes.ts:482 — カーソルの右の文字を1つ削除します（Delete） */
  KeycodesDeletesTheCharacterToTheRight = "Text0596",
  /** src/lib/keycodes.ts:483 — 上書き入力モードを切り替えます（Insert） */
  KeycodesTogglesOverwriteModeInsert = "Text0597",
  /** src/lib/keycodes.ts:484 — 行の先頭に移動します（Home） */
  KeycodesMovesToTheBeginningOfThe = "Text0598",
  /** src/lib/keycodes.ts:485 — 行の末尾に移動します（End） */
  KeycodesMovesToTheEndOfThe = "Text0599",
  /** src/lib/keycodes.ts:486 — 1画面分上にスクロールします（PageUp） */
  KeycodesScrollsUpOneScreenPageUp = "Text0600",
  /** src/lib/keycodes.ts:487 — 1画面分下にスクロールします（PageDown） */
  KeycodesScrollsDownOneScreenPageDown = "Text0601",
  /** src/lib/keycodes.ts:490 — カーソルを右に1文字移動します */
  KeycodesMovesTheCursorOneCharacterRight = "Text0602",
  /** src/lib/keycodes.ts:491 — カーソルを左に1文字移動します */
  KeycodesMovesTheCursorOneCharacterLeft = "Text0603",
  /** src/lib/keycodes.ts:492 — カーソルを下に1行移動します */
  KeycodesMovesTheCursorOneLineDown = "Text0604",
  /** src/lib/keycodes.ts:493 — カーソルを上に1行移動します */
  KeycodesMovesTheCursorOneLineUp = "Text0605",
  /** src/lib/keycodes.ts:496 — F1：ヘルプ表示など（アプリによって異なります） */
  KeycodesFHelpAndOtherAppSpecific = "Text0606",
  /** src/lib/keycodes.ts:497 — F2：ファイル名変更など（アプリによって異なります） */
  KeycodesFRenameAndOtherAppSpecific = "Text0607",
  /** src/lib/keycodes.ts:498 — F3：検索など（アプリによって異なります） */
  KeycodesFSearchAndOtherAppSpecific = "Text0608",
  /** src/lib/keycodes.ts:499 — F4：アドレスバーなど（アプリによって異なります） */
  KeycodesFAddressBarAndOtherApp = "Text0609",
  /** src/lib/keycodes.ts:500 — F5：ページ更新（ブラウザ）など（アプリによって異なります） */
  KeycodesFRefreshPageAndOtherApp = "Text0610",
  /** src/lib/keycodes.ts:501 — F{p0}：ファンクションキーです（アプリによって動作が異なります） */
  KeycodesFFunctionKeyBehaviorDependsOn = "Text0611",
  /** src/lib/keycodes.ts:504 — 押している間 Ctrl（コントロール）として動作します（例: Ctrl+C でコピー） */
  KeycodesActsAsCtrlWhileHeldE = "Text0612",
  /** src/lib/keycodes.ts:505 — 押している間 Shift として動作します（大文字入力・記号入力） */
  KeycodesActsAsShiftWhileHeldUppercase = "Text0613",
  /** src/lib/keycodes.ts:506 — 押している間 Alt（macOS: Option）として動作します */
  KeycodesActsAsAltWhileHeldOption = "Text0614",
  /** src/lib/keycodes.ts:507 — 押している間 ⌘ Command（Windows: Windowsキー）として動作します */
  KeycodesActsAsCommandWhileHeldWindows = "Text0615",
  /** src/lib/keycodes.ts:508 — 押している間 右Ctrl として動作します（左Ctrlと同じ効果） */
  KeycodesActsAsRightCtrlWhileHeld = "Text0616",
  /** src/lib/keycodes.ts:509 — 押している間 右Shift として動作します */
  KeycodesActsAsRightShiftWhileHeld = "Text0617",
  /** src/lib/keycodes.ts:510 — 押している間 右Alt（macOS: 右Option）として動作します */
  KeycodesActsAsRightAltWhileHeld = "Text0618",
  /** src/lib/keycodes.ts:511 — 押している間 右⌘ Command として動作します */
  KeycodesActsAsRightCommandWhileHeld = "Text0619",
  /** src/lib/keycodes.ts:514 — ハイフン(-)・長音符(ー)を入力します */
  KeycodesTypesAHyphenOrLongVowel = "Text0620",
  /** src/lib/keycodes.ts:514 — マイナス・ハイフン(-)を入力します */
  KeycodesTypesAMinusSignOrHyphen = "Text0621",
  /** src/lib/keycodes.ts:515 — キャレット(^)を入力します */
  KeycodesTypesACaret = "Text0622",
  /** src/lib/keycodes.ts:515 — イコール(=)を入力します */
  KeycodesTypesAnEqualsSign = "Text0623",
  /** src/lib/keycodes.ts:516 — アットマーク(@)を入力します */
  KeycodesTypesAnAtSign = "Text0624",
  /** src/lib/keycodes.ts:516 — 左角括弧([)を入力します */
  KeycodesTypesAnOpeningBracket = "Text0625",
  /** src/lib/keycodes.ts:517 — 右角括弧(])を入力します */
  KeycodesTypesAClosingBracket = "Text0626",
  /** src/lib/keycodes.ts:518 — バックスラッシュ(\)・円記号(¥)を入力します */
  KeycodesTypesABackslashOrYenSign = "Text0627",
  /** src/lib/keycodes.ts:519 — セミコロン(;)を入力します */
  KeycodesTypesASemicolon = "Text0628",
  /** src/lib/keycodes.ts:520 — コロン(:)を入力します */
  KeycodesTypesAColon = "Text0629",
  /** src/lib/keycodes.ts:520 — シングルクォート(')を入力します */
  KeycodesTypesASingleQuote = "Text0630",
  /** src/lib/keycodes.ts:521 — 半角/全角を切り替えます（日本語入力のオン/オフ） */
  KeycodesTogglesHalfFullWidthModeJapanese = "Text0631",
  /** src/lib/keycodes.ts:521 — バッククォート(`)を入力します */
  KeycodesTypesABacktick = "Text0632",
  /** src/lib/keycodes.ts:522 — カンマ(,)を入力します */
  KeycodesTypesAComma = "Text0633",
  /** src/lib/keycodes.ts:523 — ピリオド(.)を入力します */
  KeycodesTypesAPeriod = "Text0634",
  /** src/lib/keycodes.ts:524 — スラッシュ(/)を入力します */
  KeycodesTypesASlash = "Text0635",
  /** src/lib/keycodes.ts:527 — 感嘆符(!)を入力します */
  KeycodesTypesAnExclamationMark = "Text0636",
  /** src/lib/keycodes.ts:528 — ダブルクォート(")を入力します */
  KeycodesTypesADoubleQuote = "Text0637",
  /** src/lib/keycodes.ts:529 — ハッシュ・シャープ(#)を入力します */
  KeycodesTypesAHashSign = "Text0638",
  /** src/lib/keycodes.ts:530 — ドル記号($)を入力します */
  KeycodesTypesADollarSign = "Text0639",
  /** src/lib/keycodes.ts:531 — パーセント(%)を入力します */
  KeycodesTypesAPercentSign = "Text0640",
  /** src/lib/keycodes.ts:532 — アンパサンド(&)を入力します */
  KeycodesTypesAnAmpersand = "Text0641",
  /** src/lib/keycodes.ts:534 — 左丸括弧(()を入力します */
  KeycodesTypesAnOpeningParenthesis = "Text0642",
  /** src/lib/keycodes.ts:534 — アスタリスク(*)を入力します */
  KeycodesTypesAnAsterisk = "Text0643",
  /** src/lib/keycodes.ts:535 — 右丸括弧())を入力します */
  KeycodesTypesAClosingParenthesis = "Text0644",
  /** src/lib/keycodes.ts:537 — アンダースコア(_)を入力します（JIS: Shift+ろ） */
  KeycodesTypesAnUnderscoreJISShift = "Text0645",
  /** src/lib/keycodes.ts:538 — イコール(=)を入力します（JIS: Shift+-） */
  KeycodesTypesAnEqualsSignJISShift = "Text0646",
  /** src/lib/keycodes.ts:538 — アンダースコア(_)を入力します */
  KeycodesTypesAnUnderscore = "Text0647",
  /** src/lib/keycodes.ts:539 — チルダ(~)を入力します */
  KeycodesTypesATilde = "Text0648",
  /** src/lib/keycodes.ts:539 — プラス(+)を入力します */
  KeycodesTypesAPlusSign = "Text0649",
  /** src/lib/keycodes.ts:540 — 左波括弧({)を入力します */
  KeycodesTypesAnOpeningBrace = "Text0650",
  /** src/lib/keycodes.ts:541 — 右波括弧(})を入力します */
  KeycodesTypesAClosingBrace = "Text0651",
  /** src/lib/keycodes.ts:542 — パイプ(|)を入力します */
  KeycodesTypesAPipe = "Text0652",
  /** src/lib/keycodes.ts:545 — チルダ(~)はキャレット(^)のShiftです（JIS） */
  KeycodesTildeIsShiftCaretOnJIS = "Text0653",
  /** src/lib/keycodes.ts:546 — 左山括弧・小なり(<)を入力します */
  KeycodesTypesALessThanSign = "Text0654",
  /** src/lib/keycodes.ts:547 — 右山括弧・大なり(>)を入力します */
  KeycodesTypesAGreaterThanSign = "Text0655",
  /** src/lib/keycodes.ts:548 — 疑問符(?)を入力します */
  KeycodesTypesAQuestionMark = "Text0656",
  /** src/lib/keycodes.ts:551 — 左クリックします（MB1） */
  KeycodesLeftMouseClickMB = "Text0657",
  /** src/lib/keycodes.ts:552 — 右クリックします（MB2） */
  KeycodesRightMouseClickMB = "Text0658",
  /** src/lib/keycodes.ts:553 — 中クリック（ホイールボタン）します（MB3） */
  KeycodesMiddleMouseClickWheelButtonMB = "Text0659",
  /** src/lib/keycodes.ts:554 — ブラウザの「戻る」ボタンを押します（MB4） */
  KeycodesBrowserBackButtonMB = "Text0660",
  /** src/lib/keycodes.ts:555 — ブラウザの「進む」ボタンを押します（MB5） */
  KeycodesBrowserForwardButtonMB = "Text0661",
  /** src/lib/keycodes.ts:556 — マウスカーソルを上に移動します */
  KeycodesMovesTheMouseCursorUp = "Text0662",
  /** src/lib/keycodes.ts:557 — マウスカーソルを下に移動します */
  KeycodesMovesTheMouseCursorDown = "Text0663",
  /** src/lib/keycodes.ts:558 — マウスカーソルを左に移動します */
  KeycodesMovesTheMouseCursorLeft = "Text0664",
  /** src/lib/keycodes.ts:559 — マウスカーソルを右に移動します */
  KeycodesMovesTheMouseCursorRight = "Text0665",
  /** src/lib/keycodes.ts:560 — ホイールを上にスクロールします */
  KeycodesScrollsTheWheelUp = "Text0666",
  /** src/lib/keycodes.ts:561 — ホイールを下にスクロールします */
  KeycodesScrollsTheWheelDown = "Text0667",
  /** src/lib/keycodes.ts:562 — ホイールを左にスクロールします（横スクロール） */
  KeycodesScrollsTheWheelLeftHorizontalScroll = "Text0668",
  /** src/lib/keycodes.ts:563 — ホイールを右にスクロールします（横スクロール） */
  KeycodesScrollsTheWheelRightHorizontalScroll = "Text0669",
  /** src/lib/keycodes.ts:564 — マウス移動速度を低速（精密操作）にします（ACL0） */
  KeycodesSetsLowMouseSpeedForPrecision = "Text0670",
  /** src/lib/keycodes.ts:565 — マウス移動速度を中速にします（ACL1） */
  KeycodesSetsMediumMouseSpeedACL = "Text0671",
  /** src/lib/keycodes.ts:566 — マウス移動速度を高速にします（ACL2） */
  KeycodesSetsHighMouseSpeedACL = "Text0672",
  /** src/lib/keycodes.ts:569 — ろキーを入力します（JIS配列専用） */
  KeycodesSendsTheKeyJISOnly = "Text0673",
  /** src/lib/keycodes.ts:570 — かな入力モードに切り替えます（JIS配列専用） */
  KeycodesSwitchesToKanaInputJISOnly = "Text0674",
  /** src/lib/keycodes.ts:571 — 円記号(¥)を入力します（JIS配列専用） */
  KeycodesTypesAYenSignJISOnly = "Text0675",
  /** src/lib/keycodes.ts:572 — 変換キー：日本語入力を変換します（JIS配列専用） */
  KeycodesConvertKeyConvertsJapaneseInputJIS = "Text0676",
  /** src/lib/keycodes.ts:573 — 無変換キー：日本語入力をキャンセルします（JIS配列専用） */
  KeycodesNonConvertKeyCancelsJapaneseConversion = "Text0677",
  /** src/lib/keycodes.ts:574 — かな入力モードに切り替えます（macOS推奨: LANG1） */
  KeycodesSwitchesToKanaInputLANGRecommended = "Text0678",
  /** src/lib/keycodes.ts:575 — 英数入力モードに切り替えます（macOS推奨: LANG2） */
  KeycodesSwitchesToAlphanumericInputLANGRecommended = "Text0679",
  /** src/lib/keycodes.ts:578 — 音声をミュート/解除します（Mute） */
  KeycodesTogglesAudioMute = "Text0680",
  /** src/lib/keycodes.ts:579 — 音量を上げます（Volume Up） */
  KeycodesIncreasesVolume = "Text0681",
  /** src/lib/keycodes.ts:580 — 音量を下げます（Volume Down） */
  KeycodesDecreasesVolume = "Text0682",
  /** src/lib/keycodes.ts:581 — 次のトラックへ進みます（Next Track） */
  KeycodesNextTrack = "Text0683",
  /** src/lib/keycodes.ts:582 — 前のトラックへ戻ります（Previous Track） */
  KeycodesPreviousTrack = "Text0684",
  /** src/lib/keycodes.ts:583 — 再生を停止します（Stop） */
  KeycodesStopsPlayback = "Text0685",
  /** src/lib/keycodes.ts:584 — 再生・一時停止を切り替えます（Play/Pause） */
  KeycodesTogglesPlayPause = "Text0686",
  /** src/lib/keycodes.ts:585 — メディア選択ダイアログを開きます（Select） */
  KeycodesOpensMediaSelection = "Text0687",
  /** src/lib/keycodes.ts:586 — PC画面の明るさを上げます。OSやディスプレイがUSB HIDの明るさキーに対応している場合のみ有効です（ノートPC内蔵ディスプレイでは動作しやすいですが、外部モニタでは反応しないことがあります） */
  KeycodesIncreasesScreenBrightnessIfTheOS = "Text0688",
  /** src/lib/keycodes.ts:587 — PC画面の明るさを下げます（対応状況は明るさ+と同様） */
  KeycodesDecreasesScreenBrightnessSameSupportRequirements = "Text0689",
  /** src/lib/keycodes.ts:590 — スクリーンショット（画面キャプチャ）を撮ります（Print Screen） */
  KeycodesTakesAScreenshotPrintScreen = "Text0690",
  /** src/lib/keycodes.ts:591 — スクロールロックを切り替えます（Scroll Lock） */
  KeycodesTogglesScrollLock = "Text0691",
  /** src/lib/keycodes.ts:592 — 一時停止します（Pause） */
  KeycodesPauseKey = "Text0692",
  /** src/lib/keycodes.ts:593 — テンキーのロックを切り替えます（Num Lock） */
  KeycodesTogglesNumLock = "Text0693",
  /** src/lib/keycodes.ts:594 — コンテキストメニューを開きます（右クリックと同じ） */
  KeycodesOpensTheContextMenuSameAs = "Text0694",
  /** src/lib/keycodes.ts:597 — テンキーの ÷（割り算）を入力します */
  KeycodesTypesNumpadDivide = "Text0695",
  /** src/lib/keycodes.ts:598 — テンキーの ×（掛け算）を入力します */
  KeycodesTypesNumpadMultiply = "Text0696",
  /** src/lib/keycodes.ts:599 — テンキーの −（引き算）を入力します */
  KeycodesTypesNumpadMinus = "Text0697",
  /** src/lib/keycodes.ts:600 — テンキーの +（足し算）を入力します */
  KeycodesTypesNumpadPlus = "Text0698",
  /** src/lib/keycodes.ts:601 — テンキーの Enter を入力します */
  KeycodesSendsNumpadEnter = "Text0699",
  /** src/lib/keycodes.ts:602 — テンキーの {p0} を入力します */
  KeycodesTypesNumpad = "Text0700",
  /** src/lib/keycodes.ts:603 — テンキーの .(小数点) を入力します */
  KeycodesTypesNumpadDecimalPoint = "Text0701",
  /** src/lib/keycodes.ts:606 — LEDのオン/オフを切り替えます */
  KeycodesTogglesLEDsOnOff = "Text0702",
  /** src/lib/keycodes.ts:607 — LEDの光り方パターンを次に進めます */
  KeycodesSelectsTheNextLEDEffect = "Text0703",
  /** src/lib/keycodes.ts:608 — LEDの光り方パターンを前に戻します */
  KeycodesSelectsThePreviousLEDEffect = "Text0704",
  /** src/lib/keycodes.ts:609 — LEDの色相（色）を変えます（Hue+） */
  KeycodesIncreasesLEDHueHue = "Text0705",
  /** src/lib/keycodes.ts:610 — LEDの色相（色）を戻します（Hue-） */
  KeycodesDecreasesLEDHueHue = "Text0706",
  /** src/lib/keycodes.ts:611 — LEDの彩度（色の濃さ）を上げます */
  KeycodesIncreasesLEDSaturation = "Text0707",
  /** src/lib/keycodes.ts:612 — LEDの彩度（色の濃さ）を下げます */
  KeycodesDecreasesLEDSaturation = "Text0708",
  /** src/lib/keycodes.ts:613 — LEDの明るさを上げます */
  KeycodesIncreasesLEDBrightness = "Text0709",
  /** src/lib/keycodes.ts:614 — LEDの明るさを下げます */
  KeycodesDecreasesLEDBrightness = "Text0710",
  /** src/lib/keycodes.ts:615 — LEDアニメーションの速度を上げます */
  KeycodesSpeedsUpLEDAnimation = "Text0711",
  /** src/lib/keycodes.ts:616 — LEDアニメーションの速度を下げます */
  KeycodesSlowsDownLEDAnimation = "Text0712",
  /** src/lib/keycodes.ts:619 — Keyballの全設定をリセットします（要再起動） */
  KeycodesResetsAllKeyballSettingsRestartRequired = "Text0713",
  /** src/lib/keycodes.ts:620 — 現在の設定をEEPROMに保存します */
  KeycodesSavesCurrentSettingsToEEPROM = "Text0714",
  /** src/lib/keycodes.ts:621 — トラックボールの速度(CPI)を100上げます */
  KeycodesIncreasesTrackballSpeedByCPI = "Text0715",
  /** src/lib/keycodes.ts:622 — トラックボールの速度(CPI)を100下げます */
  KeycodesDecreasesTrackballSpeedByCPI = "Text0716",
  /** src/lib/keycodes.ts:623 — トラックボールの速度(CPI)を1000上げます */
  KeycodesIncreasesTrackballSpeedByCPI2 = "Text0717",
  /** src/lib/keycodes.ts:624 — トラックボールの速度(CPI)を1000下げます */
  KeycodesDecreasesTrackballSpeedByCPI2 = "Text0718",
  /** src/lib/keycodes.ts:625 — スクロールモードをON/OFFします（トラックボールがスクロール操作になります） */
  KeycodesTogglesScrollModeTheTrackballScrolls = "Text0719",
  /** src/lib/keycodes.ts:626 — 押している間だけスクロールモードになります */
  KeycodesEnablesScrollModeOnlyWhileHeld = "Text0720",
  /** src/lib/keycodes.ts:627 — スクロール速度を上げます（分周値を大きく） */
  KeycodesIncreasesScrollSpeedLargerDividerValue = "Text0721",
  /** src/lib/keycodes.ts:628 — スクロール速度を下げます（分周値を小さく） */
  KeycodesDecreasesScrollSpeedSmallerDividerValue = "Text0722",
  /** src/lib/keycodes.ts:629 — オートマウスレイヤー（トラックボールを触ると自動でレイヤー切替）のON/OFFを切り替えます */
  KeycodesTogglesTheAutoMouseLayerAutomatically = "Text0723",
  /** src/lib/keycodes.ts:630 — オートマウスレイヤーが切れるまでの時間を50ms延ばします */
  KeycodesExtendsTheAutoMouseTimeoutBy = "Text0724",
  /** src/lib/keycodes.ts:631 — オートマウスレイヤーが切れるまでの時間を50ms縮めます */
  KeycodesShortensTheAutoMouseTimeoutBy = "Text0725",
  /** src/lib/keycodes.ts:632 — スクロール方向を縦のみに固定します */
  KeycodesRestrictsScrollingToTheVerticalAxis = "Text0726",
  /** src/lib/keycodes.ts:633 — スクロール方向を横のみに固定します */
  KeycodesRestrictsScrollingToTheHorizontalAxis = "Text0727",
  /** src/lib/keycodes.ts:634 — スクロール方向の固定を解除します（自由に縦横スクロール） */
  KeycodesAllowsScrollingOnBothAxes = "Text0728",
  /** src/lib/keycodes.ts:635 — 押している間ジェスチャーモード1に切り替わり、トラックボールを上下左右に振るとそのモードの割当キーが発動します（設定タブで各モードの操作を変更できます） */
  KeycodesHoldToActivateGestureModeFlick = "Text0729",
  /** src/lib/keycodes.ts:636 — オートマウスレイヤー中に押すと、タイムアウトを待たず即座にレイヤーを解除します */
  KeycodesImmediatelyExitsTheAutoMouseLayer = "Text0730",
  /** src/lib/keycodes.ts:637 — 押している間ジェスチャーモード2に切り替わります（RP2040版限定） */
  KeycodesHoldToActivateGestureModeRP = "Text0731",
  /** src/lib/keycodes.ts:638 — 押している間ジェスチャーモード3に切り替わります（RP2040版限定） */
  KeycodesHoldToActivateGestureModeRP2 = "Text0732",
  /** src/lib/keycodes.ts:639 — 押している間ジェスチャーモード4に切り替わります（RP2040版限定） */
  KeycodesHoldToActivateGestureModeRP3 = "Text0733",
  /** src/lib/keycodes.ts:640 — 押している間ジェスチャーモード5に切り替わります（RP2040版限定） */
  KeycodesHoldToActivateGestureModeRP4 = "Text0734",
  /** src/lib/keycodes.ts:641 — 押している間ジェスチャーモード6に切り替わります（RP2040版限定） */
  KeycodesHoldToActivateGestureModeRP5 = "Text0735",
  /** src/lib/keycodes.ts:644 — 次の1キーだけ Ctrl として動作します（ワンショット） */
  KeycodesAppliesCtrlToTheNextKey = "Text0736",
  /** src/lib/keycodes.ts:645 — 次の1キーだけ Shift として動作します（ワンショット） */
  KeycodesAppliesShiftToTheNextKey = "Text0737",
  /** src/lib/keycodes.ts:646 — 次の1キーだけ Alt として動作します（ワンショット） */
  KeycodesAppliesAltToTheNextKey = "Text0738",
  /** src/lib/keycodes.ts:647 — 次の1キーだけ ⌘ Command として動作します（ワンショット） */
  KeycodesAppliesCommandToTheNextKey = "Text0739",
  /** src/lib/keycodes.ts:650 — ファームウェア書き込みモード（ブートローダー）に移行します。長押し推奨。 */
  KeycodesEntersFirmwareFlashingBootloaderModeLong = "Text0740",
  /** src/lib/keycodes.ts:653 — タップダンス {p0}：連打回数や長押しで動作が変わります（タップダンスタブで設定） */
  KeycodesTapDanceActionVariesWithTap = "Text0741",
  /** src/lib/keycodes.ts:656 — マクロ {p0} を実行します（マクロタブで内容を設定・確認できます） */
  KeycodesRunsMacroViewOrEditIt = "Text0742",
  /** src/lib/keycodes.ts:664 — {p0} を押しながら {p1} を入力します */
  KeycodesTypesWhileHolding = "Text0743",
  /** src/lib/keycodes.ts:671 — タップ：{p0} を入力 ／ 長押し：{p1} として動作します */
  KeycodesTapHold = "Text0744",
  /** src/lib/keycodes.ts:678 — タップ：{p0} を入力 ／ 長押し：レイヤー{p1} に切り替えます */
  KeycodesTapHoldActivateLayer = "Text0745",
  /** src/lib/keycodes.ts:681 — 押している間だけレイヤー{p0}に切り替えます（MO） */
  KeycodesActivatesLayerOnlyWhileHeldMO = "Text0746",
  /** src/lib/keycodes.ts:682 — レイヤー{p0}のみ有効にします（他のレイヤーを解除・TO） */
  KeycodesActivatesOnlyLayerDisablingOtherLayers = "Text0747",
  /** src/lib/keycodes.ts:683 — レイヤー{p0}のオン/オフを切り替えます（TG） */
  KeycodesTogglesLayerTG = "Text0748",
  /** src/lib/keycodes.ts:684 — 標準（ベース）レイヤーをレイヤー{p0}に変更します（DF） */
  KeycodesChangesTheBaseLayerToDF = "Text0749",
  /** src/lib/keycodes.ts:685 — 次の1キーだけレイヤー{p0}を使います（OSL） */
  KeycodesUsesLayerForTheNextKey = "Text0750",
  /** src/lib/keycodes.ts:686 — 次の1キーだけ効く修飾キーです（ワンショット） */
  KeycodesAppliesAModifierToTheNext = "Text0751",
  /** src/lib/keycodes.ts:687 — タップでレイヤー切替、{p0}回連打で固定します（TT） */
  KeycodesTapToSwitchLayersTapTimes = "Text0752",
  /** src/lib/presets.ts:354 — Keyball39 デフォルト */
  PresetsKeyballDefault = "Text0753",
  /** src/lib/presets.ts:355 — 公式チートシート準拠の4レイヤーキーマップ（JIS配列向け） */
  PresetsFourLayerJISKeymapBasedOn = "Text0754",
  /** src/lib/presets.ts:361 — Keyball39 Remap版 */
  PresetsKeyballRemap = "Text0755",
  /** src/lib/presets.ts:362 — Remap対応の標準ファームウェアの初期キーマップを再現したもの */
  PresetsRecreatesTheDefaultKeymapOfThe = "Text0756",
  /** src/lib/presets.ts:368 — Keyball44 Remap版 */
  PresetsKeyballRemap2 = "Text0757",
  /** src/lib/presets.ts:375 — Keyball61 Remap版 */
  PresetsKeyballRemap3 = "Text0758",
  /** src/lib/presets.ts:376 — Remap対応の標準ファームウェアの初期キーマップを再現したもの（EEPROM全消去キーは安全のため未搭載） */
  PresetsRecreatesTheStandardRemapKeymapOmitting = "Text0759",
  /** src/lib/protocol.ts:72 — 判別中… */
  ProtocolDetecting = "Text0760",
  /** src/lib/protocol.ts:249 — マクロの合計サイズ（{p0}バイト）がバッファ容量（{p1}バイト）を超えています。ステップを減らしてください。 */
  ProtocolMacrosTotalBytesExceedingTheByte = "Text0761",
  /** src/lib/protocol.ts:337 — ソリッド */
  ProtocolSolid = "Text0762",
  /** src/lib/protocol.ts:338 — ブリージング */
  ProtocolBreathing = "Text0763",
  /** src/lib/protocol.ts:339 — リアクティブ */
  ProtocolReactive = "Text0764",
  /** src/lib/protocol.ts:340 — リップル */
  ProtocolRipple = "Text0765",
  /** src/lib/protocol.ts:341 — タイピングヒートマップ */
  ProtocolTypingHeatmap = "Text0766",
  /** src/lib/protocol.ts:342 — トラックボールリアクティブ */
  ProtocolTrackballReactive = "Text0767",
  /** src/lib/protocol.ts:343 — グラデーション */
  ProtocolGradient = "Text0768",
  /** src/lib/protocol.ts:344 — レインボー */
  ProtocolRainbow = "Text0769",
  /** src/lib/protocol.ts:345 — スワール */
  ProtocolSwirl = "Text0770",
  /** src/lib/protocol.ts:346 — トゥインクル */
  ProtocolTwinkle = "Text0771",
  /** src/lib/protocol.ts:347 — クリスマス */
  ProtocolChristmas = "Text0772",
  /** src/lib/protocol.ts:348 — ハロウィン */
  ProtocolHalloween = "Text0773",
  /** src/lib/protocol.ts:349 — イースター */
  ProtocolEaster = "Text0774",
  /** src/lib/protocol.ts:462 — Shift (左) */
  ProtocolLeftShift = "Text0775",
  /** src/lib/protocol.ts:463 — Ctrl (左) */
  ProtocolLeftCtrl = "Text0776",
  /** src/lib/protocol.ts:464 — Alt (左) */
  ProtocolLeftAlt = "Text0777",
  /** src/lib/protocol.ts:465 — GUI (左) */
  ProtocolLeftGUI = "Text0778",
  /** src/lib/protocol.ts:466 — Shift (右) */
  ProtocolRightShift = "Text0779",
  /** src/lib/protocol.ts:467 — Ctrl (右) */
  ProtocolRightCtrl = "Text0780",
  /** src/lib/protocol.ts:468 — Alt (右) */
  ProtocolRightAlt = "Text0781",
  /** src/lib/protocol.ts:469 — GUI (右) */
  ProtocolRightGUI = "Text0782",
  /** src/lib/tips.ts:4 — カーソルの基本の速さです。大きいほど、ボールを少し動かしただけでカーソルが大きく動きます。 */
  TipsBaseCursorSpeedHigherValuesMove = "Text0783",
  /** src/lib/tips.ts:5 — ボールを速く動かした時ほど、カーソルを余分に速く動かす強さです。右のグラフで、動かす速さとカーソルの速さの関係を確認できます。オフにすると常に一定の速さです。 */
  TipsExtraCursorAccelerationWhenTheBall = "Text0784",
  /** src/lib/tips.ts:6 — 選んだレイヤーにいる間、または「精密モード」キーを押している間だけ、カーソルを遅くして細かい操作をしやすくします。 */
  TipsSlowsTheCursorForPreciseControl = "Text0785",
  /** src/lib/tips.ts:7 — 精密モード中にカーソルをどれだけ遅くするかです。「4分の1」なら普段の4分の1の速さになります。 */
  TipsHowMuchToSlowTheCursor = "Text0786",
  /** src/lib/tips.ts:9 — このレイヤーにいる間は、ボールを転がすとカーソルではなくスクロールになります。 */
  TipsOnThisLayerRollingTheBall = "Text0787",
  /** src/lib/tips.ts:10 — スクロールの速さです。数値が大きいほど、少し転がしただけで大きくスクロールします。 */
  TipsScrollSpeedHigherValuesScrollFarther = "Text0788",
  /** src/lib/tips.ts:11 — スクロールする向きです。「縦のみ」「横のみ」に絞ると、斜めに転がしても片方の向きだけスクロールします。 */
  TipsChooseVerticalHorizontalOrBothScroll = "Text0789",
  /** src/lib/tips.ts:12 — スクロールの向きを逆にします。縦・横それぞれ設定できます。 */
  TipsReverseScrollDirectionIndependentlyForVertical = "Text0790",
  /** src/lib/tips.ts:13 — ボールを弾いてスクロールした後、指を離してもしばらく減速しながらスクロールが続くようにします。 */
  TipsAfterFlickingToScrollScrollingContinues = "Text0791",
  /** src/lib/tips.ts:14 — 弾いた後にどれだけ長く滑り続けるかです。数値が大きいほど長く、遠くまで滑ります。0ですぐ止まります。 */
  TipsHowLongAndFarScrollingCoasts = "Text0792",
  /** src/lib/tips.ts:15 — どのくらいの速さで弾けば慣性スクロールが始まるかです。数値が大きいほど、ゆっくり弾いても発動します。小さいと、速く弾いた時だけ発動します。 */
  TipsSpeedNeededToTriggerInertiaHigher = "Text0793",
  /** src/lib/tips.ts:17 — ジェスチャーは6種類まで設定できます（古いファームウェアでは4種類）。キーマップに置いた「ジェスチャー1〜6」キーを押しながらボールを振ると、そのモードの割り当てが動きます。 */
  TipsConfigureUpToSixGestureModes = "Text0794",
  /** src/lib/tips.ts:18 — ジェスチャーキーを押しながら、ボールをこの向きに振った時に送るキーです。 */
  TipsKeySentWhenFlickingInThis = "Text0795",
  /** src/lib/tips.ts:19 — ONにすると、振り続けている間、回す速さに応じて同じキーを連続で送ります（音量調整やタブ送りなどに便利です）。 */
  TipsWhenEnabledRepeatsTheSameKey = "Text0796",
  /** src/lib/tips.ts:20 — このレイヤーにいる間は、ジェスチャーキーを押さなくてもボールを振るだけでこのモードのジェスチャーが動きます。 */
  TipsOnThisLayerFlickingActivatesThis = "Text0797",
  /** src/lib/tips.ts:21 — どのくらいボールを振ればジェスチャーとして判定するかです。数値が大きいほど、少し振っただけで反応します。4モード共通の設定です。 */
  TipsMovementNeededToRecognizeAGesture = "Text0798",
  /** src/lib/tips.ts:22 — ジェスチャーでキーを送った瞬間に、LEDが振った方向へ流れるように光ります。ON/OFFは4モード共通です。 */
  TipsLEDsFlowInTheGestureDirection = "Text0799",
  /** src/lib/tips.ts:23 — 光り方の種類です。シャープは一瞬だけ光り、ブリージングは柔らかく呼吸するように流れます。 */
  TipsLightingStyleSharpFlashesBrieflyBreathing = "Text0800",
  /** src/lib/tips.ts:24 — ウェーブの色です。虹色のバーをドラッグして選びます。 */
  TipsWaveColorDragTheRainbowBar = "Text0801",
  /** src/lib/tips.ts:25 — 色の鮮やかさです。0にすると白くなります。 */
  TipsColorIntensityZeroProducesWhite = "Text0802",
  /** src/lib/tips.ts:26 — 光の明るさです。0にすると光りません。 */
  TipsLightBrightnessZeroTurnsItOff = "Text0803",
  /** src/lib/tips.ts:27 — ウェーブが流れる速さです。数値が大きいほど速く流れます。 */
  TipsWaveMovementSpeedHigherValuesMove = "Text0804",
  /** src/lib/tips.ts:29 — ボールを動かすと、自動でこのレイヤーに切り替わります。マウスボタンなどを置いておくと便利です。「なし」で無効になります。 */
  TipsAutomaticallySwitchesToThisLayerWhen = "Text0805",
  /** src/lib/tips.ts:30 — ボールを止めてから、元のレイヤーに戻るまでの時間です。 */
  TipsTimeFromStoppingTheBallUntil = "Text0806",
  /** src/lib/tips.ts:31 — どのくらいボールを動かせばレイヤーが切り替わるかです。数値が大きいほど、少し触っただけで切り替わります。 */
  TipsMovementNeededToSwitchLayersHigher = "Text0807",
  /** src/lib/tips.ts:33 — ボールを左右や上下に素早く何度も振ると、設定したキーを送ります。ジェスチャーキーは不要で、いつでも反応します。 */
  TipsQuicklyShakeTheBallBackAnd = "Text0808",
  /** src/lib/tips.ts:34 — シェイクした時に送るキーです。 */
  TipsKeySentWhenAShakeIs = "Text0809",
  /** src/lib/tips.ts:35 — どのくらい強く振ればシェイクとして数えるかです。数値が大きいほど、弱く振っても反応します。 */
  TipsForceNeededToCountAShake = "Text0810",
  /** src/lib/tips.ts:36 — 何回往復させれば発動するかです。多いほど誤って発動しにくくなります。 */
  TipsBackAndForthMovementsRequiredTo = "Text0811",
  /** src/lib/tips.ts:37 — この時間内に必要な回数を振り切れば発動します。短いほど素早く振る必要があります。 */
  TipsCompleteTheRequiredShakesWithinThis = "Text0812",
  /** src/lib/tips.ts:39 — 同じ方向へボールを素早く2回弾くと、その方向に割り当てたキーを送ります。普段のカーソル操作中でも反応します。 */
  TipsFlickTwiceQuicklyInTheSame = "Text0813",
  /** src/lib/tips.ts:40 — その方向へ2回弾いた時に送るキーです。 */
  TipsKeySentForTwoFlicksIn = "Text0814",
  /** src/lib/tips.ts:41 — どのくらいの勢いで弾けば「フリック」と判定するかです。数値が大きいほど、軽く弾いても反応します。 */
  TipsForceNeededToRecognizeAFlick = "Text0815",
  /** src/lib/tips.ts:42 — 1回のフリックとして認める、ボールが動き続けている時間の上限です。長いほど、ゆっくり大きく弾いても認識されます。 */
  TipsMaximumMovementDurationForASingle = "Text0816",
  /** src/lib/tips.ts:43 — 1回目を弾いてから、この時間内に同じ方向へもう一度弾くとダブルフリックになります。長いほどゆっくりした2回でも反応しますが、普段の操作で誤って発動しやすくなります。 */
  TipsTimeAfterTheFirstFlickTo = "Text0817",
  /** src/lib/tips.ts:46 — 複数のキー入力を、1つのキーでまとめて実行します。スロットを選んで「記録開始」で実際にキーを押すか、「文を登録」で文を入力して作ります。保存後、キーマップで「Macro 0〜9」を割り当てると使えます。保存領域は全スロッ */
  TipsRunsSeveralKeystrokesFromOneKey = "Text0818",
  /** src/lib/tips.ts:47 — 全スロットで共有している保存領域の使用量です。キー1つで約3バイト、遅延を付けるとさらに3バイト使います。 */
  TipsStorageUsedByAllSlotsEach = "Text0819",
  /** src/lib/tips.ts:48 — キーマップに「TD(0)〜TD(7)」を置くと、同じキーを1回叩く・2回叩く・長押しで、それぞれ別のキーを送れます。 */
  TipsAssignTDTDToAKey = "Text0820",
  /** src/lib/tips.ts:49 — 1回叩いた時に送るキーです。 */
  TipsKeySentOnASingleTap = "Text0821",
  /** src/lib/tips.ts:50 — 素早く2回叩いた時に送るキーです。未設定なら1回目と同じキーを2回送ります。 */
  TipsKeySentOnAQuickDouble = "Text0822",
  /** src/lib/tips.ts:51 — 長押しした時に送るキーです。 */
  TipsKeySentOnALongPress = "Text0823",
  /** src/lib/tips.ts:52 — 決めた2〜4個のキーを同時に押すと、別のキーを送ります。普段は単独のキーとして動きます。 */
  TipsPressTwoToFourSpecifiedKeys = "Text0824",
  /** src/lib/tips.ts:53 — 同時に押すキー（2〜4個）と、→の右に発動するキーを設定します。左から詰めて設定してください。 */
  TipsChooseTwoToFourSimultaneousKeys = "Text0825",
  /** src/lib/tips.ts:56 — タップと長押しを使い分けるキー（Mod-Tap・レイヤー切替など）の判定に関わる設定です。 */
  TipsSettingsForKeysWithDifferentTap = "Text0826",
  /** src/lib/tips.ts:57 — これより長く押すと「長押し」と判定する時間です。短いほど素早く長押しに切り替わり、長いほどゆっくり押してもタップ扱いになります。 */
  TipsAPressLongerThanThisIs = "Text0827",
  /** src/lib/tips.ts:58 — キーを長押しすると、Shiftを押したときの文字を入力します（例: aを長押し→A）。 */
  TipsHoldingAKeyTypesItsShifted = "Text0828",
  /** src/lib/tips.ts:59 — Mod-Tapのキーを押している間に別のキーを押して離すと、すぐに長押し（修飾キー）と判定します。ショートカットを素早く打つ時に便利です。 */
  TipsWhileHoldingAModTapKey = "Text0829",
  /** src/lib/tips.ts:60 — 接続先のOSを自動で判別して、キーの動きを合わせます。 */
  TipsDetectsTheConnectedOSAndAdjusts = "Text0830",
  /** src/lib/tips.ts:61 — 起動時の演出と、USBを挿していない側のOLEDの表示です。 */
  TipsStartupEffectsAndTheOLEDDisplay = "Text0831",
  /** src/lib/tips.ts:62 — 電源を入れた時の演出（LEDが中央から広がり、OLEDにロゴが集まる）です。OFFにすると次の起動から演出なしで始まります。 */
  TipsStartupEffectLEDsSpreadFromThe = "Text0832",
  /** src/lib/tips.ts:63 — OFFにすると、LEDエフェクトに合わせたアニメーションを止めて、動かないKeyballロゴを表示します。 */
  TipsTurningThisOffStopsTheAnimation = "Text0833",
  /** src/lib/tips.ts:64 — 今接続しているPCを、どのOSと判別したかです。 */
  TipsOSCurrentlyDetectedOnTheConnected = "Text0834",
  /** src/lib/tips.ts:65 — macOS/iOSに接続した時は⌘(Cmd)とCtrlを入れ替え、Windows/Linuxではそのまま使います。同じキーマップでどのOSでもショートカットを同じ指で押せます。 */
  TipsSwapsCmdAndCtrlOnMacOS = "Text0835",
  /** src/lib/tips.ts:66 — キーマップ画面のキーに表示する文字をJIS配列/US配列で切り替えます。表示だけで、実際に入力される文字は変わりません（入力文字を変えるには「macOS キーボードタイプ設定」を使います）。 */
  TipsSwitchesDisplayedKeyCharactersBetweenJIS = "Text0836",
  /** src/lib/tips.ts:67 — macOSはKeyballの配列（JIS/US）を自動で判定できないことがあります。ここのコマンドを一度実行すると、@などの記号が正しく入力されるようになります。 */
  TipsMacOSMayNotDetectKeyballS = "Text0837",
  /** src/lib/tips.ts:68 — LEDを1個ずつ点灯させて、配線の順番を確認する開発用の機能です。「終了」で通常の表示に戻ります。 */
  TipsDeveloperToolThatLightsLEDsIndividually = "Text0838",
  /** src/lib/tips.ts:69 — 「テスト開始」を押してからキーを押すと、押しているキーが緑色になります。一度でも押したキーは薄い緑で残るので、反応しないキーを探せます。 */
  TipsStartTheTestThenPressKeys = "Text0839",
  /** src/lib/tips.ts:72 — Keyball Linkのファームウェアをキーボードに書き込みます。機種と版を選んで「書き込む」を押してください。 */
  TipsWritesKeyballLinkFirmwareToThe = "Text0840",
  /** src/lib/tips.ts:73 — Keyballは左右の基板それぞれにマイコンがあるため、両方への書き込みが必要です。 */
  TipsEachKeyballHalfHasAMicrocontroller = "Text0841",
  /** src/lib/tips.ts:74 — 公式ファームウェアなどから初めてKeyball Linkに乗り換える時の注意です。 */
  TipsPrecautionsWhenSwitchingFromOfficialOr = "Text0842",
  /** src/lib/tips.ts:75 — Keyball Linkから正規ファームウェアなど別のファームウェアに戻す時の注意です。 */
  TipsPrecautionsWhenSwitchingFromKeyballLink = "Text0843",
  /** src/lib/tips.ts:76 — ブラウザからの書き込みがうまくいかない時の方法です。 */
  TipsWhatToDoWhenBrowserFlashing = "Text0844",
  /** src/lib/tips.ts:77 — アプリが動かない・設定が保存できない・表示がおかしい時は、こちらから報告してください。 */
  TipsReportAppErrorsSettingsThatDo = "Text0845",
  /** src/lib/tips.ts:78 — 「こんな機能が欲しい」というアイデアの投稿や、他の人の投稿への応援（投票）ができます。 */
  TipsPostFeatureIdeasAndVoteFor = "Text0846",
  /** src/lib/uf2flash.ts:25 — 「RPI-RP2」という名前のドライブが見つかりません。   */
  Uf2flashCouldNotFindADriveNamed = "Text0847",
  /** src/lib/uf2flash.ts:26 — ・フォルダ選択ダイアログで「RPI-RP2」を選びましたか？  */
  Uf2flashDidYouSelectRPIRPIn = "Text0848",
  /** src/lib/uf2flash.ts:27 — ・すでにKeyball Linkのファームウェアが入っている場合は、リセットボタンを */
  Uf2flashIfKeyballLinkFirmwareIsAlready = "Text0849",
  /** src/lib/uf2flash.ts:28 — 素早く2回押すとブートローダーモードになります。  */
  Uf2flashQuicklyPressResetTwiceToEnter = "Text0850",
  /** src/lib/uf2flash.ts:29 — ・初めて書き込む場合は、BOOTSELボタンを押しながらUSBケーブルを挿し直してください。 */
  Uf2flashForAFirstFlashHoldBOOTSEL = "Text0851",
  /** src/lib/uf2flash.ts:43 — ドライブを確認中… */
  Uf2flashCheckingDrive = "Text0852",
  /** src/lib/uf2flash.ts:46 — 書き込み準備中… */
  Uf2flashPreparingToFlash = "Text0853",
  /** src/lib/uf2flash.ts:62 — 書き込み完了処理中… */
  Uf2flashFinishingFlash = "Text0854",
  /** src/lib/uf2flash.ts:79 — 書き込み完了 */
  Uf2flashFlashComplete = "Text0855",
  /** new:0 — 言語 */
  Language = "Language",
  /** new:0 — 言語を選択 */
  ChooseLanguage = "ChooseLanguage",
  /** new:0 — ローカル環境では書き込み回数を利用できません */
  CountUnavailable = "CountUnavailable",
  AccentMint = "AccentMint",
  AccentAmber = "AccentAmber",
  AccentViolet = "AccentViolet",
  PrecisionRatio = "PrecisionRatio",
}
