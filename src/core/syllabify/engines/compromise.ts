import nlpSpeech from 'compromise-speech'
import nlp from 'compromise/tokenize'

import type { Syllabify as SL } from '..'
import { basicSplit } from './basic'

export function compromiseSplitCore(nlp: any, token: string): string[] {
  const doc = nlp(token)
  const syllables = (doc.syllables() as string[][]).flat()
  if (syllables.length <= 1) return [token]
  let index = 0
  const intervals = syllables.map((syl) => {
    const left = token.slice(Math.max(0, index))
    const match = left.toLowerCase().indexOf(syl.toLowerCase())
    const end = index + (Math.max(match, 0)) + syl.length
    const nextBegin = index
    index = end
    return { begin: nextBegin, end }
  })
  for (const [index, itv] of intervals.entries()) {
    if (index === intervals.length - 1) itv.end = token.length
    else {
      const nextItv = intervals[index + 1]!
      itv.end = nextItv.begin
      if (/['’]/.test(token.charAt(itv.end - 1))) {
        // move the apostrophe to next syllable
        itv.end -= 1
        nextItv.begin -= 1
      }
    }
    if (index === 0) itv.begin = 0
  }
  return intervals.map((itv) => token.slice(itv.begin, itv.end))
}

export function compromiseSplit(
  strs: string[],
  rewrites: Readonly<SL.Rewrite>[],
  caseSensitive: boolean,
) {
  const nlpWithPlg = nlp.extend(nlpSpeech)
  return basicSplit(strs, rewrites, caseSensitive, (token) =>
    compromiseSplitCore(nlpWithPlg, token),
  )
}
