import nlpSpeech from 'compromise-speech'
import nlp from 'compromise/tokenize'

import type { Syllabify as SL } from '..'
import { splitTextByLengths } from '../shared'
import { basicSplit } from './basic'
import { compromiseSplitCore } from './compromise'

type DictEntry = number | number[]

let dictCache: Map<string, DictEntry> | null = null
export async function prosoticSplit(
  strs: string[],
  rewrites: Readonly<SL.Rewrite>[],
  caseSensitive: boolean,
) {
  if (!dictCache) {
    const rawDict = (await fetch('/dicts/SUBTLEXus_prosotic.dict.json').then((res) =>
      res.json(),
    )) as Record<string, DictEntry>
    dictCache = new Map<string, DictEntry>(Object.entries(rawDict))
  }
  const dict = dictCache
  const nlpWithPlg = nlp.extend(nlpSpeech)
  return basicSplit(strs, rewrites, caseSensitive, (part) => {
    if (part.length === 0) return []
    const key = part.toLowerCase()
    if (dict.has(key)) return splitByDict(part, dict.get(key)!)
    if (key.endsWith('in')) {
      // handle g dropping cases like "runnin", "singin"
      const altKey = key + 'g'
      if (dict.has(altKey)) return splitByDict(key, dict.get(altKey)!)
    }
    return compromiseSplitCore(nlpWithPlg, part)
  })
  function splitByDict(word: string, entry: DictEntry) {
    if (!entry) return [word]
    const lengthsArr = typeof entry === 'number' ? [entry] : entry
    return splitTextByLengths(word, lengthsArr)
  }
}
