import type { LyricLine, Persist } from '@core/types'

import { alignLineTime } from '@utils/alignLineSylTime'
import { ms2str, str2ms } from '@utils/formatTime'

import type { Convert as CV } from '../types'
import { lysReg } from './lys'

// Lyricify Quick Export (LQE) parser and stringifier
// Lyricify Quick Export is a proprietary format used by Lyricify
// It's a combination of LYS (for lyrics) and LRC (for translations/romanizations)
// See: https://github.com/amll-dev/amll-editor/wiki/0x04-%E6%94%AF%E6%8C%81%E7%9A%84%E4%B8%BB%E8%A6%81%E6%96%87%E4%BB%B6%E6%A0%BC%E5%BC%8F%E4%BB%8B%E7%BB%8D#lyricify-%E7%B3%BB%E5%88%97%E6%A0%BC%E5%BC%8F

// Example:
/*
[Lyricify Quick Export]
[version:1.0]

[lyrics: format@Lyricify Syllable]
[4]A(365,350)ni(715,307)ro(1022,312)dham (1334,419)a(3203,337)nut(3540,350)pā(3890,306)dam(4196,382)
[5]Qua(6206,312)e(6518,350)so (6868,370)do(7238,338)mi(7576,373)ne (7949,413)nos (8362,736)ple(9098,306)ne (9404,338)sal(9742,237)va (9979,244)tam(10223,350)
[4]A(6164,1436)nuc(7600,744)che(8344,724)dam (9068,399)a(9467,293)śā(9760,240)śva(10000,225)tam(10225,893)
[4]Hi (11851,812)ma(12663,344)ma (13007,369)ja(13376,263)gad (13639,237)i(13876,212)daṃ(14088,800)


[translation: format@LRC]
[00:00.365]不生亦不灭
[00:06.206]主人啊，求你像这般，赐给我们完全的救恩
[00:06.164]不常亦不断
[00:11.851]此世已为我之世


[pronunciation: format@LRC, language@romaji]
[00:00.365]阿难罗昙 阿耨钵昙
[00:06.164]阿耨遮昙 阿刹缚多
[00:11.851]天摩诃满 荼揭谛檀
*/

export const lqeReg: CV.FormatHandler = {
  parser: parseLQE,
  stringifier: stringifyLQE,
}

interface HeaderMatch {
  index: number
  type: 'lyric' | 'translation' | 'romanization' | 'unknown'
}
function parseAttr(
  attr: 'translation' | 'romanization',
  matchResults: HeaderMatch[],
  rawLines: string[],
  lines: LyricLine[],
): void {
  const headerItemIndex = matchResults.findIndex((r) => r.type === attr)
  if (headerItemIndex === -1) return
  const timeMatcher = /^\[([0-9:.]+)\](.*)$/
  const attrLines = rawLines
    .slice(matchResults[headerItemIndex]!.index + 1, matchResults[headerItemIndex + 1]!.index)
    .map((l) => l.trim())
    .filter((l) => l.length)
    .map((line) => {
      const match = line.match(timeMatcher)
      if (!match) return null
      const [, timeStr, text] = match
      const time = str2ms(timeStr!)
      if (time === null) return null
      return { time, text: text! }
    })
  let attrLineIndex = 0
  for (const line of lines) {
    if (attrLines[attrLineIndex]?.time !== line.startTime) continue
    line[attr] = attrLines[attrLineIndex]!.text
    attrLineIndex++
  }
}
function parseLQE(lrc: string): Persist {
  const lines = lrc
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
  const matcher = /^\[([a-zA-Z]+):.+\]$/
  const matchResults: HeaderMatch[] = []
  lines.forEach((line, index) => {
    const match = line.match(matcher)
    if (!match) return
    const [, type] = match
    if (type === 'lyrics') matchResults.push({ index, type: 'lyric' })
    else if (type === 'translation') matchResults.push({ index, type: 'translation' })
    else if (type === 'pronunciation') matchResults.push({ index, type: 'romanization' })
    else matchResults.push({ index, type: 'unknown' })
  })
  matchResults.push({ index: lines.length, type: 'unknown' }) // sentinel
  console.log('LQE parse header matches:', matchResults)
  const lyricHeaderItemIndex = matchResults.findIndex((r) => r.type === 'lyric')
  if (lyricHeaderItemIndex === -1) return { lines: [], metadata: {} }
  const lyricLines = lines.slice(
    matchResults[lyricHeaderItemIndex]!.index + 1,
    matchResults[lyricHeaderItemIndex + 1]!.index,
  )
  const persist = lysReg.parser(lyricLines.join('\n'))
  parseAttr('translation', matchResults, lines, persist.lines)
  parseAttr('romanization', matchResults, lines, persist.lines)
  return persist
}

const attrHeader = {
  translation: '[translation: format@LRC]',
  romanization: '[pronunciation: format@LRC, language@romaji]',
} as const
function stringifyAttr(persist: Persist, attr: 'translation' | 'romanization'): string | null {
  const header = attrHeader[attr]
  const lines = persist.lines
    .map((line) => (line[attr] ? `[${ms2str(line.startTime)}]${line[attr]}` : null))
    .filter((v) => v !== null)
  if (lines.length === 0) return null
  return [header, ...lines].join('\n')
}
function stringifyLQE(persist: Persist): string {
  persist.lines.forEach((l) => alignLineTime(l))
  const header = '[Lyricify Quick Export]\n[version:1.0]'
  const lyric = `[lyrics: format@Lyricify Syllable]\n${lysReg.stringifier(persist)}`
  const translation = stringifyAttr(persist, 'translation')
  const romanization = stringifyAttr(persist, 'romanization')
  const body = [lyric, translation, romanization].filter((v) => v !== null).join('\n\n\n')
  return [header, body].join('\n\n')
}
