import type { Equal, Expect } from '@utils/types'

import { clipboardItem } from './items/clipboard'
import { fileSystemItem } from './items/fileSystem'
import { sharedArrayBufferItem } from './items/sharedArrayBuffer'
import type { Compatibility as CP } from './types'

export type { Compatibility } from './types'

export const compatibilityList = [
  fileSystemItem,
  clipboardItem,
  sharedArrayBufferItem,
] as const satisfies readonly CP.CompatibilityItem[]

export const compatibilityMap = {
  [fileSystemItem.key]: fileSystemItem.meet,
  [clipboardItem.key]: clipboardItem.meet,
  [sharedArrayBufferItem.key]: sharedArrayBufferItem.meet,
} as const satisfies Record<string, boolean>

type _Check = Expect<
  Equal<(typeof compatibilityList)[number]['key'], keyof typeof compatibilityMap>
>
