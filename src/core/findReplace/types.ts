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
    field: 'translation' | 'roman'
  }
  export interface PosWhole extends PosBasic {
    field: 'whole'
  }
  export interface PosWord extends PosBasic {
    field: 'word'
    wordIndex: number
  }
  export interface PosMultiWord extends PosBasic {
    field: 'multiWord'
    startWordIndex: number
    endWordIndex: number
  }
  export type Pos = PosLine | PosWord | PosMultiWord
  export type AbstractPos = PosWhole | Pos
  export type Dir = 'next' | 'prev'
}
