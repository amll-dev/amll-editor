<template>
  <Dialog
    v-model:visible="visible"
    :header="tt.header()"
    class="thin-padding delay-test-dialog"
    disable-global-hotkeys
  >
    <div class="delay-test-content" v-focustrap>
      <div class="delay-test-description">{{ tt.description() }}</div>
      <div class="delay-test-hint">
        <span>{{ tt.tapHint() }}</span>
        <kbd class="delay-test-key">{{ tapKeyLabel }}</kbd>
      </div>

      <div class="delay-test-beats" aria-label="beat-visualizer">
        <span
          v-for="beat in 4"
          :key="beat"
          class="delay-test-beat"
          :class="{ active: isRunning && currentBeatIndex === beat - 1 }"
        />
      </div>

      <div class="delay-test-stats">
        <div class="delay-test-stat">
          <span class="delay-test-stat-label">{{ tt.current() }}</span>
          <strong class="delay-test-value" :class="offsetTone(currentOffsetMs)">{{
            formatOffset(currentOffsetMs)
          }}</strong>
        </div>
        <div class="delay-test-stat">
          <span class="delay-test-stat-label">{{ tt.fastest() }}</span>
          <strong class="delay-test-value">{{ formatOffset(fastestOffsetMs) }}</strong>
        </div>
        <div class="delay-test-stat">
          <span class="delay-test-stat-label">{{ tt.slowest() }}</span>
          <strong class="delay-test-value">{{ formatOffset(slowestOffsetMs) }}</strong>
        </div>
      </div>

      <div class="delay-test-chart">
        <div class="delay-test-chart-center" />
        <div
          v-for="(sample, index) in chartSamples"
          :key="`${index}-${sample}`"
          class="delay-test-chart-sample"
          :class="sample >= 0 ? 'fast' : 'slow'"
          :style="sampleStyle(sample)"
        />
      </div>
      <div class="delay-test-empty" v-if="chartSamples.length === 0">{{ tt.noSamples() }}</div>

      <InputNumber
        v-model="latencyBpm"
        class="delay-test-bpm"
        fluid
        size="small"
        :use-grouping="false"
        :min="60"
        :max="320"
        :disabled="isRunning"
      />
      <div class="delay-test-bpm-label">{{ tt.bpmLabel() }}</div>

      <div class="delay-test-actions">
        <Button
          :label="isRunning ? tt.stop() : tt.start()"
          :icon="isRunning ? 'mdi mdi-stop' : 'mdi mdi-play'"
          @click="handleToggleRunning"
        />
        <Button
          :label="tt.applyCurrent()"
          severity="secondary"
          :disabled="currentOffsetMs === null || isRunning"
          @click="handleApplyCurrent"
        />
        <Button
          :label="tt.applyAverage()"
          severity="secondary"
          :disabled="averageOffsetMs === null || isRunning"
          @click="handleApplyAverage"
        />
      </div>

      <div class="delay-test-footer">{{ tt.signHint() }}</div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { t } from '@i18n'
import { computed, onUnmounted, ref, shallowRef, watch } from 'vue'

import type { HotKey } from '@core/hotkey'
import { getHotkeyStr, isHotkeyMatch, matchHotkeyInMap, parseKeyEvent } from '@core/hotkey'
import { usePrefStore } from '@states/stores'

import { isInputEl } from '@utils/isInputEl'

import { Button, Dialog, InputNumber } from 'primevue'

const tt = t.delayTestDialog

const [visible] = defineModel<boolean>({ required: true })

const prefStore = usePrefStore()

const isRunning = ref(false)
const currentBeatIndex = ref(-1)
const currentOffsetMs = ref<number | null>(null)
const sampleOffsetsMs = ref<number[]>([])
const chartRangeMs = computed(() => {
  const maxAbs = Math.max(120, ...sampleOffsetsMs.value.map((v) => Math.abs(v)))
  return Math.max(120, Math.ceil(maxAbs))
})
const chartSamples = computed(() => sampleOffsetsMs.value.slice(-100))
const fastestOffsetMs = computed(() => {
  if (chartSamples.value.length === 0) return null
  return Math.max(...chartSamples.value)
})
const slowestOffsetMs = computed(() => {
  if (chartSamples.value.length === 0) return null
  return Math.min(...chartSamples.value)
})
const averageOffsetMs = computed(() => {
  if (chartSamples.value.length === 0) return null
  return Math.round(chartSamples.value.reduce((sum, value) => sum + value, 0) / chartSamples.value.length)
})

const latencyBpm = computed<number | null>({
  get: () => prefStore.latencyTestBpm,
  set: (value) => {
    prefStore.latencyTestBpm = clampBpm(value ?? prefStore.latencyTestBpm)
  },
})
const tapKeyLabel = computed(() => getHotkeyStr('delayTestTap') ?? t.hotkey.notBinded())

