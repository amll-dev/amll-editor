import type { Syllabify as SL } from '..'

import syllabify from 'syllabify'
import { basicSplit } from './basic'

export const syllabifySplit = async (
  strs: string[],
  rewrites: Readonly<SL.Rewrite>[],
  caseSensitive: boolean,
) =>
  basicSplit(strs, rewrites, caseSensitive, (token) => {
    try {
      return syllabify(token)
    } catch {
      return [token]
    }
  })
