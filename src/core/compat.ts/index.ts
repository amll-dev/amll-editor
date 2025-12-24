import { clipboardItem } from './clipboard'
import { fileSystemItem } from './fileSystem'
import { secureContextItem } from './secureContext'
import type { Compatibility as CP } from './types'

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
