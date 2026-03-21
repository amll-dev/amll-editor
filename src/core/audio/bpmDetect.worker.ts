import { EssentiaWASM } from 'essentia.js/dist/essentia-wasm.es.js'
import Essentia from 'essentia.js/dist/essentia.js-core.es.js'

import { pairwise } from '@utils/pairwise'

export type BPMDetectWorkerRequest = { audioDataArray: Float32Array }
export type BPMDetectWorkerResponse =
  | { type: 'INIT_COMPLETE' }
  | { type: 'DETECT_COMPLETE'; bpm: number; reliableTick: number }
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
  const hist = new Map<number, number>()
  const dtTickMap = new Map<number, number[]>()
  const precision = 1e5
  for (const [lastTick, tick] of pairwise(ticks)) {
    const dt = Math.round((tick - lastTick) * precision)
    hist.set(dt, (hist.get(dt) || 0) + 1)
    const arr = dtTickMap.get(dt)
    if (arr) arr.push(tick)
    else dtTickMap.set(dt, [tick])
  }
  let bestDt = 0
  let bestCount = 0
  for (const [dt, count] of hist) {
    if (count > bestCount) {
      bestDt = dt
      bestCount = count
    }
  }
  return { interval: bestDt / precision, ticks: dtTickMap.get(bestDt)! }
}

function findLongestContinousBest(ticks: number[], bestTicks: number[]) {
  const isInBestTicks = (tick: number, eps = 1e-6) =>
    bestTicks.some((t) => Math.abs(t - tick) < eps)
  const groups: number[][] = []
  for (const [i, tick] of ticks.entries()) {
    if (!isInBestTicks(tick)) continue
    const group = [tick]
    let keep = 0
    while (true) {
      keep++
      const idx = i + keep
      if (idx >= ticks.length) break
      const next = ticks[idx]!
      if (!isInBestTicks(next)) break
      group.push(next)
    }
    groups.push(group)
  }
  groups.sort((a, b) => b.length - a.length)
  return groups[0] ?? []
}

function detectBPM(audioData: Float32Array, sampleRate: number, debug = false) {
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
  if (debug) console.log('BPM estimation result:', bpmResult)
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
  const bestContinuousTicks = findLongestContinousBest(ticks, bestTicks)
  if (debug) {
    console.log('Beat tracking ticks:', ticks)
    console.log('Best interval:', interval, 'Best ticks:', bestTicks)
    console.log('Best continuous ticks:', bestContinuousTicks)
  }
  const firstTick = bestContinuousTicks[0] ?? ticks[0] ?? 0
  const reliableTick = firstTick + slice2.start / sampleRate
  if (debug) console.log('Beat tracking result:', { ticks, interval, reliableTick })
  return {
    type: 'DETECT_COMPLETE',
    bpm: estimatedBpm,
    reliableTick,
  } as const
}

ctx.onmessage = async (ev) => {
  try {
    const { audioDataArray } = ev.data
    const result = detectBPM(audioDataArray, 44100)
    ctx.postMessage(result)
  } catch (err: any) {
    ctx.postMessage({
      type: 'ERROR',
      message: err?.message || String(err),
    })
    console.error('Error in BPM detection worker:', err)
  }
}
