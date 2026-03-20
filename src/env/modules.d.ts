declare module 'syllabify' {
  function split(word: string): string[]
  export default split
}

declare module 'save-file' {
  function saveFile(blob: Blob, filename: string): Promise<void>
  export default saveFile
}

declare module 'silabas' {
  class Silabas {
    constructor(word: string)
    positions(): number[]
    syllables(): string[]
  }
  export default function silabas(word: string): Silabas
}

declare module 'essentia.js/dist/essentia.js-core.es.js' {
  export type VectorFloat = { $$: object }
  export default class Essentia {
    constructor(module: WebAssembly.Module, isDebug?: boolean)
    version: string
    algorithmNames: string[]

    /** Convert an input JS array into VectorFloat type */
    arrayToVector(arr: Float32Array): VectorFloat
    /** Convert an input VectorFloat array into typed JS Float32Array */
    vectorToArray(vec: VectorFloat): Float32Array

    /**
     * This algorithm estimates the tempo in beats per minute (BPM) from an input signal.
     *
     * @param signal input signal
     * @param frameSize frame size for the analysis of the input signal
     * @param frameSizeOSS frame size for the analysis of the Onset Strength Signal
     * @param hopSize hop size for the analysis of the input signal
     * @param hopSizeOSS hop size for the analysis of the Onset Strength Signal
     * @param maxBPM maximum BPM to detect
     * @param minBPM minimum BPM to detect
     * @param sampleRate the sampling rate of the audio signal [Hz]
     *
     * @see https://mtg.github.io/essentia.js/docs/api/Essentia#PercivalBpmEstimator
     */
    PercivalBpmEstimator(
      signal: VectorFloat,
      frameSize?: number,
      frameSizeOSS?: number,
      hopSize?: number,
      hopSizeOSS?: number,
      maxBPM?: number,
      minBPM?: number,
      sampleRate?: number,
    ): {
      /** the tempo estimation [bpm] */
      bpm: number
    }

    /**
     * This algorithm estimates the beat positions given an input signal.
     *
     * @param signal the audio input signal
     * @param maxBpm the fastest tempo to detect [bpm]
     * @param minBpm the slowest tempo to detect [bpm]
     *
     * @see https://mtg.github.io/essentia.js/docs/api/Essentia#BeatTrackerMultiFeature
     */
    BeatTrackerMultiFeature(
      signal: VectorFloat,
      maxBpm: number,
      minBpm: number,
    ): { ticks: VectorFloat }
  }
}
declare module 'essentia.js/dist/essentia-wasm.es.js' {
  export const EssentiaWASM: WebAssembly.Module
}
