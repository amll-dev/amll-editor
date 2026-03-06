import { t } from '@i18n'
import { type Ref, computed, nextTick } from 'vue'

import { compatibilityMap } from '@core/compat'
import { getHotkeyStr } from '@core/hotkey'
import type { LyricLine, LyricSyllable } from '@core/types'

import { useCoreStore, useRuntimeStore, useStaticStore } from '@states/stores'

import { alignLineEndTime, alignLineTime } from '@utils/alignLineSylTime'
import { sortLines, sortSyllables } from '@utils/sortLineSyls'

import type { MenuItem } from 'primevue/menuitem'

import { toogleAttr } from '../shared'
import {
  deserializeClipboardData,
  getClipboardData,
  packLines,
  packSyllables,
  serializeClipboardData,
  setClipboardData,
} from './clipboard'

interface ContentCtxStates {
  lineIndex: Ref<number | undefined>
  sylIndex: Ref<number | undefined>
}

const tt = t.editor.context

//#region Shared

export function combineLines() {
  const runtimeStore = useRuntimeStore()
  const coreStore = useCoreStore()
  if (runtimeStore.selectedLines.size < 2) return
  const lines = sortLines(...runtimeStore.selectedLines)
  const [mainLine, ...linesToMerge] = lines
  if (!mainLine) return
  for (const line of linesToMerge) {
    if (line.syllables.length)
      mainLine.syllables.push(coreStore.newSyllable({ text: ' ' }), ...line.syllables)
    if (line.translation.trim()) mainLine.translation += ' ' + line.translation.trim()
    if (line.romanization.trim()) mainLine.romanization += ' ' + line.romanization.trim()
  }
  coreStore.deleteLine(...linesToMerge)
  alignLineEndTime(mainLine)
  runtimeStore.selectLine(mainLine)
}

export function execCopy() {
  if (!compatibilityMap.clipboard) return
  const runtimeStore = useRuntimeStore()
  if (runtimeStore.selectedLines.size === 0 && runtimeStore.selectedSyllables.size === 0) return
  const pendingData = runtimeStore.selectedSyllables.size
    ? packSyllables(sortSyllables(...runtimeStore.selectedSyllables))
    : packLines(sortLines(...runtimeStore.selectedLines))
  const serializedData = serializeClipboardData(pendingData)
  setClipboardData(serializedData)
}
export function execCut() {
  if (!compatibilityMap.clipboard) return
  execCopy()
  const runtimeStore = useRuntimeStore()
  const coreStore = useCoreStore()
  if (runtimeStore.selectedSyllables.size)
    coreStore.deleteSyllable(...runtimeStore.selectedSyllables)
  else coreStore.deleteLine(...runtimeStore.selectedLines)
  runtimeStore.clearSelection()
}

export async function execPaste(): Promise<void>
export async function execPaste(lineIndex?: number): Promise<void>
export async function execPaste(lineIndex?: number) {
  if (!compatibilityMap.clipboard) return
  const runtimeStore = useRuntimeStore()
  const coreStore = useCoreStore()
  const staticStore = useStaticStore()
  const serialized = await getClipboardData()
  const data = deserializeClipboardData(serialized)
  if (!data) return
  if (data.type === 'lines') {
    const getDuplicatedLines = () =>
      data.lines.map((ol) =>
        coreStore.newLine({
          ...ol,
          syllables: ol.syllables.map((os) => coreStore.newSyllable({ ...os })),
        }),
      )
    if (typeof lineIndex === 'number') {
      const duplicatedLines = getDuplicatedLines()
      coreStore.lyricLines.splice(lineIndex, 0, ...duplicatedLines)
      runtimeStore.selectLine(...duplicatedLines)
      nextTick(() => staticStore.scrollToHook?.(lineIndex, { align: 'nearest' }))
      return
    }
    if (runtimeStore.selectedLines.size === 0) {
      const duplicatedLines = getDuplicatedLines()
      coreStore.lyricLines.push(...duplicatedLines)
      runtimeStore.selectLine(...duplicatedLines)
      nextTick(() =>
        staticStore.scrollToHook?.(coreStore.lyricLines.length - duplicatedLines.length, {
          align: 'nearest',
        }),
      )
      return
    }
    const shouldSelectLines: LyricLine[] = []
    for (let i = coreStore.lyricLines.length - 1; i >= 0; i--) {
      const line = coreStore.lyricLines[i]!
      if (!runtimeStore.selectedLines.has(line)) continue
      const duplicatedLines = getDuplicatedLines()
      coreStore.lyricLines.splice(i + 1, 0, ...duplicatedLines)
      shouldSelectLines.push(...duplicatedLines)
    }
    if (shouldSelectLines.length) runtimeStore.selectLine(...shouldSelectLines)
    if (staticStore.lastTouchedLine) {
      const index = coreStore.lyricLines.indexOf(staticStore.lastTouchedLine)
      if (index !== -1) nextTick(() => staticStore.scrollToHook?.(index + 1, { align: 'nearest' }))
    }
  } else if (data.type === 'syllables') {
    const getDuplicatedSyls = () => data.syllables.map((os) => coreStore.newSyllable({ ...os }))
    if (typeof lineIndex === 'number') {
      const newLine = coreStore.newLine({ syllables: getDuplicatedSyls() })
      coreStore.lyricLines.splice(lineIndex, 0, newLine)
      runtimeStore.selectLineSyl(newLine, ...newLine.syllables)
      nextTick(() => staticStore.scrollToHook?.(lineIndex, { align: 'nearest' }))
      return
    }
    if (runtimeStore.selectedLines.size === 0) {
      const newLine = coreStore.newLine({ syllables: getDuplicatedSyls() })
      coreStore.lyricLines.push(newLine)
      runtimeStore.selectLineSyl(newLine, ...newLine.syllables)
      nextTick(() =>
        staticStore.scrollToHook?.(coreStore.lyricLines.length - 1, { align: 'nearest' }),
      )
      return
    }
    const shouldSelectSyls: LyricSyllable[] = []
    for (const line of runtimeStore.selectedLines) {
      if (runtimeStore.selectedSyllables.size === 0) {
        const duplicatedSyls = getDuplicatedSyls()
        line.syllables.push(...duplicatedSyls)
        shouldSelectSyls.push(...duplicatedSyls)
        alignLineEndTime(line)
        continue
      }
      for (let i = line.syllables.length - 1; i >= 0; i--) {
        const syl = line.syllables[i]!
        if (!runtimeStore.selectedSyllables.has(syl)) continue
        const duplicatedSyls = getDuplicatedSyls()
        line.syllables.splice(i + 1, 0, ...duplicatedSyls)
        shouldSelectSyls.push(...duplicatedSyls)
      }
    }
    if (shouldSelectSyls.length) runtimeStore.selectSyllable(...shouldSelectSyls)
    if (staticStore.lastTouchedLine) {
      const index = coreStore.lyricLines.indexOf(staticStore.lastTouchedLine)
      if (index !== -1) nextTick(() => staticStore.scrollToHook?.(index, { align: 'nearest' }))
    }
  }
}

