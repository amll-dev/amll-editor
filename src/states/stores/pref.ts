import { defineStore } from 'pinia'
import { reactive, toRefs } from 'vue'

import { getDefaultPref } from '@core/pref'

export const usePrefStore = defineStore('preference', () => {
  const state = reactive(getDefaultPref())
  return { ...toRefs(state) }
})
