import type { hotkeyCommands } from './data'

export namespace HotKey {
  export type Command = (typeof hotkeyCommands)[number]
  export interface Key {
    code: string
    ctrl: boolean
    alt: boolean
    shift: boolean
  }
  export type Map = Record<Command, Key[]>
}
