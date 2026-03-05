import { type HotKey, getDefaultHotkeyMap } from '@core/hotkey'
import type { SpectrogramColor } from '@core/spectrogram/colors'

import { isAppleDevice } from '@utils/detectAppleDevice'

export interface PreferenceSchema {
  // Data
  maxUndoSteps: number
  autoSaveEnabled: boolean
  autoSaveIntervalMinutes: number
  packAudioToProject: boolean
  ttmlAsDefault: boolean
  askPermissionOnOpen: boolean
  // Shortcuts
  macStyleShortcuts: boolean
  hotkeyMap: HotKey.Map
  audioSeekingStepMs: number
  // Timing
  globalLatencyMs: number
  alwaysIgnoreBackground: boolean
  hideLineTiming: boolean
  highlightSelectedLineOnProgress: boolean
  // Roman
  sylRomanEnabled: boolean
  swapTranslateRoman: boolean
  hideTranslateRoman: boolean
  // Spectrogram
  spectrogramColor: SpectrogramColor
  // Misc
  notifyCompatIssuesOnStartup: boolean
  sidebarWidth: number
  spectrogramHeight: number
  scrollWithPlayback: boolean
}

export const getDefaultPref = (): PreferenceSchema => ({
  maxUndoSteps: 100,
  autoSaveEnabled: true,
  autoSaveIntervalMinutes: 3,
  packAudioToProject: true,
  ttmlAsDefault: false,
  askPermissionOnOpen: true,
  macStyleShortcuts: isAppleDevice(),
  hotkeyMap: getDefaultHotkeyMap(),
  audioSeekingStepMs: 5000,
  globalLatencyMs: 0,
  alwaysIgnoreBackground: false,
  hideLineTiming: true,
  highlightSelectedLineOnProgress: true,
  sylRomanEnabled: false,
  swapTranslateRoman: false,
  hideTranslateRoman: false,
  spectrogramColor: 'icyBlue',
  notifyCompatIssuesOnStartup: true,
  sidebarWidth: 360,
  spectrogramHeight: 240,
  scrollWithPlayback: false,
})
