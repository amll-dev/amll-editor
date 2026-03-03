import type { LyricLine, Persist } from '@core/types'

import { coreCreate } from '@states/stores/core'

import type { Convert as CV } from '../types'

// Lyricify Lines (LYL) parser and stringifier
// Lyricify Lines is a proprietary format used by Lyricify
// See: https://github.com/WXRIW/Lyricify-App/blob/main/docs/Lyricify%204/Lyrics.md#lyricify-lines-%E6%A0%BC%E5%BC%8F%E8%A7%84%E8%8C%83

// Format:
// [type:LyricifyLines]
// [startTime,endTime]lyric line
// [startTime,endTime]lyric line2

// Example:
// [type:LyricifyLines]
// [54260,57380]Stop and stare
// [57380,62840]I think I'm moving but I go nowhere
// [62840,67730]Yeah, I know that everyone gets scared
// [67730,73370]But I've become what I can't be

export const lylReg: CV.FormatHandler = {
  parser: parseLYL,
  stringifier: stringifyLYL,
}

export function parseLYL(lrc: string): Persist {
  const lines = lrc
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
  const lyricLines: LyricLine[] = []
  lines.forEach((lineStr) => {
    lineStr = lineStr.trim()
    if (lineStr.startsWith('#') || lineStr.startsWith('{')) return
    if (lineStr === '[type:LyricifyLines]') return
    const timeMatch = lineStr.match(/^\[(\d+),(\d+)\](.*)$/)
    if (!timeMatch) return
    const [, startStr, endStr, text] = timeMatch
    const startTime = Number(startStr)
    const endTime = Number(endStr!)
    const backgroundMatch = text!.match(/^[\(（](.+)[\)）]$/)
    const isBackground = !!backgroundMatch
    const textContent = backgroundMatch ? backgroundMatch[1]! : text!
    lyricLines.push(
      coreCreate.newLine({
        startTime,
        endTime,
        background: isBackground,
        syllables: [coreCreate.newSyllable({ text: textContent.trim(), startTime, endTime })],
      }),
    )
  })
  return {
    metadata: {},
    lines: lyricLines,
  }
}

export function stringifyLYL(data: Persist): string {
  const lines = data.lines
  const header = '[type:LyricifyLines]'
  const body = lines.map((line) => {
    const text = line.syllables.map((s) => s.text).join('')
    const printText = line.background ? `(${text})` : text
    return `[${line.startTime},${line.endTime}]${printText}`
  })
  return [header, ...body].join('\n')
}
