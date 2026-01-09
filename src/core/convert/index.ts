import { t } from '@i18n'

import { lrcReg } from './formats/lrc'
import { lrcA2Reg } from './formats/lrca2'
import { qrcReg } from './formats/qrc'
import { splReg } from './formats/spl'
import { yrcReg } from './formats/yrc'
import MANIFEST from './manifest.json'
import type { Convert as CV } from './types'

export type { Convert } from './types'

export { detectFormat } from './detect'

export const portFormats = ['lrc', 'lrcA2', 'yrc', 'qrc', 'spl'] as const

const portFormatHandlers: Record<CV.PortFormatKey, CV.FormatHandler> = {
  lrc: lrcReg,
  lrcA2: lrcA2Reg,
  yrc: yrcReg,
  qrc: qrcReg,
  spl: splReg,
} as const

const tt = t.formats.sharedReferences
const formatReferences: Partial<Record<CV.PortFormatKey, CV.FormatCaption['reference']>> = {
  lrc: [{ name: tt.wikipedia(), url: 'https://wikipedia.org/wiki/LRC_(file_format)' }],
  lrcA2: [{ name: tt.wikipedia(), url: 'https://en.wikipedia.org/wiki/LRC_(file_format)' }],
  spl: [{ name: tt.officialDoc(), url: 'https://moriafly.com/standards/spl.html' }],
}

export const portFormatRegister: CV.PortFormatWithKey[] = (
  [...Object.entries(portFormatHandlers)] as [CV.PortFormatKey, CV.FormatHandler][]
).map(([key, handler]) => {
  const manifestItem: CV.FormatManifest = MANIFEST[key]
  return {
    key,
    name: t.formats[key].name(),
    description: t.formats[key].description(),
    reference: formatReferences[key],
    ...manifestItem,
    ...handler,
  }
})

export const portFormatRegisterMap = Object.fromEntries(
  portFormatRegister.map((fmt) => [fmt.key, fmt]),
) as CV.PortFormatMap
