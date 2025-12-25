import type { Equal, Expect } from '@utils/types'

import type { ProjManifest_0_0 } from './0_0'
export type { ProjManifest_0_0 } from './0_0'

export const supportedProjManifestVersions = ['ALPv0.0'] as const
export type SupportedProjManifest = ProjManifest_0_0
export type LatestProjManifest = ProjManifest_0_0

export type SupportedProjManifestFileVersion = typeof supportedProjManifestVersions[number]

type _Checker = Expect<
  Equal<(typeof supportedProjManifestVersions)[number], SupportedProjManifest['fileVersion']>
>
