import Essentia from 'essentia.js'
import EssentiaWASM from 'essentia.js/dist/essentia-wasm.web.js'
import wasmUrl from 'essentia.js/dist/essentia-wasm.web.wasm?url'

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
  const wasmModule = await EssentiaWASM({
    locateFile: (file: string) => {
      if (file.endsWith('.wasm')) return wasmUrl
      return file
    },
  })
  ctx.postMessage({ type: 'INIT_COMPLETE' })
  return new Essentia(wasmModule)
}

