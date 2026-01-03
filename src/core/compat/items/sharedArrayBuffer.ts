import type { Compatibility as CP } from '..'

const sharedArrayBufferInfo = {
  key: 'sharedArrayBuffer',
  name: '共享内存缓冲区',
  description: 'SharedArrayBuffer 共享内存缓冲区允许在多个线程间高效共享数据。',
  referenceUrls: [
    { label: 'Can I Use: Shared Array Buffer', url: 'https://caniuse.com/sharedarraybuffer' },
  ],
  severity: 'warning',
  effect: '频谱图功能不可用。',
} as const satisfies CP.CompatibilityInfo

const meet =
  window.isSecureContext && window.crossOriginIsolated && typeof SharedArrayBuffer === 'function'

function findWhy(): string | undefined {
  if (meet) return undefined
  if (!window.isSecureContext)
    return '浏览器未在安全上下文下运行。需要 HTTPS，或从本地回环地址访问。'
  if (!window.crossOriginIsolated)
    return '未启用跨源隔离（COOP/COEP）。在不支持自定义 HTTP 标头的环境下，本项目应会自动通过 Service Worker 尝试启用跨源隔离，请联系部署方。'
  return '浏览器不支持 SharedArrayBuffer。此 API 在 Chromium 68、Firefox 79、Safari 15.2 或以上版本中支持。'
}
const why = findWhy()

export const sharedArrayBufferItem = {
  ...sharedArrayBufferInfo,
  meet,
  why,
} as const satisfies CP.CompatibilityItem
