import nlp from 'compromise/tokenize'
import nlpSpeech from 'compromise-speech'
import type { LyricWord } from '@/stores/core'

export interface Rewrite {
  target: string
  indices: number[]
}
export type SplittedWord = string | (Partial<LyricWord> & { text: LyricWord['text'] })
export type Splitter = (
  strs: string[],
  rewrites: Readonly<Rewrite>[],
  caseSensitive: boolean,
) => SplittedWord[][] | Promise<SplittedWord[][]>

const pureLatin = `0-9A-Za-z\\u00C0-\\u00ff\\u0370-\\u03FF\\u0400-\\u04FF`
const halfwidthPunc = `'"‘’“”.,\\-/#!?$%^&*;:{}=\\-_\`~()`

export function basicSplitCore(strs: string[]): string[][] {
  const latin = pureLatin + halfwidthPunc
  const tokenReg = new RegExp(`[${latin}]+|\\s+|[^${latin}]`, 'gu')
  return strs.map((str) => str.match(tokenReg) || [])
}

export function basicSplit(
  strs: string[],
  rewrites: Readonly<Rewrite>[],
  caseSensitive: boolean,
  splitter?: (s: string) => string[],
): string[][] {
  if (!rewrites.length && !splitter) return basicSplitCore(strs)
  const tokenReg = new RegExp(`[${pureLatin}]+|[^${pureLatin}]+`, 'gu')
  const pureLatinReg = new RegExp(`[${pureLatin}]`)
  const isLatin = (s: string) => pureLatinReg.test(s)
  const rewriteMap = new Map<string, number[]>()
  for (const rw of rewrites) {
    const key = caseSensitive ? rw.target : rw.target.toLowerCase()
    rewriteMap.set(key, rw.indices)
  }
  return basicSplitCore(strs).map((str) =>
    str.flatMap((part) => {
      const split = part.match(tokenReg) || []
      const result: string[] = []
      for (const token of split) {
        const stickToLast = () => {
          if (result.length) {
            result[result.length - 1] += token
          } else result.push(token)
        }
        const handleSubparts = (subParts: string[]) => {
          if (subParts.length === 0) stickToLast()
          else {
            if (result.length) result[result.length - 1] += subParts.shift()!
            else result.push(subParts.shift()!)
            result.push(...subParts)
          }
        }
        if (!isLatin(token)) {
          if (token === '-') result.push(token)
          else stickToLast()
          continue
        }
        const key = caseSensitive ? token : token.toLowerCase()
        if (rewriteMap.has(key)) {
          const indices = rewriteMap.get(key)!
          const subParts = splitTextByIndices(token, indices)
          handleSubparts(subParts)
          continue
        }
        if (splitter) {
          const subParts = splitter(token)
          handleSubparts(subParts)
          continue
        }
        stickToLast()
      }
      return result
    }),
  )
}

export function compromiseSplitCore(nlp: any, token: string): string[] {
  const doc = nlp(token)
  const syllables = (doc.syllables() as string[][]).flat()
  if (syllables.length <= 1) return [token]
  let index = 0
  const intervals = syllables.map((syl) => {
    const left = token.substring(index)
    const match = left.toLowerCase().indexOf(syl.toLowerCase())
    const end = index + (match < 0 ? 0 : match) + syl.length
    const nextBegin = index
    index = end
    return { begin: nextBegin, end }
  })
  intervals.forEach((itv, index) => {
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
  })
  return intervals.map((itv) => token.substring(itv.begin, itv.end))
}

export function compromiseSplit(
  strs: string[],
  rewrites: Readonly<Rewrite>[],
  caseSensitive: boolean,
) {
  const nlpWithPlg = nlp.extend(nlpSpeech)
  return basicSplit(strs, rewrites, caseSensitive, (token) =>
    compromiseSplitCore(nlpWithPlg, token),
  )
}

let dictCache: Map<string, 0 | number[]> | null = null
export async function prosoticSplit(
  strs: string[],
  rewrites: Readonly<Rewrite>[],
  caseSensitive: boolean,
) {
  if (!dictCache) {
    const rawDict = (await fetch('/dicts/SUBTLEXus_prosotic.dict.json').then((res) =>
      res.json(),
    )) as Record<string, 0 | number[]>
    dictCache = new Map<string, 0 | number[]>(Object.entries(rawDict))
  }
  const dict = dictCache
  const nlpWithPlg = nlp.extend(nlpSpeech)
  return basicSplit(strs, rewrites, caseSensitive, (part) => {
    if (part.length === 0) return []
    const key = part.toLowerCase()
    if (dict.has(key)) {
      const lengths = dict.get(key)!
      if (!lengths) return [part]
      return splitTextByLengths(part, lengths)
    } else {
      return compromiseSplitCore(nlpWithPlg, part)
    }
  })
}

