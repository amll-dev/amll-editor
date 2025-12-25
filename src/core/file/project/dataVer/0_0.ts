export interface ProjData_0_0 {
  dataVersion: 'ALDv0.0'

  metadata: Record<string, string[]>
  lyricLines: {
    id: string
    translation: string
    romanization: string
    background: boolean
    duet: boolean
    startTime: number
    endTime: number
    words: {
      id: string
      startTime: number
      endTime: number
      text: string
      romanization: string
      placeholdingBeat: number
      currentplaceholdingBeat: number
      bookmarked: boolean
    }[]
    ignoreInTiming: boolean
    bookmarked: boolean
  }[]
}
