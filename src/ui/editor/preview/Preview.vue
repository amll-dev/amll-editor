<template>
  <div
    class="preview"
    @wheel.self="passToPlayer"
    @touchstart.self="passToPlayer"
    @touchmove.self="passToPlayer"
    @touchend.self="passToPlayer"
  >
    <LyricPlayer
      class="amll-lyric-player"
      :lyric-lines="amllLyricLines"
      :current-time="amendedProgressComputed"
      :playing="playingComputed"
      :enable-blur="false"
      :word-fade-width="0.25"
      @line-click="jumpSeek"
      :key="playerKey"
      ref="playerRef"
    />
    <Button
      class="preview-reload-button"
      :label="tt.reloadAmll()"
      severity="secondary"
      icon="pi pi-refresh"
      variant="text"
      @click="playerKey = Symbol()"
    />
  </div>
</template>
<script setup lang="ts">
import type { DomLyricPlayer } from '@applemusic-like-lyrics/core'
import { LyricPlayer } from '@applemusic-like-lyrics/vue'
import { t } from '@i18n'
import { onMounted, onUnmounted, ref, shallowRef, useTemplateRef, watch } from 'vue'

import { audioEngine } from '@core/audio'
import { convertToAMLL } from '@core/convert/amll'

import { collectPersist } from '@states/services/port'
import { useCoreStore, useRuntimeStore, useStaticStore } from '@states/stores'

import { tryRaf } from '@utils/tryRaf'

import { Button } from 'primevue'

import '@applemusic-like-lyrics/core/style.css'

const tt = t.editor.preview

const coreStore = useCoreStore()
const { progressComputed, playingComputed, amendedProgressComputed, seek } = audioEngine

const playerKey = ref(Symbol())
const playerRef = useTemplateRef('playerRef')
const amllLyricLines = shallowRef(convertToAMLL(collectPersist()))
watch(
  () => coreStore.lyricLines,
  () => (amllLyricLines.value = convertToAMLL(collectPersist())),
  { deep: true },
)

const jumpSeek = (line: any) => {
  const time = line?.line?.lyricLine?.startTime
  if (typeof time !== 'number') return
  seek(time)
  ;(playerRef.value?.lyricPlayer as DomLyricPlayer | undefined)?.resetScroll()
}

const runtimeStore = useRuntimeStore()
const staticStore = useStaticStore()
onMounted(() => runtimeStore.clearSelection())
onUnmounted(() => {
  if (coreStore.lyricLines.length === 0) return
  for (const [index, line] of coreStore.lyricLines.entries()) {
    if (line.endTime > progressComputed.value) {
      runtimeStore.selectLine(line)
      tryRaf(() => {
        if (!staticStore.editorHook) return
        else staticStore.editorHook.scrollTo(index, { align: 'center' })
        return true
      })
      return
    }
  }
  runtimeStore.selectLine(coreStore.lyricLines.at(-1)!)
  tryRaf(() => {
    if (!staticStore.editorHook) return
    else staticStore.editorHook.scrollTo(coreStore.lyricLines.length - 1, { align: 'end' })
    return true
  })
})

function passToPlayer(event: Event) {
  const playerEl = (playerRef.value?.lyricPlayer as DomLyricPlayer | undefined)?.getElement()
  if (!playerEl) return
  const newEvent = new (event.constructor as any)(event.type, event)
  playerEl.dispatchEvent(newEvent)
}
</script>

<style lang="scss">
.preview {
  padding: 0 1rem;
  position: relative;
  flex: 1;
  overflow: hidden;
  display: flex;
  justify-content: center;

  .preview-reload-button {
    position: absolute;
    bottom: 0.5rem;
    right: 1rem;
    z-index: 10;
  }

  & > .amll-lyric-player {
    max-width: 1200px;
    overflow-x: visible;
  }
}

.amll-lyric-player.dom {
  mask-image: linear-gradient(
    to bottom,
    transparent,
    black 2rem,
    black calc(100% - 2rem),
    transparent
  );
  font-weight: 500;
  line-height: 1.5;
  --bright-mask-alpha: 1;
  --dark-mask-alpha: 0.4;
  --amll-lp-font-size: max(max(4.5vh, 2.3vw), 3rem);
  --amll-lp-color: light-dark(var(--p-neutral-800), var(--p-neutral-100));
  --amll-lp-hover-bg-color: color-mix(in srgb, var(--amll-lp-color), transparent 95%);

  [class^='_lyricMainLine'] {
    font-weight: bold;
  }

  // Fix padding issue: letters like 'j' get cut off
  [class^='_emphasizeWrapper'] span {
    padding: 1em;
    margin: -1em;
  }

  [class^='_interludeDots']:not([style]) {
    display: none;
  }
}
</style>
