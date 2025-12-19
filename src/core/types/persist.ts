import type { LyricLine, MetadataKey } from "./core"

export interface Persist {
  metadata: Record<MetadataKey, string[]>
  lyricLines: LyricLine[]
  version?: string
}
