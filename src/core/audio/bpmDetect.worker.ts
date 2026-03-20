import { EssentiaWASM } from 'essentia.js/dist/essentia-wasm.es.js'
import Essentia from 'essentia.js/dist/essentia.js-core.es.js'

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

const essentia = new Essentia(EssentiaWASM)
ctx.postMessage({ type: 'INIT_COMPLETE' })

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
  const dtTickMap = new Map<number, number[]>()
  for (const [lastTick, tick] of pairwise(ticks)) {
    const dt = (tick - lastTick).toFixed(5)
    hist.set(dt, (hist.get(dt) || 0) + 1)
    const arr = dtTickMap.get(Number(dt)) || []
    arr.push(tick)
    dtTickMap.set(Number(dt), arr)
  }
  let bestDt = 0
  let bestCount = 0
  for (const [dt, count] of hist) {
    if (count > bestCount) {
      bestDt = Number(dt)
      bestCount = count
    }
  }
  return { interval: bestDt, ticks: dtTickMap.get(bestDt) || [] }
}

function estimateOffset(ticks: number[], bpm: number) {
  if (!ticks.length) return 0
  const first = ticks[0]!
  const interval = 60 / bpm
  const offset = first % interval
  return offset
}

ctx.onmessage = async (ev) => {
  try {
    console.log('Received BPM detection request')
    const { audioData, sampleRate } = ev.data
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
    let rawBpm = bpmResult.bpm
    const decimal = (rawBpm * 100) % 100
    if (decimal >= 40 && decimal <= 60) rawBpm *= 2
    if (rawBpm > 160) rawBpm /= 2
    const estimatedBpm = rawBpm
    const slice2 = sliceAudio(audioData, sampleRate, 75, 0.3)
    const tracker = essentia.BeatTrackerMultiFeature(
      essentia.arrayToVector(slice2.buffer),
      Math.floor(estimatedBpm + 10),
      Math.floor(estimatedBpm - 10),
    )
    const ticksFloat32Arr = essentia.vectorToArray(tracker.ticks)
    const ticks = Array.from(ticksFloat32Arr)
    const { interval, ticks: bestTicks } = getMainInterval(ticks)
    const offset = estimateOffset(bestTicks, estimatedBpm)
    console.log('Beat tracking result:', { ticks, interval, offset })
    ctx.postMessage({
      type: 'DETECT_COMPLETE',
      bpm: estimatedBpm,
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
