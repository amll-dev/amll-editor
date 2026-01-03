<template>
  <div
    class="spectrogram-container"
    ref="containerEl"
    @wheel.prevent="handleWheel"
    :style="{ height: displayHeight + 'px' }"
  >
    <div class="resize-handle" v-bind="resizeHandleProps">
      <div class="handle-bar"></div>
    </div>

    <div
      class="spectrogram-content"
      :style="{
        width: `${totalContentWidth}px`,
        transform: `translate3d(${-Math.round(scrollLeft)}px, 0, 0)`,
      }"
    >
      <SpectrogramTile
        v-for="{ id: key, left, width, height, canvasHeight, canvasWidth, bitmap } in visibleTiles"
        :key
        :left
        :width
        :height
        :canvas-height
        :canvas-width
        :bitmap
      />
    </div>

    <EmptyTip
      v-if="!audioEngine.audioBuffer"
      icon="pi pi-volume-off"
      title="没有音频数据"
      tip="加载音频文件后将渲染频谱图"
      compact
    />
  </div>
</template>

<script setup lang="ts">
import { useResizeObserver } from '@vueuse/core'
import { computed, onUnmounted, ref, shallowRef, watch } from 'vue'

import { audioEngine } from '@core/audio/index.ts'
import { generatePalette, getIcyBlueColor } from '@core/spectrogram/colors'
import { useSpectrogramResize } from '@core/spectrogram/useSpectrogramResize'
import { useSpectrogramWorker } from '@core/spectrogram/useSpectrogramWorker'

import SpectrogramTile from './SpectrogramTile.vue'
import EmptyTip from '@ui/components/EmptyTip.vue'

const TILE_DURATION_S = 5
const LOD_WIDTHS = [512, 1024, 2048, 4096, 8192]
const MIN_ZOOM = 10
const MAX_ZOOM = 1000
const ZOOM_SENSITIVITY = 1.15

const containerEl = ref<HTMLElement | null>(null)
const containerWidth = ref(0)
const scrollLeft = ref(0)
const targetScrollLeft = ref(0)
const zoom = ref(100)
const targetZoom = ref(100)
const SMOOTHING_FACTOR = 0.27
// TODO: 从 store 获取
const gain = ref(3.0)
const palette = ref<Uint8Array>(generatePalette(getIcyBlueColor))

const {
  height: displayHeight,
  isResizing,
  resizeHandleProps,
} = useSpectrogramResize({
  initialHeight: 240,
  minHeight: 120,
  maxHeight: 600,
})

const renderHeight = ref(displayHeight.value)

watch(isResizing, (resizing) => {
  if (!resizing) {
    renderHeight.value = displayHeight.value
  }
})

useResizeObserver(containerEl, (entries) => {
  const entry = entries[0]
  if (!entry) return
  const { width } = entry.contentRect
  containerWidth.value = width
})

const audioBufferRef = computed(() => audioEngine.audioBuffer)
const { requestTileIfNeeded, tileCache, lastTileTimestamp } = useSpectrogramWorker(
  audioBufferRef,
  palette,
)

interface VisibleTile {
  id: string
  left: number
  width: number
  height: number
  canvasHeight: number
  canvasWidth: number
  bitmap?: ImageBitmap
}

const visibleTiles = shallowRef<VisibleTile[]>([])

const totalContentWidth = computed(() => {
  const duration = audioEngine.audioBuffer?.duration || 0
  return duration * zoom.value
})

const updateVisibleTiles = () => {
  const buffer = audioEngine.audioBuffer
  if (!buffer || containerWidth.value === 0) return

  const pixelsPerSecond = zoom.value
  const tileDisplayWidthPx = TILE_DURATION_S * pixelsPerSecond
  const totalTiles = Math.ceil(buffer.duration / TILE_DURATION_S)

  const viewStart = scrollLeft.value
  const viewEnd = viewStart + containerWidth.value

  const firstVisibleIndex = Math.floor(viewStart / tileDisplayWidthPx)
  const lastVisibleIndex = Math.ceil(viewEnd / tileDisplayWidthPx)

  const newVisibleTiles: VisibleTile[] = []

  const renderH = renderHeight.value

  for (let i = firstVisibleIndex - 2; i <= lastVisibleIndex + 2; i++) {
    if (i < 0 || i >= totalTiles) continue

    const targetLodWidth =
      LOD_WIDTHS.find((w) => w >= tileDisplayWidthPx) ?? LOD_WIDTHS[LOD_WIDTHS.length - 1]!

    const cacheId = `tile-${i}`
    // TODO: 从 store 获取
    const currentPaletteId = 'default'

    requestTileIfNeeded({
      tileIndex: i,
      startTime: i * TILE_DURATION_S,
      endTime: i * TILE_DURATION_S + TILE_DURATION_S,
      gain: gain.value,
      height: renderH,
      tileWidthPx: targetLodWidth,
      paletteId: currentPaletteId,
    })

    const cacheEntry = tileCache.get(cacheId)

    newVisibleTiles.push({
      id: cacheId,
      left: i * tileDisplayWidthPx,
      width: tileDisplayWidthPx,
      height: displayHeight.value,
      canvasHeight: renderH,
      canvasWidth: targetLodWidth,
      bitmap: cacheEntry?.bitmap,
    })
  }

  visibleTiles.value = newVisibleTiles
}

