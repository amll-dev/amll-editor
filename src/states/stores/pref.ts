import { defineStore } from 'pinia'
import { reactive, toRefs, watch } from 'vue'

import { loadPreference, savePreference } from '@core/pref'

export const usePrefStore = defineStore('preference', () => {
  const state = reactive(loadPreference())
  watch(
    () => state,
    (newVal) => savePreference(newVal),
    { deep: true },
  )
  return { ...toRefs(state) }
})