export function breakLine() {
  const runtimeStore = useRuntimeStore()
  const coreStore = useCoreStore()
  if (runtimeStore.selectedSyllables.size === 0) return
  const syls = sortSyllables(...runtimeStore.selectedSyllables)
  let currentLineIndex = 0
  for (const syl of syls) {
    while (!coreStore.lyricLines[currentLineIndex]?.syllables.includes(syl)) currentLineIndex++
    const line = coreStore.lyricLines[currentLineIndex]
    if (!line) return
    const sylIndex = line.syllables.indexOf(syl)
    const remainingSyls = line.syllables.splice(sylIndex)
    const newLine = coreStore.newLine({ ...line, syllables: remainingSyls })
    alignLineEndTime(line)
    alignLineTime(newLine)
    coreStore.lyricLines.splice(currentLineIndex + 1, 0, newLine)
    currentLineIndex++
  }
  runtimeStore.selectSyllable(...syls)
}

//#endregion

export function useContentCtxItems({ lineIndex, sylIndex }: ContentCtxStates) {
  const coreStore = useCoreStore()
  const runtimeStore = useRuntimeStore()
  const staticStore = useStaticStore()

  //#region Blank
  const blankMenuItems = computed<MenuItem[]>(() => [
    {
      label: tt.shared.paste(),
      icon: 'mdi mdi-content-paste',
      command: execPaste,
    },
    { separator: true },
    {
      label: tt.blank.insertLine(),
      icon: 'mdi mdi-plus',
      command: () => {
        const newLine = coreStore.newLine()
        coreStore.lyricLines.push(newLine)
        runtimeStore.selectLine(newLine)
      },
    },
  ])
  //#endregion

  //#region Line insert
  const lineInsertMenuItems = computed<MenuItem[]>(() => [
    {
      label: tt.shared.paste(),
      icon: 'mdi mdi-content-paste',
      command: () => execPaste(lineIndex.value),
    },
    { separator: true },
    {
      label: tt.betweenLines.insertLine(),
      icon: 'pi pi-plus',
      command: () => {
        if (lineIndex.value === undefined) return
        const newLine = coreStore.newLine()
        coreStore.lyricLines.splice(lineIndex.value, 0, newLine)
        runtimeStore.selectLine(newLine)
      },
    },
  ])
  //#endregion

  //#region Line
  const toggleDuet = () => toogleAttr('duet')
  const toggleBackground = () => toogleAttr('background')

  function insertLine(delta: 0 | 1) {
    const newLines: LyricLine[] = []
    for (const line of runtimeStore.selectedLines) {
      const newLine = coreStore.newLine()
      newLines.push(newLine)
      const lineIndex = coreStore.lyricLines.indexOf(line)
      if (lineIndex === -1) continue
      coreStore.lyricLines.splice(lineIndex + delta, 0, newLine)
    }
    runtimeStore.selectLine(...newLines)
    nextTick(() =>
      staticStore.scrollToHook?.(
        Math.max(0, ...newLines.map((l) => coreStore.lyricLines.indexOf(l))),
        { align: 'nearest' },
      ),
    )
  }
  const insertLineAfter = () => insertLine(1)
  const insertLineBefore = () => insertLine(0)

  function duplicateLine() {
    const duplicates = [...runtimeStore.selectedLines].map((line) =>
      coreStore.newLine({
        ...line,
        syllables: line.syllables.map(coreStore.newSyllable),
      }),
    )
    const lastLineIndex = (() => {
      for (let i = coreStore.lyricLines.length - 1; i >= 0; i--)
        if (runtimeStore.selectedLines.has(coreStore.lyricLines[i]!)) return i
      return -1
    })()
    if (lastLineIndex === -1) return
    coreStore.lyricLines.splice(lastLineIndex + 1, 0, ...duplicates)
    runtimeStore.selectLine(...duplicates)
    nextTick(() =>
      staticStore.scrollToHook?.(lastLineIndex + duplicates.length, { align: 'nearest' }),
    )
  }

  function deleteLine() {
    coreStore.deleteLine(...runtimeStore.selectedLines)
    runtimeStore.clearSelection()
  }

  const lineMenuItems = computed<MenuItem[]>(() => [
    {
      label: tt.shared.cut(),
      icon: 'mdi mdi-content-cut',
      command: execCut,
    },
    {
      label: tt.shared.copy(),
      icon: 'mdi mdi-content-copy',
      command: execCopy,
    },
    {
      label: tt.shared.paste(),
      icon: 'mdi mdi-content-paste',
      command: execPaste,
    },
    { separator: true },
    {
      label: tt.line.toggleDuet(),
      icon: 'mdi mdi-align-horizontal-right',
      command: toggleDuet,
      tip: getHotkeyStr('duet'),
    },
    {
      label: tt.line.toggleBackground(),
      icon: 'mdi mdi-focus-field',
      command: toggleBackground,
      tip: getHotkeyStr('background'),
    },
    { separator: true },
    // multi-line operations
    ...(runtimeStore.selectedLines.size < 2
      ? []
      : [
          {
            label: tt.line.combineLines(),
            icon: 'mdi mdi-format-align-middle',
            command: combineLines,
            tip: getHotkeyStr('combineLines'),
          },
          { separator: true },
        ]),
    {
      label: tt.line.insertLineAbove(),
      icon: 'mdi mdi-arrow-up',
      command: insertLineBefore,
    },
    {
      label: tt.line.insertLineBelow(),
      icon: 'mdi mdi-arrow-down',
      command: insertLineAfter,
    },
    {
      label: tt.line.duplicateLine(),
      icon: 'mdi mdi-plus-box-multiple-outline',
      command: duplicateLine,
    },
    {
      label: tt.line.deleteLine(),
      icon: 'mdi mdi-trash-can-outline',
      command: deleteLine,
      tip: getHotkeyStr('delete'),
    },
  ])
  //#endregion

  //#region Syllable
  function insertSyl(delta: 0 | 1) {
    if (lineIndex.value === undefined || sylIndex.value === undefined) return
    const parent = coreStore.lyricLines[lineIndex.value]!
    const newSyllable = coreStore.newSyllable()
    parent.syllables.splice(sylIndex.value + delta, 0, newSyllable)
    runtimeStore.selectLineSyl(parent, newSyllable)
    nextTick(() => staticStore.syllableHooks.get(newSyllable.id)?.focusInput())
  }
  const insertSylBefore = () => insertSyl(0)
  const insertSylAfter = () => insertSyl(1)

  function deleteSyl() {
    if (lineIndex.value === undefined || sylIndex.value === undefined) return
    const parent = coreStore.lyricLines[lineIndex.value]!
    parent.syllables.splice(sylIndex.value, 1)
  }

  const sylMenuItems = computed<MenuItem[]>(() => [
    {
      label: tt.shared.cut(),
      icon: 'mdi mdi-content-cut',
      command: execCut,
    },
    {
      label: tt.shared.copy(),
      icon: 'mdi mdi-content-copy',
      command: execCopy,
    },
    {
      label: tt.shared.paste(),
      icon: 'mdi mdi-content-paste',
      command: execPaste,
    },
    { separator: true },
    {
      label: tt.syllable.insertSylBefore(),
      icon: 'mdi mdi-arrow-left',
      command: insertSylBefore,
    },
    {
      label: tt.syllable.insertSylAfter(),
      icon: 'mdi mdi-arrow-right',
      command: insertSylAfter,
    },
    {
      label: tt.syllable.breakLineAtSyl(),
      icon: 'mdi mdi-subdirectory-arrow-left',
      command: breakLine,
      tip: getHotkeyStr('breakLine'),
    },
    {
      label: tt.syllable.deleteSyl(),
      icon: 'mdi mdi-trash-can-outline',
      command: deleteSyl,
      tip: getHotkeyStr('delete'),
    },
  ])
  //#endregion

  const menuItemsMap = {
    blank: blankMenuItems,
    line: lineMenuItems,
    lineInsert: lineInsertMenuItems,
    syl: sylMenuItems,
  } as const

  return menuItemsMap
}
