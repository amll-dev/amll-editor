import { t } from '@i18n'

import type { Compatibility as CP } from '..'

const tt = t.compat.sharedArrayBuffer

const sharedArrayBufferInfo = {
  key: 'sharedArrayBuffer',
  name: tt.name(),
  description: tt.description(),
  referenceUrls: [
    { label: 'Can I Use: Shared Array Buffer', url: 'https://caniuse.com/sharedarraybuffer' },
  ],
  severity: 'warn',
  effect: tt.effect(),
} as const satisfies CP.CompatibilityInfo

const meet =
  window.isSecureContext && window.crossOriginIsolated && typeof SharedArrayBuffer === 'function'

function findWhy(): string | undefined {
  if (meet) return undefined
  if (!window.isSecureContext) return t.compat.sharedReasons.insecureContext()
  if (!window.crossOriginIsolated) {
    if (import.meta.env.VITE_COI_WORKAROUND) return tt.coiWorkaround()
    else return tt.coiRequired()
  }
  return tt.apiNotSupported()
}
const why = findWhy()

export const sharedArrayBufferItem = {
  ...sharedArrayBufferInfo,
  meet,
  why,
} as const satisfies CP.CompatibilityItem
