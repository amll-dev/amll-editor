<template>
  <div class="audio-progress-canvas-wrapper" ref="audioProgressWrapperEl">
    <canvas v-show="canvasReady" class="audio-progress-canvas" ref="audioProgressCanvas"></canvas>
    <div :style="{ visibility: canvasReady ? 'hidden' : 'visible' }" class="audio-progress-ghost">
      <div class="audio-progress-primary" :style="{ fontSize: primarySize + 'rem' }">00:00.000</div>
      <div
        class="audio-progress-secondary"
        :style="{ fontSize: secondarySize + 'rem', opacity: secondaryOpacity }"
      >
        <span class="audio-percentage-text">0%</span>
        <span class="audio-length-text">00:00.000</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDark } from '@vueuse/core'
import { computed, nextTick, onMounted, onUnmounted, ref, useTemplateRef, watch } from 'vue'

import { audioEngine } from '@core/audio'

import { ms2str } from '@utils/formatTime'

const { amendedProgressComputed, lengthComputed } = audioEngine
const isDark = useDark()
const canvasReady = ref(false)
const audioProgressWrapperEl = useTemplateRef('audioProgressWrapperEl')
const audioProgressCanvas = useTemplateRef('audioProgressCanvas')
const fontFamily = ref('')

const percentageRef = computed(() => {
  if (lengthComputed.value === 0) return 0
  return Math.round((amendedProgressComputed.value / lengthComputed.value) * 100)
})

let revokeListeners: (() => void) | null = null
onMounted(async () => {
  await document.fonts.ready
  if (!audioProgressWrapperEl.value || !audioProgressCanvas.value) return
  fontFamily.value = getComputedStyle(audioProgressWrapperEl.value).fontFamily
  canvasReady.value = true
  nextTick(() => drawProgress())

  window.addEventListener('resize', drawProgress)
  const mq = matchMedia(`(resolution: ${devicePixelRatio}dppx)`)
  mq.addEventListener('change', drawProgress)
  revokeListeners = () => {
    window.removeEventListener('resize', drawProgress)
    mq.removeEventListener('change', drawProgress)
  }
})
onUnmounted(() => revokeListeners?.())
watch([amendedProgressComputed, lengthComputed, isDark], () => drawProgress())

// Where sizes from:
// Primary:   00:00.000      <- 9 ch
// Secondary: 100% 00:00.000 <- 13 ch + space (use 0.6ch)
// So to align, it should be: 9 x primarySize == 13.6 x secondarySize
// => primarySize / 13.6 == secondarySize / 9 == fontSizeUnit
// => primarySize = fontSizeUnit * 13.6
//    secondarySize = fontSizeUnit * 9
const fontSizeUnit = 0.085
const primarySize = fontSizeUnit * 13.6
const secondarySize = fontSizeUnit * 9

const primaryOffset = 1.5
const secondaryOffset = 0.8
const secondaryOpacity = 0.7

let cachedDPR = -1
const drawProgress = () => {
  if (!canvasReady.value || !audioProgressCanvas.value) return
  if (cachedDPR !== devicePixelRatio) {
    // Recalculate canvas size
    if (!audioProgressWrapperEl.value) return
    const width = audioProgressWrapperEl.value.clientWidth
    const height = audioProgressWrapperEl.value.clientHeight
    audioProgressCanvas.value.width = Math.ceil(width * devicePixelRatio)
    audioProgressCanvas.value.height = Math.ceil(height * devicePixelRatio)
    audioProgressCanvas.value.style.width = `${width}px`
    audioProgressCanvas.value.style.height = `${height}px`
    cachedDPR = devicePixelRatio
  }
  const ctx = audioProgressCanvas.value.getContext('2d')
  if (!ctx) return
  const width = audioProgressCanvas.value.clientWidth * devicePixelRatio
  const height = audioProgressCanvas.value.clientHeight * devicePixelRatio
  ctx.clearRect(0, 0, width, height)
  // Top: progress 00:00.000
  ctx.font = `${primarySize * devicePixelRatio}rem ${fontFamily.value}`
  ctx.fillStyle = isDark.value ? 'white' : 'black'
  ctx.textBaseline = 'top'
  ctx.textAlign = 'left'
  const progressStr = ms2str(amendedProgressComputed.value)
  ctx.fillText(progressStr, 0, primaryOffset * devicePixelRatio)
  // Bottom: percentage and length
  ctx.font = `${secondarySize * devicePixelRatio}rem ${fontFamily.value}`
  ctx.fillStyle = isDark.value
    ? `rgba(255, 255, 255, ${secondaryOpacity})`
    : `rgba(0, 0, 0, ${secondaryOpacity})`
  ctx.textBaseline = 'bottom'
  const percentageStr = `${percentageRef.value}%`
  const lengthStr = ms2str(lengthComputed.value)
  ctx.textBaseline = 'bottom'
  ctx.textAlign = 'left'
  ctx.fillText(percentageStr, 0, height + secondaryOffset * devicePixelRatio)
  ctx.textAlign = 'right'
  ctx.fillText(lengthStr, width, height + secondaryOffset * devicePixelRatio)
}
</script>

<style lang="scss">
.audio-progress-canvas-wrapper {
  margin: auto 0.3rem;
  height: 31px;
  display: flex;
  font-family: var(--font-monospace);
  position: relative;
}
.audio-progress-canvas {
  position: absolute;
  top: 0;
  left: 0;
}
.audio-progress-ghost {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: space-between;
  text-align: center;
  line-height: 1;
}
.audio-progress-secondary {
  display: flex;
  width: 13.6ch;
  justify-content: space-between;
}
</style>