watch(
  [
    scrollLeft,
    zoom,
    containerWidth,
    displayHeight,
    renderHeight,
    gain,
    lastTileTimestamp,
    audioBufferRef,
  ],
  () => {
    updateVisibleTiles()
  },
  { immediate: true },
)

let scrollAnimId = 0
let zoomAnimId = 0

let zoomAnchorTime = 0
let zoomAnchorMouseX = 0

const startSmoothScroll = () => {
  cancelAnimationFrame(scrollAnimId)
  cancelAnimationFrame(zoomAnimId)

  const step = () => {
    const diff = targetScrollLeft.value - scrollLeft.value
    if (Math.abs(diff) < 0.5) {
      scrollLeft.value = targetScrollLeft.value
      return
    }
    scrollLeft.value += diff * SMOOTHING_FACTOR
    scrollAnimId = requestAnimationFrame(step)
  }
  step()
}

const startSmoothZoom = () => {
  cancelAnimationFrame(zoomAnimId)
  cancelAnimationFrame(scrollAnimId)

  const step = () => {
    const diff = targetZoom.value - zoom.value

    if (Math.abs(diff) < 0.1) {
      zoom.value = targetZoom.value
      const finalScroll = zoomAnchorTime * zoom.value - zoomAnchorMouseX
      scrollLeft.value = Math.max(0, finalScroll)
      targetScrollLeft.value = scrollLeft.value
      return
    }

    zoom.value += diff * SMOOTHING_FACTOR

    const newScroll = zoomAnchorTime * zoom.value - zoomAnchorMouseX

    const maxScroll = Math.max(
      0,
      (audioEngine.audioBuffer?.duration || 0) * zoom.value - containerWidth.value,
    )
    const clampedScroll = Math.max(0, Math.min(newScroll, maxScroll))

    scrollLeft.value = clampedScroll

    targetScrollLeft.value = clampedScroll

    zoomAnimId = requestAnimationFrame(step)
  }

  step()
}

onUnmounted(() => {
  cancelAnimationFrame(scrollAnimId)
  cancelAnimationFrame(zoomAnimId)
})

const handleWheel = (e: WheelEvent) => {
  if (e.ctrlKey) {
    if (!containerEl.value) return
    const rect = containerEl.value.getBoundingClientRect()
    const mouseX = e.clientX - rect.left

    const timeAtCursor = (scrollLeft.value + mouseX) / zoom.value

    zoomAnchorTime = timeAtCursor
    zoomAnchorMouseX = mouseX

    let newTarget = targetZoom.value
    if (e.deltaY < 0) {
      newTarget *= ZOOM_SENSITIVITY
    } else {
      newTarget /= ZOOM_SENSITIVITY
    }

    newTarget = Math.max(MIN_ZOOM, Math.min(newTarget, MAX_ZOOM))

    if (newTarget !== targetZoom.value) {
      targetZoom.value = newTarget
      startSmoothZoom()
    }
  } else {
    let delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
    if (e.shiftKey && delta === 0) delta = e.deltaY

    const maxScroll = Math.max(0, totalContentWidth.value - containerWidth.value)
    const newTarget = targetScrollLeft.value + delta

    targetScrollLeft.value = Math.max(0, Math.min(newTarget, maxScroll))

    startSmoothScroll()
  }
}

watch(audioBufferRef, () => {
  scrollLeft.value = 0
  targetScrollLeft.value = 0
  zoom.value = 100
  targetZoom.value = 100
  cancelAnimationFrame(scrollAnimId)
  cancelAnimationFrame(zoomAnimId)
})
</script>

<style lang="scss" scoped>
.spectrogram-container {
  width: 100%;
  flex: none;
  min-height: 120px;
  position: relative;
  overflow: hidden;
}

.spectrogram-content {
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  will-change: transform;
}

.resize-handle {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 18px;
  z-index: 100;
  cursor: ns-resize;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;

  &:hover,
  &:active {
    background-color: rgba(255, 255, 255, 0.1);

    .handle-bar {
      background-color: var(--p-primary-color);
    }
  }
  :root:has(&:active) * {
    cursor: ns-resize;
  }

  .handle-bar {
    width: 40px;
    height: 3px;
    border-radius: 2px;
    background-color: rgba(255, 255, 255, 0.2);
    transition: background-color 0.2s;
  }
}
</style>
