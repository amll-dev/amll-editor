import type { Syllabify as SL } from '..'
import { splitTextByIndices } from '../shared'

const pureLatin = `0-9A-Za-z\\u00C0-\\u00ff\\u0370-\\u03FF\\u0400-\\u04FF`
const halfwidthPunc = `'"‘’“”.,\\-/#!?¿¡$%^&*;:{}=\\-_\`~()`
const frontAssocPunc = `，。？！；：）】］｝〉》」』〗］）»`
const backAssocPunc = `（【［｛〈《「『〖〔［（«`

function basicSplitCore(strs: string[]): string[][] {
  const latin = pureLatin + halfwidthPunc
  const tokenReg = new RegExp(`[${latin}]+|\\s+|[^${latin}]`, 'gu')
  return strs.map((str) => str.match(tokenReg) || [])
}

export function basicSplit(
  strs: string[],
  rewrites: Readonly<SL.Rewrite>[],
  caseSensitive: boolean,
  splitter?: (s: string) => string[],
): string[][] {
  const tokenReg = new RegExp(`[${pureLatin}]+|[^${pureLatin}]+`, 'gu')
  const pureLatinReg = new RegExp(`[${pureLatin}]`)
  const isLatin = (s: string) => pureLatinReg.test(s)
  const isFrontAssocPunc = (s: string) => s.length === 1 && frontAssocPunc.includes(s)
  const isBackAssocPunc = (s: string) => s.length === 1 && backAssocPunc.includes(s)
  const rewriteMap = new Map<string, number[]>()
  for (const rw of rewrites) {
    const key = caseSensitive ? rw.target : rw.target.toLowerCase()
    rewriteMap.set(key, rw.indices)
  }
  return basicSplitCore(strs)
    .map((lineParts) =>
      lineParts.flatMap((part) => {
        const split = part.match(tokenReg) || []
        const partResult: string[] = []
        for (const token of split) {
          const stickToLast = () => {
            if (partResult.length) {
              partResult[partResult.length - 1] += token
            } else partResult.push(token)
          }
          const handleSubparts = (subParts: string[]) => {
            if (subParts.length === 0) stickToLast()
            else {
              if (partResult.length) partResult[partResult.length - 1] += subParts.shift()!
              else partResult.push(subParts.shift()!)
              partResult.push(...subParts)
            }
          }
          if (!isLatin(token)) {
            if (token === '-') partResult.push(token)
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
            handleSubparts([...subParts])
            continue
          }
          stickToLast()
        }
        return partResult
      }),
    )
    .map((line: string[]): string[] => {
      const merged: string[] = []
      let shouldMergeToLast = false
      const mergeToLast = (s: string) =>
        merged.length ? (merged[merged.length - 1] += s) : merged.push(s)
      for (const token of line) {
        if (isFrontAssocPunc(token)) {
          mergeToLast(token)
        } else if (isBackAssocPunc(token)) {
          shouldMergeToLast = true
          merged.push(token)
        } else {
          if (shouldMergeToLast) mergeToLast(token)
          else merged.push(token)
          shouldMergeToLast = false
        }
      }
      return merged
    })
}