const audioCtx = shallowRef<AudioContext | null>(null)
let rafId = 0
let sessionToken = 0
let nextBeatTime = 0
let nextBeatIndex = 0
let beatIntervalSec = 0
let startBeatTime = 0
let sessionStartedAt = 0
const tapPressState = ref<{ hotkey: HotKey.Key; downAt: number } | null>(null)

function clampBpm(value: number) {
  return Math.min(320, Math.max(60, Math.round(value)))
}

function formatOffset(value: number | null) {
  if (value === null) return '—'
  const sign = value > 0 ? '+' : value < 0 ? '-' : ''
  return `${sign}${Math.abs(value)} ms`
}

function offsetTone(value: number | null) {
  if (value === null) return 'neutral'
  if (value > 0) return 'fast'
  if (value < 0) return 'slow'
  return 'neutral'
}

function sampleStyle(value: number) {
  const range = chartRangeMs.value || 120
  const normalized = Math.min(Math.abs(value) / range, 1)
  return {
    left: `${50 + (value / range) * 50}%`,
    opacity: `${0.3 + normalized * 0.7}`,
  }
}

async function ensureAudioContext() {
  if (!audioCtx.value) audioCtx.value = new AudioContext({ latencyHint: 'interactive' })
  return audioCtx.value
}

function clearFrame() {
  if (rafId) cancelAnimationFrame(rafId)
  rafId = 0
}

function resetSessionState() {
  clearFrame()
  sessionToken += 1
  isRunning.value = false
  currentBeatIndex.value = -1
  currentOffsetMs.value = null
  sampleOffsetsMs.value = []
  tapPressState.value = null
  nextBeatTime = 0
  nextBeatIndex = 0
  beatIntervalSec = 0
  startBeatTime = 0
  sessionStartedAt = 0
}

async function stopAudioContext() {
  const ctx = audioCtx.value
  audioCtx.value = null
  if (!ctx) return
  try {
    await ctx.close()
  } catch {
    // ignore
  }
}

async function stopSession(preserveResults: boolean = true) {
  clearFrame()
  sessionToken += 1
  isRunning.value = false
  currentBeatIndex.value = -1
  tapPressState.value = null
  if (!preserveResults) {
    currentOffsetMs.value = null
    sampleOffsetsMs.value = []
  }
  await stopAudioContext()
}

function scheduleBeep(ctx: AudioContext, beatTime: number, accent: boolean) {
  const scheduleAt = Math.max(beatTime, ctx.currentTime + 0.005)
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.value = accent ? 880 : 660
  gain.gain.setValueAtTime(0.0001, scheduleAt)
  gain.gain.linearRampToValueAtTime(0.18, scheduleAt + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, scheduleAt + 0.08)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(scheduleAt)
  osc.stop(scheduleAt + 0.09)
  osc.onended = () => {
    osc.disconnect()
    gain.disconnect()
  }
}

function pushOffset(offsetMs: number) {
  sampleOffsetsMs.value = [...sampleOffsetsMs.value, offsetMs].slice(-100)
  currentOffsetMs.value = offsetMs
}

function recordHit(hitTime: number) {
  if (!beatIntervalSec) return
  const beatIndex = Math.max(0, Math.round((hitTime - startBeatTime) / beatIntervalSec))
  const nearestBeatTime = startBeatTime + beatIndex * beatIntervalSec
  pushOffset(Math.round((nearestBeatTime - hitTime) * 1000))
}

function frameLoop(ctx: AudioContext, token: number) {
  if (token !== sessionToken || !isRunning.value) return

  const now = ctx.currentTime
  const intervalSec = beatIntervalSec
  while (nextBeatTime - now < 0.3) {
    scheduleBeep(ctx, nextBeatTime, nextBeatIndex === 0)
    nextBeatTime += intervalSec
    nextBeatIndex = (nextBeatIndex + 1) % 4
  }

  const elapsedMs = performance.now() - sessionStartedAt
  if (elapsedMs >= 0) currentBeatIndex.value = Math.floor(elapsedMs / (intervalSec * 1000)) % 4
  else currentBeatIndex.value = 0

  rafId = requestAnimationFrame(() => frameLoop(ctx, token))
}

async function startSession() {
  if (isRunning.value) return
  const ctx = await ensureAudioContext()
  const token = ++sessionToken
  try {
    await ctx.resume()
  } catch {
    return
  }
  if (token !== sessionToken) return

  isRunning.value = true
  currentOffsetMs.value = null
  sampleOffsetsMs.value = []
  tapPressState.value = null
  currentBeatIndex.value = 0

  const leadSec = 0.3
  beatIntervalSec = 60 / clampBpm(prefStore.latencyTestBpm)
  startBeatTime = ctx.currentTime + leadSec
  sessionStartedAt = performance.now() + leadSec * 1000
  nextBeatTime = startBeatTime + beatIntervalSec
  nextBeatIndex = 1
  scheduleBeep(ctx, startBeatTime, true)
  rafId = requestAnimationFrame(() => frameLoop(ctx, token))
}

