<script setup lang="ts">
import type { PreferenceSchema } from '@core/pref'

import { usePrefStore } from '@states/stores'

import PrefItem from './PrefItem.vue'
import { ToggleSwitch } from 'primevue'

type BooleanKeys = {
  [K in keyof PreferenceSchema]: PreferenceSchema[K] extends boolean ? K : never
}[keyof PreferenceSchema]

const props = defineProps<{
  prefKey: BooleanKeys
  label: string
  desc?: string
  disabled?: boolean
  experimental?: boolean
}>()

const prefStore = usePrefStore()
</script>

<template>
  <PrefItem :label :desc :disabled :experimental :for="props.prefKey">
    <ToggleSwitch v-model="prefStore[props.prefKey]" :disabled :input-id="props.prefKey" />
  </PrefItem>
</template>
