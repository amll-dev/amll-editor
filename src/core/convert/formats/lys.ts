import type { LyricLine, LyricSyllable, Persist } from '@core/types'

import { coreCreate } from '@states/stores/core'

import type { Convert as CV } from '../types'

// Lyricify Syllable (LYS) parser and stringifier
// Lyricify Syllable is a proprietary format used by Lyricify
// Supports syllable-level timestamps, background lyrics, and duet lyrics
// See: https://github.com/WXRIW/Lyricify-App/blob/main/docs/Lyricify%204/Lyrics.md#lyricify-syllable-%E6%A0%BC%E5%BC%8F%E8%A7%84%E8%8C%83

// Format:
// [property]Word (start,duration)word(start,duration)

// Property is an integer representing the lyric type:
// 0: unset
// 1: align left
// 2: align right (duet)
// 3: not background; align unset
// 4: not background; align left
// 5: not background; align right (duet)
// 6: background; align unset
// 7: background; align left
// 8: background; align right (duet)

// Example:
// [0]Lately (358,1336)I've (1694,487)been, (2181,673)I've (2854,268)been (3122,280)losing (3402,345)sleep(3747,1186)
// [0]Dreaming (5245,696)about (5941,471)the (6412,306)things (6718,458)that (7176,292)we (7468,511)could (7979,393)be(8372,737)

export const lysReg: CV.FormatHandler = {
  parser: parseLYS,
  stringifier: stringifyLYS,
}

function parseProp(prop: number): { duet: boolean; background: boolean } {
  if (prop < 0 || prop > 8) prop = 0 // unkown property values, treat as 0
  return {
    duet: prop % 3 === 2,
    background: prop >= 6,
  }
}
export function parseLYS(lrc: string): Persist {
  const lines = lrc
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
  const lyricLines: LyricLine[] = []
  const getSpaceSyl = () => coreCreate.newSyllable({ text: ' ' })
  lines.forEach((lineStr) => {
    const propMatch = lineStr.match(/^\[(\d+)\](.*)$/)
    if (!propMatch) return
    const [, propStr, content] = propMatch
    const syllables: LyricSyllable[] = []
    const props = parseProp(Number(propStr))
    ;[...content!.matchAll(/(.*?)\((\d+),(\d+)\)/g)].forEach(([, word, startStr, durStr]) => {
      const startTime = Number(startStr)
      const duration = Number(durStr)
      const endTime = startTime + duration
      const srcText = word!
      const text = srcText.trim()
      if (srcText.startsWith(' ') && syllables.at(-1)?.text !== ' ') syllables.push(getSpaceSyl())
      syllables.push(coreCreate.newSyllable({ text, startTime, endTime }))
      if (srcText.endsWith(' ')) syllables.push(getSpaceSyl())
    })
    const lineStartTime = syllables[0]?.startTime ?? 0
    const lineEndTime = syllables.at(-1)?.endTime ?? 0
    if (props.background && syllables.length) {
      syllables[0]!.text = syllables[0]!.text.replace(/^\(/, '')
      syllables.at(-1)!.text = syllables.at(-1)!.text.replace(/\)$/, '')
    }
    lyricLines.push(
      coreCreate.newLine({
        startTime: lineStartTime,
        endTime: lineEndTime,
        ...props,
        syllables,
      }),
    )
  })
  return {
    metadata: {},
    lines: lyricLines,
  }
}

function getPropMaker(allLines: LyricLine[]) {
  const hasDuet = allLines.some((l) => l.duet)
  const hasBackground = allLines.some((l) => l.background)
  return (line: LyricLine) => {
    let prop = 0
    if (hasDuet) prop += line.duet ? 2 : 1
    if (hasBackground) prop += line.background ? 6 : 3
    return prop
  }
}
export function stringifyLYS(data: Persist): string {
  const lines = data.lines
  const getProp = getPropMaker(lines)
  return lines
    .map((line) => {
      const prop = getProp(line)
      const printSyls: { startTime: number; duration: number; text: string }[] = []
      line.syllables.forEach((s) => {
        const text = s.text
        if (text.trim() || !printSyls.length)
          printSyls.push({ text, startTime: s.startTime, duration: s.endTime - s.startTime })
        else printSyls[printSyls.length - 1]!.text += text // merge consecutive spaces into one syllable
      })
      const syllablesStr = printSyls.map((s) => `${s.text}(${s.startTime},${s.duration})`).join('')
      return `[${prop}]${syllablesStr}`
    })
    .join('\n')
}
