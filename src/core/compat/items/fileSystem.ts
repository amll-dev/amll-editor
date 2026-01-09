import { t } from '@i18n'

import type { Compatibility as CP } from '..'

const tt = t.compat.fileSystem

const fileSystemInfo = {
  key: 'fileSystem',
  name: tt.name(),
  description: tt.description(),
  referenceUrls: [
    {
      label: 'Can I Use: showOpenFilePicker',
      url: 'https://caniuse.com/mdn-api_window_showopenfilepicker',
    },
  ],
  severity: 'warn',
  effect: tt.effect(),
} as const satisfies CP.CompatibilityInfo

const meet =
  window.isSecureContext &&
  typeof showOpenFilePicker === 'function' &&
  typeof showSaveFilePicker === 'function' &&
  typeof FileSystemHandle === 'function'

function findWhy(): string | undefined {
  if (meet) return undefined
  if (!window.isSecureContext) return t.compat.sharedReasons.insecureContext()
  return tt.apiNotSupported()
}
const why = findWhy()

export const fileSystemItem = {
  ...fileSystemInfo,
  meet,
  why,
} as const satisfies CP.CompatibilityItem
