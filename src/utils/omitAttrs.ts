import type { Prettify, UnionKeys } from './types'

/**
 * Omit specified keys from an object, supporting union types and auto completion.
 * @param obj The source object
 * @param keys The keys to omit
 * @returns A new object without the specified keys
 */
export function omitAttrs<T extends object, const K extends UnionKeys<T>>(
  obj: T,
  ...keys: K[]
): Prettify<Omit<T, K>> {
  const result = { ...obj }
  for (const key of keys) {
    if (key in result) delete result[key]
  }
  return result
}
