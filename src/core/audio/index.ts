import { computed, readonly, ref, shallowRef, watch } from 'vue'

import { usePrefStore } from '@states/stores'

import { provideListener } from '@utils/provideListener'

import metronomeAudioUrl from '@assets/audio/druminfected_metronome.wav?url'

import { useNcmResolver } from './ncm'

const audioEl = new Audio()
const metronomeAudioEls = Array.from({ length: 5 }, () => {
  const el = new Audio(metronomeAudioUrl)
  el.preload = 'auto'
  return el
})
let revokeMetronomeHook: (() => void) | null = null
let revokeUrlHook: (() => void) | null = null
const activatedRef = ref(false)
const lengthRef = ref(0)
const audioBufferRef = shallowRef<AudioBuffer | null>(null)
const rawFileRef = shallowRef<File | null>(null)
const filenameRef = ref<string | undefined>(undefined)
const metronomeEnabledRef = ref(false)
const metronomeVolumeRef = ref(0.5)
const metronomeBpmRef = ref(120)
const metronomeOffsetRef = ref(0)

const { on: onLoaded, off: offLoaded, _dispatch: _dispatchLoaded } = provideListener()
const { on: onLoadStart, off: offLoadStart, _dispatch: _dispatchLoadStart } = provideListener()

function maintainMediaSession() {
  if (!('mediaSession' in navigator)) return
  navigator.mediaSession.metadata = new MediaMetadata({
    title: filenameRef.value ?? 'Unknown',
    artist: __APP_DISPLAY_NAME__,
    album: '',
    artwork: [],
  })
  navigator.mediaSession.setActionHandler('previoustrack', () => {
    seek(0)
  })
}

//#region File
function mount(src: File) {
  _dispatchLoadStart()
  rawFileRef.value = src
  if (src.name.endsWith('.ncm')) _mountNcm(src)
  else _mount(src)
}

async function _mountNcm(src: File) {
  rawFileRef.value = src
  const ncmResolver = useNcmResolver()
  const extractedBlob = await ncmResolver.transform(src)
  _mount(extractedBlob, src.name)
  ncmResolver.destroy()
}

function _mount(src: Blob, filename: string): void
function _mount(src: File): void
function _mount(src: Blob | File, filename?: string): void {
  audioEl.pause()
  audioEl.currentTime = 0
  audioEl.playbackRate = 1
  audioEl.volume = 1
  filenameRef.value = filename ?? (src instanceof File ? src.name : undefined)
  revokeUrlHook?.()
  revokeMetronomeHook?.()
  const objUrl = URL.createObjectURL(src)
  revokeUrlHook = () => {
    URL.revokeObjectURL(objUrl)
    revokeUrlHook = null
  }
  audioEl.addEventListener(
    'loadedmetadata',
    async () => {
      const srcBuffer = await src.arrayBuffer()
      const decoded = await new AudioContext().decodeAudioData(srcBuffer)
      audioBufferRef.value = decoded
      lengthRef.value = Math.round(audioEl.duration * 1000)
      activatedRef.value = true
      progressRef.value = 0
      playingRef.value = false
      audioEl.playbackRate = playbackRateRef.value
      audioEl.volume = volumeRef.value
      maintainMediaSession()
      _dispatchLoaded()
    },
    { once: true },
  )
  audioEl.src = objUrl
}
//#endregion

//#region Playback
const seek = (time: number) => (audioEl.currentTime = time / 1000)
const seekBy = (delta: number) => {
  delta /= 1000
  const target = Math.min(Math.max(0, audioEl.currentTime + delta), audioEl.duration)
  audioEl.currentTime = target
}
const getProgress = () => Math.round(audioEl.currentTime * 1000)
const getPreciseProgress = () => audioEl.currentTime * 1000
const progressRef = ref(0)
const maintainProgressRef = () => {
  progressRef.value = getProgress()
  if (!audioEl.paused) requestAnimationFrame(maintainProgressRef)
}
audioEl.onseeked = () => (progressRef.value = getProgress())
const amendmentComputed = computed(() =>
  !playingRef.value ? 0 : usePrefStore().globalLatencyMs * playbackRateRef.value,
)
const amendedProgressComputed = computed(() =>
  Math.min(Math.max(0, progressRef.value - amendmentComputed.value), lengthRef.value),
)

