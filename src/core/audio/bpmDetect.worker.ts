import Essentia from 'essentia.js'
import EssentiaWASM from 'essentia.js/dist/essentia-wasm.es.js'
import wasmUrl from 'essentia.js/dist/essentia-wasm.web.wasm?url'

import { pairwise } from '@utils/pairwise'

export type BPMDetectWorkerRequest = { audioData: Float32Array; sampleRate: number }
export type BPMDetectWorkerResponse =
  | { type: 'INIT_COMPLETE' }
  | { type: 'DETECT_COMPLETE'; bpm: number; offset: number }
  | { type: 'ERROR'; message: string }

export interface BPMDetectWorker extends Omit<Worker, 'postMessage'> {
  postMessage(message: BPMDetectWorkerRequest, transfer?: Transferable[]): void
}

type BPMDetectWorkerScope = Omit<DedicatedWorkerGlobalScope, 'postMessage' | 'onmessage'> & {
  postMessage(message: BPMDetectWorkerResponse, transfer?: Transferable[]): void
  onmessage: ((this: BPMDetectWorkerScope, ev: MessageEvent<BPMDetectWorkerRequest>) => void) | null
}
const ctx: BPMDetectWorkerScope = self as BPMDetectWorkerScope

let essentiaInstance: Essentia | null = null

async function getEssentia() {
  if (!essentiaInstance) essentiaInstance = await createEssentia()
  return essentiaInstance
}
async function createEssentia() {
  console.log('Initializing Essentia WASM...')
  console.log(Essentia)
  const wasmModule = await EssentiaWASM({
    locateFile: (file: string) => {
      if (file.endsWith('.wasm')) return wasmUrl
      return file
    },
  })
  ctx.postMessage({ type: 'INIT_COMPLETE' })
  console.log('Essentia WASM initialized')
  return new Essentia(wasmModule)
}

function sliceAudio(data: Float32Array, sampleRate: number, durationSec = 30, offsetRatio = 0.3) {
  const totalSec = data.length / sampleRate
  if (totalSec <= durationSec) return { buffer: data, start: 0 }

  const length = Math.floor(durationSec * sampleRate)
  let start = Math.floor(data.length * offsetRatio)
  let end = start + length
  if (end > data.length) {
    end = data.length
    start = end - length
  }
  return { buffer: data.subarray(start, end), start }
}

function getMainInterval(ticks: number[]) {
  const hist = new Map<string, number>()
  for (const [lastTick, tick] of pairwise(ticks)) {
    const dt = (tick - lastTick).toFixed(4)
    hist.set(dt, (hist.get(dt) || 0) + 1)
  }
  let bestDt = 0
  let bestCount = 0
  for (const [dt, count] of hist) {
    if (count > bestCount) {
      bestDt = Number(dt)
      bestCount = count
    }
  }
  return bestDt
}

function estimateOffset(ticks: number[], interval: number) {
  if (!ticks.length) return 0
  const first = ticks[0]!
  const offset = first % interval
  return offset
}

ctx.onmessage = async (ev) => {
  try {
    console.log('Received BPM detection request')
    const { audioData, sampleRate } = ev.data
    const essentia = await getEssentia()
    const slice1 = sliceAudio(audioData, sampleRate, 120, 0.05)

    const bpmResult = essentia.PercivalBpmEstimator(
      essentia.arrayToVector(slice1.buffer),
      1024,
      2048,
      128,
      128,
      210,
      50,
      sampleRate,
    )
    console.log('BPM estimation result:', bpmResult)
    let bpm = bpmResult.bpm
    const decimal = (bpm * 100) % 100
    if (decimal >= 40 && decimal <= 60) bpm *= 2
    if (bpm > 160) bpm /= 2

    const slice2 = sliceAudio(audioData, sampleRate, 75, 0.3)
    const tracker = essentia.BeatTrackerMultiFeature(
      essentia.arrayToVector(slice2.buffer),
      Math.floor(bpm + 10),
      Math.floor(bpm - 10),
    )
    const ticksFloat32Arr = essentia.vectorToArray(tracker.ticks)
    const ticks = Array.from(ticksFloat32Arr)
    const interval = getMainInterval(ticks)
    const offset = estimateOffset(ticks, interval)
    console.log('Beat tracking result:', { ticks, interval, offset })
    ctx.postMessage({
      type: 'DETECT_COMPLETE',
      bpm,
      offset,
    })
  } catch (err: any) {
    ctx.postMessage({
      type: 'ERROR',
      message: err?.message || String(err),
    })
    console.error('Error in BPM detection worker:', err)
  }
}
