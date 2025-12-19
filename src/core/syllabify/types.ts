import type { LyricWord } from '@core/types'
import type { Prettify } from '@utils/types'

export namespace Syllabify {
  export interface Rewrite {
    target: string
    indices: number[]
  }
  export type SplittedWord = string | Prettify<Partial<LyricWord> & { text: LyricWord['text'] }>
  export type Splitter = (
    strs: string[],
    rewrites: Readonly<Rewrite>[],
    caseSensitive: boolean,
  ) => SplittedWord[][] | Promise<SplittedWord[][]>

  export interface Engine {
    name: string
    description?: string
    notRecommend?: boolean
    processor: Splitter
  }
}
