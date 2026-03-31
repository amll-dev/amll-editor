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
  impact: tt.impact(),
} as const satisfies CP.CompatibilityInfo

const meet =
  globalThis.isSecureContext && globalThis.crossOriginIsolated && typeof SharedArrayBuffer === 'function'

function findWhy(): string | undefined {
  if (meet) return undefined
  if (!globalThis.isSecureContext) return t.compat.sharedReasons.insecureContext()
  if (!globalThis.crossOriginIsolated) {
    return import.meta.env.VITE_COI_WORKAROUND ? tt.coiWorkaround() : tt.coiRequired();
  }
  return tt.apiNotSupported()
}
const why = findWhy()

export const sharedArrayBufferItem = {
  ...sharedArrayBufferInfo,
  meet,
  why,
} as const satisfies CP.CompatibilityItem
