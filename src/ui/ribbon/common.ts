import { computed, ref } from 'vue'

import { ms2str, str2ms } from '@utils/formatTime'
import type { Maybe } from '@utils/types'

export type BooleanKeys<T> = {
  [K in keyof T]: T[K] extends boolean ? K : never
}[keyof T]
export function attrCheckbox<T extends object>(itemSet: ReadonlySet<T>, attr: BooleanKeys<T>) {
  const indeterminate = ref(true)
  const checked = computed<boolean>({
    get() {
      if (itemSet.size === 0) {
        indeterminate.value = true
        return false
      }
      const first = itemSet.values().next().value![attr] as boolean
      if (itemSet.size === 1) {
        indeterminate.value = false
        return first
      }
      for (const item of itemSet)
        if (item[attr] !== first) {
          indeterminate.value = true
          return false
        }
      indeterminate.value = false
      return first
    },
    set(value) {
      for (const item of itemSet) ((item[attr] as boolean) = value)
      indeterminate.value = false
    },
  })
  return { checked, indeterminate }
}

export function itemTimeInput<T extends { startTime: number; endTime: number }>(
  itemSet: ReadonlySet<T>,
) {
  const setOnlyOne = computed(() => itemSet.size === 1)
  const setFirstItem = computed(() => itemSet.values().next().value)
  const getTimeComputed = (timeKey: 'startTime' | 'endTime') =>
    computed<Maybe<string>>({
      get() {
        if (!setFirstItem.value) return '' // empty set
        if (setOnlyOne.value) return ms2str(setFirstItem.value[timeKey])
        const firstTime = setFirstItem.value![timeKey]
        for (const item of itemSet) if (item[timeKey] !== firstTime) return ''
        return ms2str(firstTime)
      },
      set(value) {
        if (typeof value !== 'string') return
        const ms = str2ms(value)
        if (ms === null) return
        for (const item of itemSet) (item[timeKey] = ms)
      },
    })
  const startTime = getTimeComputed('startTime')
  const endTime = getTimeComputed('endTime')
  const duration = computed<number | undefined>({
    get() {
      if (!setFirstItem.value) return
      const calcDuration = (item: T) => item.endTime - item.startTime
      const firstDuration = calcDuration(setFirstItem.value)
      if (setOnlyOne.value) return firstDuration
      for (const item of itemSet) if (calcDuration(item) !== firstDuration) return
      return firstDuration
    },
    set(ms) {
      if (typeof ms !== 'number') return
      for (const item of itemSet) (item.endTime = item.startTime + ms)
    },
  })
  return { startTime, endTime, duration }
}
