import type { LyricLine, LyricSyllable, Metadata, Persist } from '@core/types'

import { coreCreate } from '@states/stores/core'

import { alignLineTime } from '@utils/alignLineSylTime'
import { ms2str, str2ms as nullableStr2ms } from '@utils/formatTime'
import type { Maybe } from '@utils/types'

import MANIFEST from '../manifest.json'
import type { Convert as CV } from '../types'

// Frontend TTML parser and stringifier, following AMLL TTML Lyric Format
// Derived from: https://github.com/Steve-xmh/amll-ttml-tool , Licensed under GPLv3
// See also https://www.w3.org/TR/2018/REC-ttml1-20181108/

export const ttmlReg: CV.Format = {
  ...MANIFEST.ttml,
  parser: parseTTML,
  stringifier: stringifyTTML,
}

interface RomanWord {
  startTime: number
  endTime: number
  text: string
}
interface LineMetadata {
  main: string
  bg: string
}
interface WordRomanMetadata {
  main: RomanWord[]
  bg: RomanWord[]
}

const { newLine, newSyllable } = coreCreate

function str2ms(str: Maybe<string>): number {
  if (!str) return 0
  const ms = nullableStr2ms(str)
  if (ms === null) throw new TypeError(`Invalid time string: ${str}`)
  return ms
}

const trimBraces = (s: string) =>
  s
    .trim()
    .replace(/^[（(]/, '')
    .replace(/[)）]$/, '')
    .trim()

class StringAccum {
  private parts: string[] = []
  append(s: Maybe<string>) {
    if (typeof s !== 'string' || s.length === 0) return
    this.parts.push(s)
  }
  toString() {
    return this.parts.join('')
  }
}

const hasTimestamps = (el: Element) => el.hasAttribute('begin') && el.hasAttribute('end')

function parseItunesTranslations(ttmlDoc: XMLDocument) {
  const itunesTranslations = new Map<string, LineMetadata>()
  const translationTextElements = ttmlDoc.querySelectorAll(
    'iTunesMetadata > translations > translation > text[for]',
  )

  translationTextElements.forEach((textEl) => {
    const key = textEl.getAttribute('for')
    if (!key) return

    const mainStrs = new StringAccum()
    const bgStrs = new StringAccum()

    textEl.childNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) mainStrs.append(node.textContent)
      else if (node.nodeType === Node.ELEMENT_NODE)
        if ((node as Element).getAttribute('ttm:role') === 'x-bg')
          if (node.textContent) bgStrs.append(node.textContent)
    })

    const main = mainStrs.toString().trim()
    const bg = trimBraces(bgStrs.toString())

    if (main || bg) itunesTranslations.set(key, { main, bg })
  })

  return itunesTranslations
}

function parseItunesRomanizations(ttmlDoc: XMLDocument) {
  const itunesLineRomanizations = new Map<string, LineMetadata>()
  const itunesWordRomanizations = new Map<string, WordRomanMetadata>()

  const romanizationTextElements = ttmlDoc.querySelectorAll(
    'iTunesMetadata > transliterations > transliteration > text[for]',
  )

  const spanToRomanWord = (span: Element, trimTextBraces = false): RomanWord => ({
    startTime: str2ms(span.getAttribute('begin')),
    endTime: str2ms(span.getAttribute('end')),
    text: trimTextBraces ? trimBraces(span.textContent) : span.textContent.trim(),
  })

  romanizationTextElements.forEach((textEl) => {
    const key = textEl.getAttribute('for')
    if (!key) return

    const mainWords: RomanWord[] = []
    const bgWords: RomanWord[] = []
    const lineRomanMainStrs = new StringAccum()
    const lineRomanBgStrs = new StringAccum()
    let isWordByWord = false

    textEl.childNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        lineRomanMainStrs.append(node.textContent)
        return
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return
      const el = node as Element
      if (el.getAttribute('ttm:role') === 'x-bg') {
        const nestedSpans = el.querySelectorAll('span[begin][end]')
        if (nestedSpans.length === 0) lineRomanBgStrs.append(el.textContent)
        else {
          isWordByWord = true
          nestedSpans.forEach((span) => bgWords.push(spanToRomanWord(span, true)))
        }
      } else if (hasTimestamps(el)) {
        isWordByWord = true
        mainWords.push(spanToRomanWord(el))
      }
    })

    if (isWordByWord) {
      itunesWordRomanizations.set(key, { main: mainWords, bg: bgWords })
    }

    const lineRomanMain = lineRomanMainStrs.toString().trim()
    const lineRomanBg = trimBraces(lineRomanBgStrs.toString())

    if (lineRomanMain || lineRomanBg) {
      itunesLineRomanizations.set(key, {
        main: lineRomanMain,
        bg: lineRomanBg,
      })
    }
  })

  return { itunesLineRomanizations, itunesWordRomanizations }
}

