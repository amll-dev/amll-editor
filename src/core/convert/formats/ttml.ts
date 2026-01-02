import MANIFEST from '../manifest.json'
import type { Convert as CV } from '../types'
import { parseTTML } from './ttmlParse'
import { stringifyTTML } from './ttmlStringify'

export { parseTTML } from './ttmlParse'
export { stringifyTTML } from './ttmlStringify'

export const ttmlReg: CV.Format = {
  ...MANIFEST.ttml,
  parser: parseTTML,
  stringifier: stringifyTTML,
}
