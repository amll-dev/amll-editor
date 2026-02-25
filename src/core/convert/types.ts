import type { Persist } from '@core/types'

import type { Prettify } from '@utils/types'

import type { portFormats } from '.'

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
  export interface PortFormatWithKey extends Format {
    key: PortFormatKey
  }
  export type PortFormatMap = Record<PortFormatKey, PortFormatWithKey>

  export type PortFormatKey = (typeof portFormats)[number]
  export type AllFormatKey = 'alp' | 'ttml' | PortFormatKey
}