/**
 * Media playback in browsers is not idempotent — calling `audio.play()` or
 * `audio.pause()` repeatedly can trigger unstable behavior (especially on
 * Firefox/Linux), including aborted media fetches and rapid play/pause loops.
 * Always check the current state.
 */
const play = () => {
  if (audioEl.src && audioEl.paused) audioEl.play()
}
const pause = () => {
  if (audioEl.src && !audioEl.paused) audioEl.pause()
}
const togglePlay = () => {
  if (!audioEl.src) return
  if (audioEl.paused) audioEl.play()
  else audioEl.pause()
}

const playingRef = ref(false)
audioEl.onplay = () => {
  playingRef.value = true
  maintainProgressRef()
}
audioEl.onpause = () => (playingRef.value = false)

const _volume = ref(audioEl.volume)
audioEl.onvolumechange = () => {
  _volume.value = audioEl.volume
}
const volumeRef = computed({
  get: () => _volume.value,
  set: (v: number) => {
    v = Math.min(Math.max(0, v), 1)
    if (v !== audioEl.volume) audioEl.volume = v
  },
})

const _playbackRate = ref(audioEl.playbackRate)
audioEl.onratechange = () => {
  _playbackRate.value = audioEl.playbackRate
}
const playbackRateRef = computed({
  get: () => _playbackRate.value,
  set: (v: number) => {
    if (v !== audioEl.playbackRate) audioEl.playbackRate = v
  },
})
//#endregion

//#region Metronome

function mountMetronome(bpm: number, offset: number) {
  metronomeEnabledRef.value = true
  metronomeBpmRef.value = bpm
  metronomeOffsetRef.value = offset
  if (revokeMetronomeHook) return
  let lastProgress = audioEl.currentTime
  let counter = 0
  function onProgress() {
    const progress = audioEl.currentTime
    const interval = 60 / metronomeBpmRef.value
    if (
      Math.floor((lastProgress - metronomeOffsetRef.value) / interval) !==
      Math.floor((progress - metronomeOffsetRef.value) / interval)
    ) {
      counter = (counter + 1) % metronomeAudioEls.length
      const metronomeAudioEl = metronomeAudioEls[counter]!
      metronomeAudioEl.currentTime = 0
      metronomeAudioEl.volume = metronomeVolumeRef.value
      metronomeAudioEl.play()
    }
    lastProgress = progress
  }
  const unwatchHandle = watch(progressRef, onProgress)
  revokeMetronomeHook = () => {
    unwatchHandle()
    revokeMetronomeHook = null
    metronomeEnabledRef.value = false
  }
}
//#endregion

const destroy = () => {
  audioEl.pause()
  revokeUrlHook?.()
  revokeMetronomeHook?.()
  audioEl.src = ''
  activatedRef.value = false
  progressRef.value = 0
  playingRef.value = false
  audioBufferRef.value = null
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = null
  }
}

export const audioEngine = {
  audioEl: audioEl,
  onLoaded,
  offLoaded,
  onLoadStart,
  offLoadStart,
  mount,
  mountMetronome,
  unmountMetronome: () => revokeMetronomeHook?.(),
  play,
  pause,
  togglePlay,
  seek,
  seekBy,
  getProgress,
  getPreciseProgress,
  /** Readonly: use `seek` to change */
  progressComputed: readonly(progressRef),
  lengthComputed: readonly(lengthRef),
  amendmentComputed,
  amendedProgressComputed,
  /** Readonly: use `play`, `pause`, `togglePlay` to change */
  playingComputed: readonly(playingRef),
  volumeRef,
  playbackRateRef,
  activatedRef,
  get audioBuffer() {
    return audioBufferRef.value
  },
  audioBufferComputed: readonly(audioBufferRef),
  filenameComputed: readonly(filenameRef),
  rawFileComputed: readonly(rawFileRef),
  metronomeBpmRef,
  metronomeOffsetRef,
  destroy,
}
