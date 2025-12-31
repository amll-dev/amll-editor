<script setup lang="ts">
import type { PreferenceSchema } from '@core/pref'

import { usePrefStore } from '@states/stores'

import PrefItem from './PrefItem.vue'
import { InputNumber } from 'primevue'

type NumberKeys = {
  [K in keyof PreferenceSchema]: PreferenceSchema[K] extends number ? K : never
}[keyof PreferenceSchema]

const props = defineProps<{
  prefKey: NumberKeys
  label: string
  desc?: string
  min?: number
  max?: number
  disabled?: boolean
  experimental?: boolean
}>()

const prefStore = usePrefStore()
</script>

<template>
  <PrefItem :label :desc :disabled :experimental>
    <InputNumber
      v-model="prefStore[props.prefKey]"
      :min
      :max
      :disabled
      class="pref-number"
      fluid
      show-buttons
    />
  </PrefItem>
</template>

<style lang="scss">
.pref-number {
  max-width: 8rem;
}
</style>
