import type { View } from './runtime'
import type { LyricLine, Metadata } from './core'

export interface SnapShotRuntime {
  currentView: View
  selectedLineIds: string[]
  selectedWordIds: string[]
  lastTouchedLineId: string | undefined
  lastTouchedWordId: string | undefined
}

export interface Snapshot {
  timestamp: number
  core: {
    metadata: Metadata
    lyricLines: LyricLine[]
  }
  firstRuntime: SnapShotRuntime
  lastRuntime?: SnapShotRuntime
}
