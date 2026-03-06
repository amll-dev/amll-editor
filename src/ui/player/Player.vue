<template>
  <Card class="player">
    <template #content>
      <KeepAlive>
        <Spectrogram v-if="showSpectrogram" class="spectrogram-view" />
      </KeepAlive>
      <div class="player-toolbar">
        <Button
          :icon="`mdi ${loading ? 'mdi-refresh' : 'mdi-folder-music-outline'}`"
          :disabled="loading"
          severity="secondary"
          @click="() => handleSelectFile()"
          v-tooltip="tipHotkey(tt.chooseAudioFile(), 'chooseMedia')"
        />
        <Button
          icon="mdi mdi-tune-vertical"
          severity="secondary"
          @click="tooglePopover"
          v-tooltip="tipMultiLine(tt.playOptions(), tt.playOptionsWheel())"
          @wheel="handlePopBtnWheel"
        />
        <Popover ref="popover"> <PopoverPane /> </Popover>
        <Button
          :icon="`mdi ${playingComputed ? 'mdi-pause' : 'mdi-play'}`"
          @click="audioEngine.togglePlay()"
          :disabled="!activatedRef"
          v-tooltip="tipHotkey(playingComputed ? tt.pause() : tt.play(), 'playPauseAudio')"
          ref="playPauseButton"
        />
        <ProgressTime />
        <Waveform />
        <Button
          icon="mdi mdi-chart-box-outline"
          :severity="showSpectrogram ? 'primary' : 'secondary'"
          @click="showSpectrogram = !showSpectrogram"
          v-tooltip="
            !compatibilityMap.sharedArrayBuffer
              ? tt.spectrogramUnavailable()
              : showSpectrogram
                ? tt.hideSpectrogram()
                : tt.showSpectrogram()
          "
          :disabled="!compatibilityMap.sharedArrayBuffer"
        />
      </div>
    </template>
  </Card>
</template>

<script setup lang="ts">
import { t } from '@i18n'
import { clamp } from 'lodash-es'
import { computed, ref, useTemplateRef } from 'vue'

import { audioEngine } from '@core/audio'
import { compatibilityMap } from '@core/compat'
import { fileBackend, possibleAudioExts } from '@core/file'
import { useGlobalKeyboard } from '@core/hotkey'

import { usePrefStore } from '@states/stores'

import { tipHotkey, tipMultiLine } from '@utils/generateTooltip'

import PopoverPane from './Popover.vue'
import ProgressTime from './ProgressTime.vue'
import Waveform from './Waveform.vue'
import Spectrogram from './spectrogram/Spectrogram.vue'
import { Button, Card, Popover, useToast } from 'primevue'

const tt = t.player

const { playingComputed, activatedRef } = audioEngine
const playPauseButton = useTemplateRef('playPauseButton')

const toast = useToast()

const isUserAbortError = (e: unknown) => {
  const err = e as Error
  return (
    err.message.includes('The user aborted a request') ||
    err.message.includes('is not allowed by the user agent')
  )
}
async function handleSelectFile() {
  try {
    loading.value = true
    const result = await fileBackend.read(
      'amll-editor-audio',
      [
        {
          description: tt.allSupportedFormats(),
          accept: { 'audio/*': possibleAudioExts.map((ext) => `.${ext}`) },
        },
      ],
      'music',
    )
    audioEngine.mount(new File([result.blob], result.filename))
    // loading will be set to false on audio loaded event
  } catch (e) {
    loading.value = false
    const detail = isUserAbortError(e) ? tt.failedToLoadAudio.detailAborted() : String(e)
    toast.add({
      severity: 'error',
      summary: tt.failedToLoadAudio.summary(),
      detail: detail,
      life: 3000,
    })
  }
}

const loading = ref(false)
audioEngine.onLoadStart(() => (loading.value = true))
audioEngine.onLoaded(() => {
  loading.value = false
  toast.add({
    severity: 'success',
    summary: tt.loadAudioSuccess(),
    detail: audioEngine.filenameComputed.value,
    life: 3000,
  })
})

useGlobalKeyboard('chooseMedia', () => handleSelectFile())
useGlobalKeyboard('playPauseAudio', () => {
  if (activatedRef.value) audioEngine.togglePlay()
  if (playPauseButton.value) ((playPauseButton.value as any).$el as HTMLButtonElement).focus()
})
useGlobalKeyboard('volumeDown', () => {
  audioEngine.volumeRef.value = Math.max(0, audioEngine.volumeRef.value - 0.1)
})
useGlobalKeyboard('volumeUp', () => {
  audioEngine.volumeRef.value = Math.min(1, audioEngine.volumeRef.value + 0.1)
})

const prefStore = usePrefStore()
const optimizedStep = computed(
  () => (prefStore.audioSeekingStepMs || 5000) * audioEngine.playbackRateRef.value,
)
useGlobalKeyboard('seekBackward', () => {
  audioEngine.seekBy(-optimizedStep.value)
})
useGlobalKeyboard('seekForward', () => {
  audioEngine.seekBy(optimizedStep.value)
})

const popover = useTemplateRef('popover')
const tooglePopover = (e: MouseEvent) => popover.value?.toggle(e)
function handlePopBtnWheel(e: WheelEvent) {
  if (!e.deltaY) return
  popover.value?.show(e)
  audioEngine.volumeRef.value = clamp(
    audioEngine.volumeRef.value - Math.sign(e.deltaY) * 0.05,
    0,
    1,
  )
}

const showSpectrogram = ref(false)
</script>

<style lang="scss">
.player {
  border: 1px solid color-mix(in srgb, var(--p-zinc-600), transparent 85%);
  overflow: hidden;
  margin: 0 0.5rem;
  display: flex;
  flex-direction: column;

  .p-card-body {
    padding: 0;
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .p-card-content {
    padding: 0;
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .player-toolbar {
    display: flex;
    gap: 0.5rem;
    padding: 0.5rem;
  }
}
</style>
