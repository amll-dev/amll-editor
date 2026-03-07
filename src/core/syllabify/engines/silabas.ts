import silabas from 'silabas'

import type { Syllabify as SL } from '..'
import { basicSplit } from './basic'

export const silabasSplit = async (
  strs: string[],
  rewrites: Readonly<SL.Rewrite>[],
  caseSensitive: boolean,
) =>
  basicSplit(strs, rewrites, caseSensitive, (token) => {
    try {
      return silabas(token).syllables()
    } catch {
      return [token]
    }
  })
