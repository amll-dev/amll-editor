import type { Compatibility as CP } from '..'

const fileSystemInfo = {
  key: 'fileSystem',
  name: '文件系统 API',
  description:
    '文件系统 API (File System API) 允许网页在用户授权后读写磁盘上的文件，提供接近原生的文件操作能力。',
  referenceUrls: [
    {
      label: 'Can I Use: showOpenFilePicker',
      url: 'https://caniuse.com/mdn-api_window_showopenfilepicker',
    },
  ],
  severity: 'warn',
  effect: '保存文件时无法直接写入，而是通过浏览器下载；自动保存不可用。',
} as const satisfies CP.CompatibilityInfo

const meet =
  window.isSecureContext &&
  typeof showOpenFilePicker === 'function' &&
  typeof showSaveFilePicker === 'function' &&
  typeof FileSystemHandle === 'function'

function findWhy(): string | undefined {
  if (meet) return undefined
  if (!window.isSecureContext) return '未在安全上下文中运行。需要 HTTPS 或从本地回环访问。'
  return '浏览器不支持文件系统相关的 API。此 API 在 Chromium 86 及以上版本中支持，Firefox 和 Safari 暂不支持。'
}
const why = findWhy()

export const fileSystemItem = {
  ...fileSystemInfo,
  meet,
  why,
} as const satisfies CP.CompatibilityItem
