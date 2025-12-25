export namespace FindReplace {
  export interface State {
    compiledPattern: RegExp | null
    replaceInput: string
    findInWords: boolean
    findInTranslations: boolean
    findInRoman: boolean
    crossWordMatch: boolean
    wrapSearch: boolean
  }
  export interface Notification {
    severity?: 'success' | 'info' | 'warn' | 'error' | 'secondary' | 'contrast'
    summary: string
    detail?: string
  }
  export interface Actions {
    handleFindNext: () => void
    handleFindPrev: () => void
    handleReplace: () => void
    handleReplaceAll: () => void
  }

  export interface PosBasic {
    lineIndex: number
  }
  export interface PosLine extends PosBasic {
    field: 'TRANSLATION' | 'ROMAN'
  }
  export interface PosWhole extends PosBasic {
    field: 'WHOLE'
  }
  export interface PosSyl extends PosBasic {
    field: 'SYLLABLE'
    sylIndex: number
  }
  export interface PosMultiWord extends PosBasic {
    field: 'MULTISYL'
    startSylIndex: number
    endSylIndex: number
  }
  export type Pos = PosLine | PosSyl | PosMultiWord
  export type AbstractPos = PosWhole | Pos
  export type Dir = 'next' | 'prev'
}
