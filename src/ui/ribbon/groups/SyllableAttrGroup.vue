<template>
  <RibbonGroup :label="tt.groupLabel()">
    <div class="hflex" style="align-items: center; gap: 1rem">
      <div class="kvgrid">
        <span>{{ tt.startTime() }}</span>
        <InputText
          class="timeinput"
          placeholder="00:00.000"
          size="small"
          :disabled="sylSelectionEmpty"
          v-model.lazy="sylStartTime"
          v-keyfilter="/[0-9:.]/"
        />
        <span>{{ tt.endTime() }}</span>
        <InputText
          class="timeinput"
          placeholder="00:00.000"
          size="small"
          :disabled="sylSelectionEmpty"
          v-model.lazy="sylEndTime"
          v-keyfilter="/[0-9:.]/"
        />
        <span>{{ tt.duration() }}</span>
        <InputNumber
          class="durationinput"
          size="small"
          placeholder="0"
          :disabled="sylSelectionEmpty"
          v-model="sylDuration"
          :invalid="(sylDuration ?? 0) < 0"
        />
      </div>
      <div class="vflex" style="gap: 0.5rem; width: 7.5rem">
        <span style="text-align: center">
          {{ tt.placeholdingBeat() }}
          <span style="font-family: var(--font-monospace)"
            >{{ currPhBeatInput ?? 'N' }}/{{ phBeatInput ?? 'A' }}</span
          >
        </span>
        <div class="hflex">
          <InputGroup>
            <InputNumber
              class="monospace"
              showButtons
              :min="0"
              size="small"
              placeholder="0"
              :disabled="sylSelectionEmpty"
              v-model="phBeatInput"
            />
            <InputGroupAddon class="placeholderbeat-applytoall-addon">
              <Button
                class="placeholderbeat-applytoall"
                icon="pi pi-angle-double-right"
                severity="secondary"
                variant="text"
                size="small"
                fluid
                :disabled="sylSelectionEmpty || !phBeatApplyToAllEnabled"
                @click="phBeatApplyToAll"
                v-tooltip="tt.applyToAllSameSyls()"
              />
            </InputGroupAddon>
          </InputGroup>
        </div>
        <Slider
          :step="1"
          style="margin: 0.5rem"
          :disabled="sylSelectionEmpty || !phBeatInput"
          :min="0"
          :max="phBeatInput || 1"
          v-model="currPhBeatInput"
        />
      </div>
    </div>
  </RibbonGroup>
</template>

<script setup lang="ts">
import { t } from '@i18n'
import { computed } from 'vue'

import { useCoreStore, useRuntimeStore } from '@states/stores'

import RibbonGroup from '../RibbonGroupShell.vue'
import InputText from '@ui/components/InputText.vue'
import { Button, InputGroup, InputGroupAddon, InputNumber, Slider } from 'primevue'

import { itemTimeInput } from '../common'

const tt = t.ribbon.syllableAttr

const runtimeStore = useRuntimeStore()
const coreStore = useCoreStore()

const sylSelectionEmpty = computed(() => runtimeStore.selectedSyllables.size === 0)

const {
  startTime: sylStartTime,
  endTime: sylEndTime,
  duration: sylDuration,
} = itemTimeInput(runtimeStore.selectedSyllables)

function placeholdingBeatInputs() {
  const setOnlyOne = computed(() => runtimeStore.selectedSyllables.size === 1)
  const setFirstItem = computed(() => runtimeStore.selectedSyllables.values().next().value)
  const numericComputed = (key: 'placeholdingBeat' | 'currentplaceholdingBeat') =>
    computed<number | undefined>({
      get() {
        if (!setFirstItem.value) return undefined
        const firstValue = setFirstItem.value[key]
        if (setOnlyOne.value) return firstValue
        for (const item of runtimeStore.selectedSyllables)
          if (item[key] !== firstValue) return undefined
        return firstValue
      },
      set(value) {
        if (typeof value !== 'number') value = 0
        runtimeStore.selectedSyllables.forEach((item) => (item[key] = value))
      },
    })

  const phBeatInput = numericComputed('placeholdingBeat')
  const currPhBeatInput = numericComputed('currentplaceholdingBeat')
  const phBeatApplyToAllEnabled = computed(() => {
    return typeof phBeatInput.value === 'number' && typeof currPhBeatInput.value === 'number'
  })
  const phBeatApplyToAll = () => {
    if (typeof phBeatInput.value !== 'number' || typeof currPhBeatInput.value !== 'number') return
    coreStore.lyricLines.forEach((line) => {
      line.syllables.forEach((word) => {
        if (word.text !== setFirstItem.value?.text) return
        word.placeholdingBeat = phBeatInput.value!
      })
    })
  }
  return { phBeatInput, currPhBeatInput, phBeatApplyToAllEnabled, phBeatApplyToAll }
}
const { phBeatInput, currPhBeatInput, phBeatApplyToAllEnabled, phBeatApplyToAll } =
  placeholdingBeatInputs()
</script>
