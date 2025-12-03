<template>
  <div
    class="spectrogram-container"
    style="position: relative; overflow: hidden"
    ref="containerEl"
    :style="{ height: props.height + 'px' }"
    @wheel.prevent="handleWheel"
  >
    <div class="spectrogram-scroller" :style="{ transform: `translateX(${-scrollLeft}px)` }">
      <Tile
        v-for="tile in tiles"
        :key="tile.index"
        :tile="tile"
        :left="tile.index * tileWidth"
        :height="props.height"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { shallowRef, computed, ref, watch, useTemplateRef } from 'vue'
import Tile from './Tile.vue'
import stableStringify from 'fast-json-stable-stringify'
import {
  useSpectrogramWorker,
  type TileEntry,
  type RequestTileParams,
} from './useSpectrogramWorker'
import { useStaticStore } from '@/stores/static'
import { generatePalette, getIcyBlueColor } from './colors'
import { useElementSize } from '@vueuse/core'
const { audio } = useStaticStore()

const props = defineProps<{
  height: number
}>()
const scrollLeft = ref(0)
const containerEl = useTemplateRef('containerEl')
const { width: containerWidth } = useElementSize(containerEl)
const scaleRatio = ref(1)
const MINSCALE = 1,
  MAXSCALE = 10

const clamper = (min: number, max: number) => (value: number) => {
  if (value < min) return min
  if (value > max) return max
  return value
}
const clampScale = clamper(MINSCALE, MAXSCALE)
const RATIO_STEP = 0.005
const detltaToRatio = (delta: number) => {
  delta *= RATIO_STEP
  const factor = delta < 0 ? 1 - delta : 1 / (1 + delta)
  return factor
}
function handleWheel(event: WheelEvent) {
  if (!event.ctrlKey) {
    scrollLeft.value += event.deltaY
    if (scrollLeft.value < 0) scrollLeft.value = 0
    if (scrollLeft.value > maxScrollLeft.value) scrollLeft.value = maxScrollLeft.value
  } else {
    const oldScale = scaleRatio.value
    const newScale = clampScale(oldScale * detltaToRatio(event.deltaY))
    if (newScale === oldScale) return
    // adjust scrollLeft to keep the point under the cursor stationary
    if (!containerEl.value) return
    const rect = containerEl.value.getBoundingClientRect()
    if (!rect) return
    const cursorX = event.clientX - rect.left
    const cursorRatio = cursorX / rect.width
    const contentX = scrollLeft.value + cursorRatio * rect.width
    const newContentX = (contentX / oldScale) * newScale
    scrollLeft.value = newContentX - cursorRatio * rect.width
    if (scrollLeft.value < 0) scrollLeft.value = 0
    if (newScale < oldScale && scrollLeft.value > maxScrollLeft.value)
      scrollLeft.value = maxScrollLeft.value
    scaleRatio.value = newScale
  }
}
const maxScrollLeft = computed(() => {
  if (!audio.lengthComputed.value) return 0
  if (!containerWidth.value) return 0
  return (audio.lengthComputed.value / TILE_DURATION_MS) * tileWidth.value - containerWidth.value
})
const firstVisibleTileIndex = computed(() => Math.floor(scrollLeft.value / tileWidth.value))
const lastVisibleTileIndex = computed(() =>
  Math.ceil((scrollLeft.value + containerWidth.value) / tileWidth.value),
)

const TILE_DURATION_MS = 5000
const tileWidth = computed(() => Math.round(256 * scaleRatio.value))
const GAIN = 5.0

const paletteData = shallowRef(generatePalette(getIcyBlueColor))

// worker composable
const { tileCache, requestTileIfNeeded, workerInitPromise } = useSpectrogramWorker(
  audio.audioBufferComputed,
  paletteData,
)

const obj2id = (obj: Object) => stableStringify(obj)
const tileRequests = computed((): RequestTileParams[] =>
  Array.from({ length: Math.ceil(audio.lengthComputed.value / TILE_DURATION_MS) }, (_, i) => {
    const start = i * TILE_DURATION_MS
    const end = start + TILE_DURATION_MS

    const paramsWithoutId: Omit<RequestTileParams, 'id'> = {
      startTime: start,
      endTime: end,
      gain: GAIN,
      tileWidthPx: tileWidth.value,
      paletteId: 'default',
    }
    const id = obj2id(paramsWithoutId)
    return { ...paramsWithoutId, id }
  }),
)

const tiles = ref<(TileEntry & { index: number })[]>([])
watch(
  tileRequests,
  async () => {
    await workerInitPromise
    tileRequests.value.forEach((params) => {
      requestTileIfNeeded(params)
    })
  },
  { immediate: true },
)
const VISIBLE_TILE_BUFFER = 0
function updateVisibleTiles() {
  tiles.value = tileRequests.value
    .map((r, index) => {
      if (
        index < firstVisibleTileIndex.value - VISIBLE_TILE_BUFFER ||
        index > lastVisibleTileIndex.value + VISIBLE_TILE_BUFFER
      )
        return null
      const tile = tileCache.get(r.id)
      return tile ? { ...tile, index } : null
    })
    .filter((x): x is TileEntry & { index: number } => !!x)
}
watch([firstVisibleTileIndex, lastVisibleTileIndex, scaleRatio], updateVisibleTiles)
tileCache.onSet(updateVisibleTiles)
</script>

<style>
.spectrogram-container {
  background: #000;
}
</style>
