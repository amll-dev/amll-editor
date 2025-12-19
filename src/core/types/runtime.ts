import type { ValueOf } from '@utils/types'

export const View = {
  Content: 'Content',
  Timing: 'Timing',
  Preview: 'Preview',
} as const
export type View = ValueOf<typeof View>
