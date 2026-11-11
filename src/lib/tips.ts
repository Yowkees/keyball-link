import { translate } from '../i18n';
import { TextKey } from '../i18n/text.enum';
// トラックボール設定の各項目にマウスを乗せた時に出す詳細説明（2026-10-06、本人希望）。
// 画面上の説明文は削った代わりに、ここでホバー表示する（index.cssの[data-tip]）。
export const TIPS = {
  get cpi() { return translate(TextKey.TipsBaseCursorSpeedHigherValuesMove); },
  get accel() { return translate(TextKey.TipsExtraCursorAccelerationWhenTheBall); },
  get precision() { return translate(TextKey.TipsSlowsTheCursorForPreciseControl); },
  get precisionDiv() { return translate(TextKey.TipsHowMuchToSlowTheCursor); },

  get scrollLayer() { return translate(TextKey.TipsOnThisLayerRollingTheBall); },
  get scrollSpeed() { return translate(TextKey.TipsScrollSpeedHigherValuesScrollFarther); },
  get scrollMode() { return translate(TextKey.TipsChooseVerticalHorizontalOrBothScroll); },
  get scrollInvert() { return translate(TextKey.TipsReverseScrollDirectionIndependentlyForVertical); },
  get inertia() { return translate(TextKey.TipsAfterFlickingToScrollScrollingContinues); },
  get inertiaLevel() { return translate(TextKey.TipsHowLongAndFarScrollingCoasts); },
  get inertiaFlick() { return translate(TextKey.TipsSpeedNeededToTriggerInertiaHigher); },

  get gestureMode() { return translate(TextKey.TipsConfigureUpToSixGestureModes); },
  get gestureKeys() { return translate(TextKey.TipsKeySentWhenFlickingInThis); },
  get gestureContinuous() { return translate(TextKey.TipsWhenEnabledRepeatsTheSameKey); },
  get gestureLayer() { return translate(TextKey.TipsOnThisLayerFlickingActivatesThis); },
  get gestureSens() { return translate(TextKey.TipsMovementNeededToRecognizeAGesture); },
  get gestureWave() { return translate(TextKey.TipsLEDsFlowInTheGestureDirection); },
  get gestureWaveStyle() { return translate(TextKey.TipsLightingStyleSharpFlashesBrieflyBreathing); },
  get gestureHue() { return translate(TextKey.TipsWaveColorDragTheRainbowBar); },
  get gestureSat() { return translate(TextKey.TipsColorIntensityZeroProducesWhite); },
  get gestureVal() { return translate(TextKey.TipsLightBrightnessZeroTurnsItOff); },
  get gestureSpeed() { return translate(TextKey.TipsWaveMovementSpeedHigherValuesMove); },

  get amlLayer() { return translate(TextKey.TipsAutomaticallySwitchesToThisLayerWhen); },
  get amlTimeout() { return translate(TextKey.TipsTimeFromStoppingTheBallUntil); },
  get amlSens() { return translate(TextKey.TipsMovementNeededToSwitchLayersHigher); },

  get shake() { return translate(TextKey.TipsQuicklyShakeTheBallBackAnd); },
  get shakeKey() { return translate(TextKey.TipsKeySentWhenAShakeIs); },
  get shakeSens() { return translate(TextKey.TipsForceNeededToCountAShake); },
  get shakeCount() { return translate(TextKey.TipsBackAndForthMovementsRequiredTo); },
  get shakeTime() { return translate(TextKey.TipsCompleteTheRequiredShakesWithinThis); },

  get dflick() { return translate(TextKey.TipsFlickTwiceQuicklyInTheSame); },
  get dflickKeys() { return translate(TextKey.TipsKeySentForTwoFlicksIn); },
  get dflickSens() { return translate(TextKey.TipsForceNeededToRecognizeAFlick); },
  get dflickDuration() { return translate(TextKey.TipsMaximumMovementDurationForASingle); },
  get dflickWindow() { return translate(TextKey.TipsTimeAfterTheFirstFlickTo); },

  // ── マクロ拡張 ──
  get macro() { return translate(TextKey.TipsRunsSeveralKeystrokesFromOneKey); },
  get macroBuffer() { return translate(TextKey.TipsStorageUsedByAllSlotsEach); },
  get tapdance() { return translate(TextKey.TipsAssignTDTDToAKey); },
  get tdTap() { return translate(TextKey.TipsKeySentOnASingleTap); },
  get tdDtap() { return translate(TextKey.TipsKeySentOnAQuickDouble); },
  get tdHold() { return translate(TextKey.TipsKeySentOnALongPress); },
  get combo() { return translate(TextKey.TipsPressTwoToFourSpecifiedKeys); },
  get comboKeys() { return translate(TextKey.TipsChooseTwoToFourSimultaneousKeys); },

  // ── 詳細設定 ──
  get keyopt() { return translate(TextKey.TipsSettingsForKeysWithDifferentTap); },
  get tappingTerm() { return translate(TextKey.TipsAPressLongerThanThisIs); },
  get autoShift() { return translate(TextKey.TipsHoldingAKeyTypesItsShifted); },
  get permissiveHold() { return translate(TextKey.TipsWhileHoldingAModTapKey); },
  get osdetect() { return translate(TextKey.TipsDetectsTheConnectedOSAndAdjusts); },
  get oled() { return translate(TextKey.TipsStartupEffectsAndTheOLEDDisplay); },
  get bootAnim() { return translate(TextKey.TipsStartupEffectLEDsSpreadFromThe); },
  get oledAnim() { return translate(TextKey.TipsTurningThisOffStopsTheAnimation); },
  get osResult() { return translate(TextKey.TipsOSCurrentlyDetectedOnTheConnected); },
  get osSwap() { return translate(TextKey.TipsSwapsCmdAndCtrlOnMacOS); },
  get keydisplay() { return translate(TextKey.TipsSwitchesDisplayedKeyCharactersBetweenJIS); },
  get macos() { return translate(TextKey.TipsMacOSMayNotDetectKeyballS); },
  get ledtest() { return translate(TextKey.TipsDeveloperToolThatLightsLEDsIndividually); },
  get matrix() { return translate(TextKey.TipsStartTheTestThenPressKeys); },

  // ── ファームウェア・ご意見 ──
  get fwFlash() { return translate(TextKey.TipsWritesKeyballLinkFirmwareToThe); },
  get fwBothHalves() { return translate(TextKey.TipsEachKeyballHalfHasAMicrocontroller); },
  get fwSwitch() { return translate(TextKey.TipsPrecautionsWhenSwitchingFromOfficialOr); },
  get fwRevert() { return translate(TextKey.TipsPrecautionsWhenSwitchingFromKeyballLink); },
  get fwTrouble() { return translate(TextKey.TipsWhatToDoWhenBrowserFlashing); },
  get fbBug() { return translate(TextKey.TipsReportAppErrorsSettingsThatDo); },
  get fbIdea() { return translate(TextKey.TipsPostFeatureIdeasAndVoteFor); },
} as const;
