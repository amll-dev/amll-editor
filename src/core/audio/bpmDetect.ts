import { audioEngine } from '.'
import type { BPMDetectWorker } from './bpmDetect.worker'
import BPMWorker from './bpmDetect.worker?worker'

let workerInstance: BPMDetectWorker | null = null

function getWorker(): BPMDetectWorker {
  if (workerInstance) return workerInstance
  const worker = new BPMWorker()
  console.log('Loading BPM detection worker...')
  workerInstance = worker
  return workerInstance
}

async function resampleTo44100(audioBuffer: AudioBuffer): Promise<AudioBuffer> {
  if (audioBuffer.sampleRate === 44100) return audioBuffer
  const offlineCtx = new OfflineAudioContext(
    audioBuffer.numberOfChannels,
    Math.ceil(audioBuffer.duration * 44100),
    44100,
  )
  const source = offlineCtx.createBufferSource()
  source.buffer = audioBuffer
  source.connect(offlineCtx.destination)
  source.start(0)

  const rendered = await offlineCtx.startRendering()
  return rendered
}

export async function detectCurrentBpm() {
  console.log('Starting BPM detection...')
  const { audioBuffer } = audioEngine
  if (!audioBuffer) return
  const resampledBuffer = await resampleTo44100(audioBuffer)
  const resampledData = resampledBuffer.getChannelData(0)
  const worker = getWorker()
  return new Promise<{ bpm: number; reliableTick: number; offset: number } | null>((resolve) => {
    worker.onmessage = (ev) => {
      if (ev.data.type === 'INIT_COMPLETE') return
      console.log(ev.data)
      const bpm: number = Math.round(ev.data.bpm)
      const reliableTick: number = ev.data.reliableTick

      const interval = 60 / bpm
      const offset = reliableTick % interval

      resolve({
        bpm,
        reliableTick,
        offset,
      })
    }
    worker.postMessage({ audioDataArray: resampledData })
  })
}
