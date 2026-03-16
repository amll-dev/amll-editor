import type { Convert as CV } from '../../types'
import { parseTTML } from './parse'
import { stringifyTTML } from './stringify'

export { parseTTML } from './parse'
export { stringifyTTML } from './stringify'

export const ttmlReg: CV.FormatHandler = {
  parser: parseTTML,
  stringifier: stringifyTTML,
}
