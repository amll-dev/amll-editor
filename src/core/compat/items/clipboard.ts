import { t } from '@i18n'

import type { Compatibility as CP } from '..'

const tt = t.compat.clipboard

const clipboardInfo = {
  key: 'clipboard',
  name: tt.name(),
  description: tt.description(),
  referenceUrls: [
    { label: 'Can I Use: async-clipboard', url: 'https://caniuse.com/async-clipboard' },
  ],
  severity: 'warn',
  effect: tt.effect(),
} as const satisfies CP.CompatibilityInfo

const meet =
  window.isSecureContext &&
  'clipboard' in navigator &&
  'readText' in navigator.clipboard &&
  'writeText' in navigator.clipboard

function findWhy(): string | undefined {
  if (meet) return undefined
  if (!window.isSecureContext) return t.compat.sharedReasons.insecureContext()
  return tt.apiNotSupported()
}
const why = findWhy()

export const clipboardItem = {
  ...clipboardInfo,
  meet,
  why,
} as const satisfies CP.CompatibilityItem
