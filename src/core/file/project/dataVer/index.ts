import type { Equal, Expect } from '@utils/types'

import type { ProjData_0_0 } from './0_0'
export type { ProjData_0_0 } from './0_0'

export const supportedProjDataVersions = ['ALDv0.0'] as const
export type SupportedProjData = ProjData_0_0
export type LatestProjData = ProjData_0_0

export type SupportedProjDataFileVersion = (typeof supportedProjDataVersions)[number]

type _Checker = Expect<Equal<SupportedProjDataFileVersion, SupportedProjData['dataVersion']>>
