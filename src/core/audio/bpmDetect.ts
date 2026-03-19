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

export async function detectCurrentBpm() {
  console.log('Starting BPM detection...')
  const { audioBuffer } = audioEngine
  if (!audioBuffer) return null
  const { sampleRate } = audioBuffer
  const audioData = audioBuffer.getChannelData(0)
  console.log('Audio data extracted, sample rate:', sampleRate, 'data length:', audioData.length)
  const worker = getWorker()
  return new Promise<{ bpm: number; offset: number } | null>((resolve) => {
    worker.onmessage = (ev) => {
      if (ev.data.type === 'INIT_COMPLETE') return
      console.log(ev.data)
      resolve({
        bpm: ev.data.bpm,
        offset: ev.data.offset,
      })
    }
    worker.postMessage({ audioData, sampleRate })
  })
}