export function japaneseSplit(
  strs: string[],
  rewrites: Readonly<Rewrite>[],
  _caseSensitive: boolean,
) {
  const escapeReg = /[.*+?^${}()|[\]\\]/g
  const escapeString = (s: string) => s.replace(escapeReg, '\\$&')
  return strs.map((l) => {
    const line = l.trim()
    if (rewrites.length === 0) return splitTextLine(line)
    const rewriteReg = new RegExp(rewrites.map((rw) => escapeString(rw.target)).join('|'), 'g')
    const matches = line.matchAll(rewriteReg)
    const dividedLineParts: { text: string; isRewrite: boolean }[] = []
    let lastIndex = 0
    for (const match of matches) {
      const matchIndex = match.index!
      if (matchIndex > lastIndex) {
        dividedLineParts.push({
          text: line.slice(lastIndex, matchIndex),
          isRewrite: false,
        })
      }
      dividedLineParts.push({ text: match[0], isRewrite: true })
      lastIndex = matchIndex + match[0]!.length
    }
    if (lastIndex < line.length)
      dividedLineParts.push({ text: line.slice(lastIndex), isRewrite: false })
    const splittedParts = dividedLineParts.flatMap((part) =>
      part.isRewrite ? [part.text] : splitTextLine(part.text),
    )
    return splittedParts
  })

  function isCJK(char: string | undefined): char is string {
    if (!char) return false
    const code = char.charCodeAt(0)
    const cjkRanges: [number, number][] = [
      [0x4e00, 0x9fff],
      [0x3040, 0x309f],
      [0x30a0, 0x30ff],
    ]
    return char === '々' || cjkRanges.some(([s, e]) => code >= s && code <= e)
  }
  function isPunctuation(char: string | undefined): char is string {
    if (!char) return false
    const code = char.charCodeAt(0)
    return (
      (code >= 0x2000 && code <= 0x206f) ||
      (code >= 0x3000 && code <= 0x303f) ||
      /[.,!?，。！？、「」『』]/.test(char)
    )
  }
  function isJapaneseYoonOrSokuon(char: string | undefined): char is string {
    if (!char) return false
    const yoon = 'ャュョゃゅょン'
    const sokuon = 'ッっ'
    return yoon.includes(char) || sokuon.includes(char)
  }
  function splitTextLine(line: string): string[] {
    if (!line.trim()) return [line]
    const chars = [...line]
    const tokens: string[] = []
    while (chars.length) {
      const currToken: string[] = []
      if (chars.length === line.length && isPunctuation(chars[0])) {
        currToken.push(chars.shift()!)
        if (isCJK(chars[0])) {
          currToken.push(chars.shift()!)
          if (isJapaneseYoonOrSokuon(chars[0])) currToken.push(chars.shift()!)
          while (isPunctuation(chars[0])) currToken.push(chars.shift()!)
        } else {
          while (chars.length && !isPunctuation(chars[0]) && !/\s/.test(chars[0]!))
            currToken.push(chars.shift()!)
        }
        tokens.push(currToken.join(''))
        continue
      }
      if (isCJK(chars[0])) {
        currToken.push(chars.shift()!)
        if (isJapaneseYoonOrSokuon(chars[0])) currToken.push(chars.shift()!)
        while (isPunctuation(chars[0])) currToken.push(chars.shift()!)
        tokens.push(currToken.join(''))
        continue
      }
      while (chars.length && !/\s/.test(chars[0]!) && !isPunctuation(chars[0]) && !isCJK(chars[0]))
        currToken.push(chars.shift()!)
      while (chars.length && isPunctuation(chars[0])) currToken.push(chars.shift()!)
      if (currToken.length) tokens.push(currToken.join(''))
      if (chars.length && /\s/.test(chars[0]!)) tokens.push(chars.shift()!)
    }
    return tokens
  }
}

//#region utils
function splitTextByIndices(orignal: string, indices: number[]): string[] {
  let lastIndex = 0
  const partResult = []
  for (const index of indices) {
    partResult.push(orignal.slice(lastIndex, index))
    lastIndex = index
  }
  partResult.push(orignal.slice(lastIndex))
  return partResult
}
function splitTextByLengths(orignal: string, lengths: number[]): string[] {
  const indices: number[] = [...lengths]
  for (let i = 1; i < indices.length; i++) indices[i]! += indices[i - 1] ?? 0
  return splitTextByIndices(orignal, indices)
}
//#endregion
