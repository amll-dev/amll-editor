export type { Compatibility } from './types'
import type { Compatibility as CP } from './types'

import { clipboardItem } from './items/clipboard'
import { fileSystemItem } from './items/fileSystem'
import { secureContextItem } from './items/secureContext'

export const compatibilityList: CP.CompatibilityItem[] = [
  secureContextItem,
  fileSystemItem,
  clipboardItem,
]

export const compatibilityMap = {
  secureContext: secureContextItem.meet,
  fileSystem: fileSystemItem.meet,
  clipboard: clipboardItem.meet,
} as const satisfies Record<string, boolean>
