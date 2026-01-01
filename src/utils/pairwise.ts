/**
 * Returns consecutive pairs from the given iterable.
 *
 * Example: `0, 1, 2, 3` -> `[0, 1], [1, 2], [2, 3]`
 */
export function* pairwise<T>(iterable: Iterable<T>): Generator<[T, T], void, unknown> {
  let prev: T | undefined
  let hasPrev = false

  for (const curr of iterable) {
    if (hasPrev) yield [prev!, curr]
    prev = curr
    hasPrev = true
  }
}
