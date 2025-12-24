import type { Compatibility as CP } from './types'

const secureContextInfo: CP.CompatibilityInfo = {
  key: 'secureContext',
  name: '安全上下文',
  description: '浏览器是否在安全上下文下运行。',
  severity: 'warning',
  referenceUrls: [
    {
      label: 'MDN：安全上下文',
      url: 'https://developer.mozilla.org/zh-CN/docs/Web/Security/Defenses/Secure_Contexts',
    },
  ],
}

const meet = window.isSecureContext

function findWhy(): string | undefined {
  if (meet) return undefined
  if (location.protocol === 'http:') return '当前页面通过不安全的 HTTP 协议加载。'
  if (location.protocol === 'file:') return '当前页面通过本地文件协议加载。'
  return undefined
}
const why = findWhy()

export const secureContextItem: CP.CompatibilityItem = {
  ...secureContextInfo,
  meet,
  why,
}
