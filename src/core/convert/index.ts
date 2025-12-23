export type { Convert } from './types'
import type { Convert as CV } from './types'

export { detectFormat } from './detect'
import { lrcReg } from './formats/lrc'
import { lrcA2Reg } from './formats/lrca2'
import { qrcReg } from './formats/qrc'
import { splReg } from './formats/spl'
import { yrcReg } from './formats/yrc'

export const portFormatRegister: CV.Format[] = [
  lrcReg,
  lrcA2Reg,
  yrcReg,
  qrcReg,
  // ttmlReg,
  splReg,
]
