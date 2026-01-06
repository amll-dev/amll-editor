import type { Persist } from '@core/types'

import type { Prettify } from '@utils/types'

export namespace Convert {
  export interface FormatCaption {
    name: string
    description?: string
    reference?: {
      name: string
      url: string
    }[]
  }
  export interface FormatManifest {
    mime: string
    accept: string[]
    example?: string
  }
  export interface FormatHandler {
    parser: (content: string) => Persist
    stringifier: (data: Persist) => string
  }
  export type Format = Prettify<FormatCaption & FormatManifest & FormatHandler>
}
