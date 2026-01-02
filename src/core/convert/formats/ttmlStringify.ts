import type { LyricLine, LyricSyllable, Persist } from '@core/types'

import { ms2str } from '@utils/formatTime'

// Frontend TTML stringifier, following AMLL TTML Lyric Format
// Derived from: https://github.com/Steve-xmh/amll-ttml-tool , Licensed under GPLv3
// See also https://www.w3.org/TR/2018/REC-ttml1-20181108/

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
