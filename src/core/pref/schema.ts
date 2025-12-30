import { type HotKey, getDefaultHotkeyMap } from '@core/hotkey'

import { isAppleDevice } from '@utils/detectAppleDevice'

export interface PreferenceSchema {
  // Data
  maxRedoSteps: number
  autoSaveEnabled: boolean
  autoSaveIntervalMinutes: number
  packAudioToProject: boolean
  // Shortcuts
  macStyleShortcuts: boolean
  hotkeyMap: HotKey.Map
  // Timing
  globalLatency: number
  alwaysIgnoreBackground: boolean
  hideLineTiming: boolean
  // Roman
  sylRomanEnabled: boolean
  swapTranslateRoman: boolean
  // Misc
  sidebarWidth: number
  scrollWithPlayback: boolean
}

export const getDefaultPref = (): PreferenceSchema => ({
  maxRedoSteps: 100,
  autoSaveEnabled: true,
  autoSaveIntervalMinutes: 5,
  packAudioToProject: true,
  macStyleShortcuts: isAppleDevice(),
  hotkeyMap: getDefaultHotkeyMap(),
  globalLatency: 0,
  alwaysIgnoreBackground: false,
  hideLineTiming: false,
  sylRomanEnabled: false,
  swapTranslateRoman: false,
  sidebarWidth: 360,
  scrollWithPlayback: false,
})
