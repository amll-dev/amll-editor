import { lrcReg } from './formats/lrc'
import { lrcA2Reg } from './formats/lrca2'
import { splReg } from './formats/spl'
import type { Convert } from './types'

export function detectLrcVariants(content: string): Convert.Format {
  const hasWordLevel = /(?<!^(\[[^\]+]\])*)[<[][>\]]/.test(content)
  if (!hasWordLevel) return lrcReg
  const sqBracketEnding = /(?<!\])\[\d{1,3}:\d{1,2}\.\d{1,3}\d{0,3}\]$/.test(content)
  if (sqBracketEnding) return splReg
  return lrcA2Reg
}