function parseMetadata(ttmlDoc: XMLDocument): Persist['metadata'] {
  const metadataMap = new Map<string, string[]>()
  ttmlDoc.querySelectorAll('meta').forEach((meta) => {
    if (meta.tagName !== 'amll:meta') return
    const key = meta.getAttribute('key')
    const value = meta.getAttribute('value')
    if (!key || !value) return
    if (metadataMap.has(key)) metadataMap.get(key)!.push(value)
    else metadataMap.set(key, [value])
  })
  return Object.fromEntries([...metadataMap.entries()])
}

function findMainAgentId(ttmlDoc: XMLDocument): string {
  for (const agent of Array.from(ttmlDoc.querySelectorAll('ttm\\:agent'))) {
    if (agent.getAttribute('type') !== 'person') continue
    const id = agent.getAttribute('xml:id')
    if (id) return id
  }
  return 'v1'
}

export function parseTTML(ttmlText: string): Persist {
  const domParser = new DOMParser()
  const ttmlDoc: XMLDocument = domParser.parseFromString(ttmlText, 'application/xml')

  const itunesTranslations = parseItunesTranslations(ttmlDoc)
  const { itunesLineRomanizations, itunesWordRomanizations } = parseItunesRomanizations(ttmlDoc)

  const metadata = parseMetadata(ttmlDoc)

  const mainAgentId = findMainAgentId(ttmlDoc)

  const lineArr: LyricLine[] = []

  ttmlDoc.querySelectorAll('body p[begin][end]').forEach((lineEl) => {
    parseLineElement(lineEl, false, false, null)
  })

  function parseLineElement(
    lineEl: Element,
    background = false,
    duet = false,
    parentItunesKey: string | null = null,
  ) {
    if (background) duet = lineEl.getAttribute('ttm:agent') !== mainAgentId

    let haveBg = false

    const startTime = str2ms(lineEl.getAttribute('begin'))
    const endTime = str2ms(lineEl.getAttribute('end'))

    const line: LyricLine = newLine({ background, duet, startTime, endTime })
    lineArr.push(line)

    const itunesKey = background ? parentItunesKey : lineEl.getAttribute('itunes:key')

    const romanWordData = itunesKey ? itunesWordRomanizations.get(itunesKey) : undefined
    const romanWords = background ? romanWordData?.bg : romanWordData?.main

    if (itunesKey) {
      const metadataAttr = background ? 'bg' : 'main'
      line.translation = itunesTranslations.get(itunesKey)?.[metadataAttr] ?? ''
      line.romanization = itunesLineRomanizations.get(itunesKey)?.[metadataAttr] ?? ''
    }

    lineEl.childNodes.forEach((wordNode) => {
      if (wordNode.nodeType === Node.TEXT_NODE) {
        const text = wordNode.textContent ?? ''
        line.syllables.push(
          newSyllable({
            text,
            startTime: text.trim() ? startTime : 0,
            endTime: text.trim() ? endTime : 0,
          }),
        )
      } else if (wordNode.nodeType === Node.ELEMENT_NODE) {
        const wordEl = wordNode as Element
        const role = wordEl.getAttribute('ttm:role')

        if (wordEl.nodeName === 'span' && role) {
          if (role === 'x-bg') {
            parseLineElement(wordEl, true, line.duet, itunesKey)
            haveBg = true
          } else if (role === 'x-translation') {
            // Use inline translation only if there is no Apple Music style translation
            line.translation ||= wordEl.textContent.trim()
          } else if (role === 'x-roman') {
            line.romanization ||= wordEl.textContent.trim()
          }
        } else if (hasTimestamps(wordEl)) {
          const wordStartTime = str2ms(wordEl.getAttribute('begin'))
          const wordEndTime = str2ms(wordEl.getAttribute('end'))

          const word = newSyllable({
            text: wordEl.textContent,
            startTime: wordStartTime,
            endTime: wordEndTime,
          })
          const placeholdingBeat = wordEl.getAttribute('amll:empty-beat')
          if (placeholdingBeat) word.placeholdingBeat = Number(placeholdingBeat)

          if (romanWords) {
            const matchingRoman = romanWords.find(
              (r) => r.startTime === wordStartTime && r.endTime === wordEndTime,
            )
            if (matchingRoman) word.romanization = matchingRoman.text
          }

          line.syllables.push(word)
        }
      }
    })

    if (!startTime && !endTime) alignLineTime(line)

    if (background) {
      const firstWord = line.syllables[0]
      if (firstWord) {
        firstWord.text = firstWord.text.replace(/^\s*[（(]/, '')
        if (!firstWord.text.trim()) line.syllables.shift()
      }

      const lastWord = line.syllables.at(-1)
      if (lastWord) {
        lastWord.text = lastWord.text.replace(/[)）]\s*$/, '')
        if (!lastWord.text.trim()) line.syllables.pop()
      }
    }
  }

  return {
    metadata,
    lines: lineArr,
  }
}

