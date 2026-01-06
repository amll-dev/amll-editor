// Be aware: here're 3 'syllabify's
// 1. syllabify is the name of this module
// 2. syllabify is also the name of an external library for Russian syllabification
// 3. syllabify-fr is another external library for French syllabification
import { t } from '@i18n'

import { basicSplit } from './engines/basic'
import { compromiseSplit } from './engines/compromise'
import { japaneseSplit } from './engines/japanese'
import { prosoticSplit } from './engines/prosotic'
import { silabeadorSplit } from './engines/silabeador'
import { syllabifySplit } from './engines/syllabify'
import { syllabifyFrSplit } from './engines/syllabifyFr'
import type { Syllabify as SL } from './types'

export type { Syllabify } from './types'

const rawEngines = [
  {
    key: 'basic',
    processor: basicSplit,
  },
  {
    key: 'jaBasic',
    processor: japaneseSplit,
  },
  {
    key: 'prosodic',
    processor: prosoticSplit,
  },
  {
    key: 'silabeador',
    processor: silabeadorSplit,
  },
  {
    key: 'compromise',
    processor: compromiseSplit,
    notRecommend: true,
  },
  {
    key: 'syllabifyFr',
    processor: syllabifyFrSplit,
    notRecommend: true,
  },
  {
    key: 'syllabify',
    processor: syllabifySplit,
    notRecommend: true,
  },
] as const

export type EngineKey = (typeof rawEngines)[number]['key']

const engines: SL.EngineWithKey[] = rawEngines.map((o) => {
  const tItem = t.syllabify.engines[o.key]
  return {
    name: tItem.name(),
    description: tItem.description(),
    ...o,
  }
})

export default engines
