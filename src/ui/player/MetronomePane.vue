<template>
  <div class="metronome-pane-wrapper">
    <div class="pane-titlebar">
      <div class="title-text">节拍器</div>
      <ToggleSwitch v-model="enabled" />
    </div>
    <div class="knob-wrapper">
      <Knob v-model="bpm" :strokeWidth="6" :min="20" :max="240" />
    </div>
    <div class="buttons-wrapper">
      <Button label="÷2" size="small" severity="secondary" fluid @click="halfBPM" />
      <Button
        icon="mdi mdi-undo-variant"
        size="small"
        severity="secondary"
        fluid
        @click="resetOptn"
        :disabled="!detectedOpt"
      />
      <Button label="×2" size="small" severity="secondary" fluid @click="doubleBPM" />
    </div>
    <InputGroup class="offset-input">
      <InputGroupAddon><i class="mdi mdi-timelapse"></i> 偏移</InputGroupAddon>
      <InputNumber placeholder="0" v-model="offset" size="small" :maxFractionDigits="0" />
    </InputGroup>
    <Divider />
    <Button
      icon="mdi mdi-auto-fix"
      size="small"
      label="自动识别"
      @click="autoDetect"
      :loading="autoDetectLoading"
    />
  </div>
</template>

<script setup lang="ts">
import { clamp } from 'lodash-es'
import { ref } from 'vue'

import { detectCurrentBpm } from '@core/audio/bpmDetect'

import {
  Button,
  Divider,
  InputGroup,
  InputGroupAddon,
  InputNumber,
  Knob,
  ToggleSwitch,
} from 'primevue'

const enabled = ref(false)
const bpm = ref(120)
const offset = ref(0)
defineExpose({ enabled })

const MAXBPM = 240
const MINBPM = 20

interface DetectedOpt {
  bpm: number
  offset: number
}
const detectedOpt: DetectedOpt | null = null
const autoDetectLoading = ref(false)
async function autoDetect() {
  autoDetectLoading.value = true
  const result = await detectCurrentBpm()
  autoDetectLoading.value = false
  if (!result) return
  console.log('Auto-detected BPM and offset:', result)
  bpm.value = Math.round(result.bpm)
  offset.value = Math.round(result.offset * 1000)
}
function resetOptn() {
  bpm.value = detectedOpt?.bpm ?? 120
  offset.value = detectedOpt?.offset ?? 0
}
function doubleBPM() {
  bpm.value = clamp(bpm.value * 2, MINBPM, MAXBPM)
}
function halfBPM() {
  bpm.value = clamp(bpm.value / 2, MINBPM, MAXBPM)
}
</script>

<style lang="scss">
.metronome-pane-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 10rem;
  .pane-titlebar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    .title-text {
      font-size: 1.1rem;
      font-weight: bold;
    }
  }
  .knob-wrapper {
    display: flex;
    justify-content: center;
    position: relative;
    margin-bottom: -0.5rem;
    &::after {
      content: 'BPM';
      position: absolute;
      bottom: 2.2rem;
      font-size: 0.8rem;
      opacity: 0.6;
    }
    .p-knob-text {
      --p-knob-text-color: var(--p-text-color);
      font-weight: bold;
      font-size: 1.5rem;
      vertical-align: middle;
      font-family: var(--font-monospace);
      transform: translateY(-0.3rem);
    }
  }
  .buttons-wrapper {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 0.5rem;
    .p-button-fluid.p-button-icon-only {
      width: auto;
    }
  }
  .offset-input {
    .p-inputgroupaddon {
      padding: 0 0.5rem;
      gap: 0.3rem;
      font-size: 0.9rem;
      width: auto;
    }
    .p-inputtext.p-inputtext {
      width: 0;
      text-align: right;
      font-family: var(--font-monospace);
      min-width: none;
    }
  }
  .p-divider {
    margin: 0;
  }
}
</style>
