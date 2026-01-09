import { t } from '@i18n'

import type { Compatibility as CP } from '..'

const tt = t.compat.mediaSession

const mediaSessionInfo = {
  key: 'mediaSession',
  name: tt.name(),
  description: tt.description(),
  referenceUrls: [
    { label: 'Can I Use: Media Session', url: 'https://caniuse.com/wf-media-session' },
  ],
  severity: 'info',
  impact: tt.impact(),
} as const satisfies CP.CompatibilityInfo

const meet =
  'mediaSession' in navigator &&
  typeof navigator.mediaSession.metadata === 'object' &&
  typeof navigator.mediaSession.setActionHandler === 'function'

function findWhy(): string | undefined {
  if (meet) return undefined
  return tt.apiNotSupported()
}
const why = findWhy()

export const mediaSessionItem = {
  ...mediaSessionInfo,
  meet,
  why,
} as const satisfies CP.CompatibilityItem
