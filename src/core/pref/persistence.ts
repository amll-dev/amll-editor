import stableStringify from 'json-stable-stringify'
import { omit } from 'lodash-es'

import { getDefaultHotkeyMap, isHotkeyMatch } from '@core/hotkey'
import { reservedHotkeyCommands } from '@core/hotkey/schema'
import type { HotKey } from '@core/hotkey/types'

import { type PreferenceSchema, getDefaultPref } from './schema'

const STORAGE_KEY = 'amll_editor:preference'
const PREF_VERSION = 2

const LEGACY_DELAY_TEST_TAP: HotKey.Key = {
  code: 'Space',
  ctrl: false,
  alt: false,
  shift: false,
}

interface PersistedPref {
  appVersion: string
  prefVersion: number
  data: Partial<PreferenceSchema>
}

export function loadPreference(): PreferenceSchema {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return getDefaultPref()
    const parsed = JSON.parse(raw) as PersistedPref
    if (parsed.prefVersion > PREF_VERSION)
      console.warn(
        `Found preference version ${parsed.prefVersion}, newer than current version ${PREF_VERSION}.`,
      )
    if (parsed.data.hotkeyMap) {
      const defaultHotkeyMap = getDefaultHotkeyMap()
      const hotkeyMap = {
        ...defaultHotkeyMap,
        ...omit(parsed.data.hotkeyMap, reservedHotkeyCommands),
      }
      if (
        parsed.data.hotkeyMap.delayTestTap?.length === 1 &&
        isHotkeyMatch(parsed.data.hotkeyMap.delayTestTap[0], LEGACY_DELAY_TEST_TAP)
      ) {
        hotkeyMap.delayTestTap = defaultHotkeyMap.delayTestTap
      }
      parsed.data.hotkeyMap = hotkeyMap
    }
    return {
      ...getDefaultPref(),
      ...parsed.data,
    }
  } catch {
    return getDefaultPref()
  }
}

export function savePreference(data: PreferenceSchema) {
  const prunedData: Partial<PreferenceSchema> = { ...data }
  const defaultPref = getDefaultPref()
  for (const [_key, value] of Object.entries(data)) {
    const key = _key as keyof PreferenceSchema
    if (stableStringify(value) === stableStringify(defaultPref[key]) || value === undefined)
      delete prunedData[key]
  }
  const payload: PersistedPref = {
    appVersion: __APP_VERSION__,
    prefVersion: PREF_VERSION,
    data: prunedData,
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}
