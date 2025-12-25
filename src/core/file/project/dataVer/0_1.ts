/**
 * Data version 0.1
 *
 * CHANELOG (v0.0 -> v0.1):
 * - Rename "words" to "syllables"
 * - Rename "lyricLines" to "lines"
 * - Remove "currentplaceholdingBeat" from syllables
 */
export interface ProjData_0_1 {
  dataVersion: 'ALDv0.1'

  metadata: Record<string, string[]>
  lines: {
    id: string
    translation: string
    romanization: string
    background: boolean
    duet: boolean
    startTime: number
    endTime: number
    syllables: {
      id: string
      startTime: number
      endTime: number
      text: string
      romanization: string
      placeholdingBeat: number
      bookmarked: boolean
    }[]
    ignoreInTiming: boolean
    bookmarked: boolean
  }[]
}
