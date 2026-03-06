import { escape } from 'lodash-es'

import { compatibilityMap } from '@core/compat'
import type { LyricLine, LyricSyllable } from '@core/types'

export interface SerializedClipboardData {
  plaintext: string
  html: string
}
interface BasicClipboardData {
  meta: 'AMLL_CLIPBOARD_DATA'
  createdBy: string
  editorVersion: string
  dataVersion: string
}
interface LinesClipboardData extends BasicClipboardData {
  type: 'lines'
  lines: LyricLine[]
}
interface SyllablesClipboardData extends BasicClipboardData {
  type: 'syllables'
  syllables: LyricSyllable[]
}
export type ClipboardData = LinesClipboardData | SyllablesClipboardData

const getBasicClipboardData = () =>
  ({
    meta: 'AMLL_CLIPBOARD_DATA',
    createdBy: __APP_DISPLAY_NAME__,
    editorVersion: __APP_VERSION__,
    dataVersion: 'ALCD1',
  }) as const
export const packLines = (lines: LyricLine[]): LinesClipboardData => ({
  ...getBasicClipboardData(),
  type: 'lines',
  lines,
})
export const packSyllables = (syllables: LyricSyllable[]): SyllablesClipboardData => ({
  ...getBasicClipboardData(),
  type: 'syllables',
  syllables,
})

export function serializeClipboardData(data: ClipboardData): SerializedClipboardData {
  const plaintextLines =
    data.type === 'lines'
      ? data.lines.map((l) => l.syllables.map((s) => s.text).join(''))
      : [data.syllables.map((s) => s.text).join(' ')]
  const dataHtml = /*html*/ `<div data-lyric-root style="display:none">${JSON.stringify(data)}</div>`
  const textHtml = /*html*/ `<div data-lyric-text>${plaintextLines.map((l) => `<p>${escape(l)}</p>`).join('')}</div>`
  return {
    plaintext: plaintextLines.join('\n'),
    html: dataHtml + textHtml,
  }
}
export function deserializeClipboardData(data: SerializedClipboardData): ClipboardData | null {
  if (!data.html || !data.html.includes('data-lyric-root')) return null
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(data.html, 'text/html')
    const root = doc.querySelector('[data-lyric-root]')
    if (!root) return null
    const obj = JSON.parse(root.innerHTML)
    if (typeof obj !== 'object' || obj?.meta !== 'AMLL_CLIPBOARD_DATA') return null
    return obj as ClipboardData
  } catch (e) {
    console.log(e)
    return null
  }
}

export async function setClipboardData(data: SerializedClipboardData) {
  if (!compatibilityMap.clipboard)
    throw new Error('Clipboard API is not supported in this environment.')
  await navigator.clipboard.write([
    new ClipboardItem({
      'text/plain': new Blob([data.plaintext], { type: 'text/plain' }),
      'text/html': new Blob([data.html], { type: 'text/html' }),
    }),
  ])
}
export async function getClipboardData() {
  if (!compatibilityMap.clipboard)
    throw new Error('Clipboard API is not supported in this environment.')
  const clipboardContents = await navigator.clipboard.read()
  const plaintext = await clipboardContents[0]?.getType('text/plain')
  const html = await clipboardContents[0]?.getType('text/html')
  return {
    plaintext: (await plaintext?.text()) || '',
    html: (await html?.text()) || '',
  }
}