function handleToggleRunning() {
  if (isRunning.value) void stopSession(true)
  else void startSession()
}

function applyLatency(value: number | null) {
  if (value === null) return
  prefStore.globalLatencyMs = Math.min(5000, Math.max(-5000, Math.round(-value)))
}

function handleApplyCurrent() {
  applyLatency(currentOffsetMs.value)
}
function handleApplyAverage() {
  applyLatency(averageOffsetMs.value)
}

function handleKeydown(e: KeyboardEvent) {
  if (!visible.value || !isRunning.value) return
  if (e.repeat) return
  if (e.target instanceof HTMLElement && isInputEl(e.target)) return
  const hotkey = parseKeyEvent(e)
  if (!hotkey) return
  if (matchHotkeyInMap(hotkey, prefStore.hotkeyMap) !== 'delayTestTap') return
  e.preventDefault()
  tapPressState.value = { hotkey, downAt: performance.now() }
}

function handleKeyup(e: KeyboardEvent) {
  if (!visible.value || !isRunning.value) return
  if (e.target instanceof HTMLElement && isInputEl(e.target)) return
  const hotkey = parseKeyEvent(e)
  if (!hotkey) return
  if (matchHotkeyInMap(hotkey, prefStore.hotkeyMap) !== 'delayTestTap') return
  e.preventDefault()
  const tapState = tapPressState.value
  if (!tapState || !isHotkeyMatch(tapState.hotkey, hotkey)) return
  const ctx = audioCtx.value
  if (!ctx) return
  const upAt = performance.now()
  const outputLatency = (ctx as AudioContext & { outputLatency?: number }).outputLatency ?? 0
  const hitTime = ctx.currentTime + outputLatency - (upAt - tapState.downAt) / 2000
  recordHit(hitTime)
  tapPressState.value = null
}

watch(
  visible,
  (open) => {
    if (open) {
      resetSessionState()
      window.addEventListener('keydown', handleKeydown, true)
      window.addEventListener('keyup', handleKeyup, true)
      return
    }
    window.removeEventListener('keydown', handleKeydown, true)
    window.removeEventListener('keyup', handleKeyup, true)
    void stopSession(false)
    resetSessionState()
  },
  { immediate: true },
)

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown, true)
  window.removeEventListener('keyup', handleKeyup, true)
  void stopSession(false)
})
</script>

<style lang="scss">
.delay-test-dialog {
  .delay-test-content {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    min-width: min(34rem, 90vw);
  }

  .delay-test-description,
  .delay-test-footer,
  .delay-test-empty,
  .delay-test-stat-label {
    opacity: 0.72;
    font-size: 0.92rem;
  }

  .delay-test-hint {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .delay-test-key {
    padding: 0.1rem 0.45rem;
    border-radius: 0.35rem;
    background: var(--p-surface-200);
    font-family: var(--font-monospace);
  }

  .delay-test-beats {
    display: flex;
    justify-content: center;
    gap: 0.75rem;
    margin: 0.5rem 0 0.25rem;
  }

  .delay-test-beat {
    width: 0.9rem;
    height: 0.9rem;
    border-radius: 999px;
    background: var(--p-surface-300);
    transition: transform 0.12s, background 0.12s, box-shadow 0.12s;

    &.active {
      background: var(--p-primary-color);
      box-shadow: 0 0 0 0.35rem color-mix(in srgb, var(--p-primary-color) 20%, transparent);
      transform: scale(1.1);
    }
  }

  .delay-test-stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.5rem;
  }

  .delay-test-stat {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    padding: 0.6rem 0.75rem;
    border-radius: 0.5rem;
    background: var(--p-surface-100);
  }

  .delay-test-value.fast {
    color: var(--p-green-500);
  }
  .delay-test-value.slow {
    color: var(--p-red-500);
  }
  .delay-test-value.neutral {
    color: inherit;
  }

  .delay-test-chart {
    position: relative;
    height: 3rem;
    border-radius: 0.5rem;
    background: var(--p-surface-100);
    overflow: hidden;
  }

  .delay-test-chart-center {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 50%;
    width: 2px;
    transform: translateX(-50%);
    background: var(--p-primary-color);
    opacity: 0.65;
  }

  .delay-test-chart-sample {
    position: absolute;
    top: 0.3rem;
    bottom: 0.3rem;
    width: 2px;
    transform: translateX(-50%);
    border-radius: 999px;

    &.fast {
      background: color-mix(in srgb, var(--p-green-500) 80%, white);
    }

    &.slow {
      background: color-mix(in srgb, var(--p-red-500) 80%, white);
    }
  }

  .delay-test-bpm {
    --p-inputtext-padding-y: 0.4rem;
    .p-inputtext.p-inputtext {
      font-family: var(--font-monospace);
      width: 0;
    }
  }

  .delay-test-bpm-label {
    margin-top: -0.25rem;
    opacity: 0.7;
    font-size: 0.92rem;
  }

  .delay-test-actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
}
</style>
