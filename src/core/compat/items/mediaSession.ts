import type { Compatibility as CP } from '..'

const mediaSessionInfo = {
  key: 'mediaSession',
  name: '媒体会话',
  description: '媒体会话 (Media Session) 允许网页自定义媒体通知和响应媒体键事件。',
  referenceUrls: [
    { label: 'Can I Use: Media Session', url: 'https://caniuse.com/wf-media-session' },
  ],
  severity: 'info',
  effect: '将不能从系统媒体控制界面（如锁屏界面或通知中心）控制媒体播放。',
} as const satisfies CP.CompatibilityInfo

const meet =
  'mediaSession' in navigator &&
  typeof navigator.mediaSession.metadata === 'object' &&
  typeof navigator.mediaSession.setActionHandler === 'function'

function findWhy(): string | undefined {
  if (meet) return undefined
  return '浏览器不支持媒体会话相关的 API。此 API 在 Chromium 72、Firefox 82、Safari 15 或以上版本中支持。Firefox Android 目前不支持。'
}
const why = findWhy()

export const mediaSessionItem = {
  ...mediaSessionInfo,
  meet,
  why,
} as const satisfies CP.CompatibilityItem