export function stringifyTTML(ttmlLyric: Persist): string {
  const params: LyricLine[][] = []
  const lyric = ttmlLyric.lines

  let tmp: LyricLine[] = []
  for (const line of lyric) {
    if (line.syllables.length === 0 && tmp.length > 0) {
      params.push(tmp)
      tmp = []
    } else {
      tmp.push(line)
    }
  }

  if (tmp.length > 0) {
    params.push(tmp)
  }

  const doc = new Document()

  function createWordElement(word: LyricSyllable): Element {
    const span = doc.createElement('span')
    span.setAttribute('begin', ms2str(word.startTime))
    span.setAttribute('end', ms2str(word.endTime))
    if (word.placeholdingBeat) span.setAttribute('amll:empty-beat', `${word.placeholdingBeat}`)
    span.appendChild(doc.createTextNode(word.text))
    return span
  }

  function createRomanizationSpan(word: LyricSyllable): Element {
    const span = doc.createElement('span')
    span.setAttribute('begin', ms2str(word.startTime))
    span.setAttribute('end', ms2str(word.endTime))
    span.appendChild(doc.createTextNode(word.romanization))
    return span
  }

  const ttRoot = doc.createElement('tt')

  ttRoot.setAttribute('xmlns', 'http://www.w3.org/ns/ttml')
  ttRoot.setAttribute('xmlns:ttm', 'http://www.w3.org/ns/ttml#metadata')
  ttRoot.setAttribute('xmlns:amll', 'http://www.example.com/ns/amll')
  ttRoot.setAttribute('xmlns:itunes', 'http://music.apple.com/lyric-ttml-internal')

  doc.appendChild(ttRoot)

  const head = doc.createElement('head')

  ttRoot.appendChild(head)

  const body = doc.createElement('body')
  const hasOtherPerson = !!lyric.find((v) => v.duet)

  const metadataEl = doc.createElement('metadata')
  const mainPersonAgent = doc.createElement('ttm:agent')
  mainPersonAgent.setAttribute('type', 'person')
  mainPersonAgent.setAttribute('xml:id', 'v1')

  metadataEl.appendChild(mainPersonAgent)

  if (hasOtherPerson) {
    const otherPersonAgent = doc.createElement('ttm:agent')
    otherPersonAgent.setAttribute('type', 'other')
    otherPersonAgent.setAttribute('xml:id', 'v2')

    metadataEl.appendChild(otherPersonAgent)
  }

  for (const [key, values] of Object.entries(ttmlLyric.metadata)) {
    for (const value of values) {
      const metaEl = doc.createElement('amll:meta')
      metaEl.setAttribute('key', key)
      metaEl.setAttribute('value', value)
      metadataEl.appendChild(metaEl)
    }
  }

  head.appendChild(metadataEl)

  let i = 0

  const romanizationMap = new Map<string, { main: LyricSyllable[]; bg: LyricSyllable[] }>()

  const guessDuration = lyric[lyric.length - 1]?.endTime ?? 0
  body.setAttribute('dur', ms2str(guessDuration))
  const isDynamicLyric = lyric.some(
    (line) => line.syllables.filter((v) => v.text.trim().length > 0).length > 1,
  )

  for (const param of params) {
    const paramDiv = doc.createElement('div')
    const beginTime = param[0]?.startTime ?? 0
    const endTime = param[param.length - 1]?.endTime ?? 0

    paramDiv.setAttribute('begin', ms2str(beginTime))
    paramDiv.setAttribute('end', ms2str(endTime))

    let skip = false
    for (const [lineIndex, line] of param.entries()) {
      if (skip) {
        skip = false
        continue
      }
      const lineP = doc.createElement('p')
      const beginTime = line.startTime ?? 0
      const endTime = line.endTime

      lineP.setAttribute('begin', ms2str(beginTime))
      lineP.setAttribute('end', ms2str(endTime))

      lineP.setAttribute('ttm:agent', line.duet ? 'v2' : 'v1')

      const itunesKey = `L${++i}`
      lineP.setAttribute('itunes:key', itunesKey)

      const mainWords = line.syllables
      let bgWords: LyricSyllable[] = []

      if (isDynamicLyric) {
        let beginTime = Number.POSITIVE_INFINITY
        let endTime = 0
        for (const word of line.syllables) {
          if (word.text.trim().length === 0) {
            lineP.appendChild(doc.createTextNode(word.text))
          } else {
            const span = createWordElement(word)
            lineP.appendChild(span)
            beginTime = Math.min(beginTime, word.startTime)
            endTime = Math.max(endTime, word.endTime)
          }
        }
        lineP.setAttribute('begin', ms2str(line.startTime))
        lineP.setAttribute('end', ms2str(line.endTime))
      } else {
        const word = line.syllables[0]!
        lineP.appendChild(doc.createTextNode(word.text))
        lineP.setAttribute('begin', ms2str(word.startTime))
        lineP.setAttribute('end', ms2str(word.endTime))
      }

      const nextLine = param[lineIndex + 1]
      if (nextLine?.background) {
        skip = true
        const bgLine = nextLine
        bgWords = bgLine.syllables

        const bgLineSpan = doc.createElement('span')
        bgLineSpan.setAttribute('ttm:role', 'x-bg')

        if (isDynamicLyric) {
          let beginTime = Number.POSITIVE_INFINITY
          let endTime = 0

          const firstWordIndex = bgLine.syllables.findIndex((w) => w.text.trim().length > 0)
          const lastWordIndex = bgLine.syllables
            .map((w) => w.text.trim().length > 0)
            .lastIndexOf(true)

          for (const [sylIndex, word] of bgLine.syllables.entries()) {
            if (word.text.trim().length === 0) {
              bgLineSpan.appendChild(doc.createTextNode(word.text))
            } else {
              const span = createWordElement(word)

              if (sylIndex === firstWordIndex && span.firstChild) {
                span.firstChild.nodeValue = `(${span.firstChild.nodeValue}`
              }
              if (sylIndex === lastWordIndex && span.firstChild) {
                span.firstChild.nodeValue = `${span.firstChild.nodeValue})`
              }

              bgLineSpan.appendChild(span)
              beginTime = Math.min(beginTime, word.startTime)
              endTime = Math.max(endTime, word.endTime)
            }
          }
          bgLineSpan.setAttribute('begin', ms2str(beginTime))
          bgLineSpan.setAttribute('end', ms2str(endTime))
        } else {
          const word = bgLine.syllables[0]!
          bgLineSpan.appendChild(doc.createTextNode(`(${word.text})`))
          bgLineSpan.setAttribute('begin', ms2str(word.startTime))
          bgLineSpan.setAttribute('end', ms2str(word.endTime))
        }

        if (bgLine.translation) {
          const span = doc.createElement('span')
          span.setAttribute('ttm:role', 'x-translation')
          span.setAttribute('xml:lang', 'zh-CN')
          span.appendChild(doc.createTextNode(bgLine.translation))
          bgLineSpan.appendChild(span)
        }

        if (bgLine.romanization) {
          const span = doc.createElement('span')
          span.setAttribute('ttm:role', 'x-roman')
          span.appendChild(doc.createTextNode(bgLine.romanization))
          bgLineSpan.appendChild(span)
        }

        lineP.appendChild(bgLineSpan)
      }

      if (line.translation) {
        const span = doc.createElement('span')
        span.setAttribute('ttm:role', 'x-translation')
        span.setAttribute('xml:lang', 'zh-CN')
        span.appendChild(doc.createTextNode(line.translation))
        lineP.appendChild(span)
      }

      if (line.romanization) {
        const span = doc.createElement('span')
        span.setAttribute('ttm:role', 'x-roman')
        span.appendChild(doc.createTextNode(line.romanization))
        lineP.appendChild(span)
      }

      const hasRoman =
        mainWords.some((w) => w.romanization && w.romanization.trim().length > 0) ||
        bgWords.some((w) => w.romanization && w.romanization.trim().length > 0)

      if (hasRoman) {
        romanizationMap.set(itunesKey, { main: mainWords, bg: bgWords })
      }

      paramDiv.appendChild(lineP)
    }

    body.appendChild(paramDiv)
  }

  if (romanizationMap.size > 0) {
    const itunesMeta = doc.createElement('iTunesMetadata')
    itunesMeta.setAttribute('xmlns', 'http://music.apple.com/lyric-ttml-internal')

    const transliterations = doc.createElement('transliterations')
    const transliteration = doc.createElement('transliteration')

    for (const [key, { main, bg }] of romanizationMap.entries()) {
      const textEl = doc.createElement('text')
      textEl.setAttribute('for', key)

      for (const word of main) {
        if (word.romanization && word.romanization.trim().length > 0) {
          textEl.appendChild(createRomanizationSpan(word))
        } else if (word.text.trim().length === 0 && textEl.hasChildNodes()) {
          textEl.appendChild(doc.createTextNode(word.text))
        }
      }

      const hasBgRoman = bg.some((w) => w.romanization && w.romanization.trim().length > 0)
      if (hasBgRoman) {
        const bgSpan = doc.createElement('span')
        bgSpan.setAttribute('ttm:role', 'x-bg')

        const romanBgWords = bg.filter((w) => w.romanization && w.romanization.trim().length > 0)

        for (const [sylIndex, word] of romanBgWords.entries()) {
          const span = createRomanizationSpan(word)

          if (sylIndex === 0 && span.firstChild) {
            span.firstChild.nodeValue = `(${span.firstChild.nodeValue}`
          }
          if (sylIndex === romanBgWords.length - 1 && span.firstChild) {
            span.firstChild.nodeValue = `${span.firstChild.nodeValue})`
          }

          bgSpan.appendChild(span)

          const originalIndex = bg.indexOf(word)
          if (originalIndex > -1 && originalIndex < bg.length - 1) {
            const nextWord = bg[originalIndex + 1]!
            if (nextWord && nextWord.text.trim().length === 0) {
              bgSpan.appendChild(doc.createTextNode(nextWord.text))
            }
          }
        }
        textEl.appendChild(bgSpan)
      }

      transliteration.appendChild(textEl)
    }

    transliterations.appendChild(transliteration)
    itunesMeta.appendChild(transliterations)

    metadataEl.appendChild(itunesMeta)
  }

  ttRoot.appendChild(body)

  return new XMLSerializer().serializeToString(doc)
}
