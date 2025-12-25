import type { LyricLine, MetadataKey } from './core'

export interface Persist {
  metadata: Record<MetadataKey, string[]>
  lines: LyricLine[]
}
