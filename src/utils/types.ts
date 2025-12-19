export type TimeoutHandle = ReturnType<typeof setTimeout>

export type ValueOf<T extends Record<PropertyKey, unknown>> = T[keyof T]

export type Prettify<T> = {
  [K in keyof T]: T[K]
} & {}
