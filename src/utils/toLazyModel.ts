import { type Ref, ref, watch } from 'vue'

import type { SimpleType } from './types'

/**
 * Creates a lazy two-way binding model,
 * where changes to the internal model conditionally flush to the external model,
 * while changes to the external are always reflected in the internal.
 *
 * **Be aware**: if not used in setup, should call unbind manually to avoid memory leaks.
 *
 * @param externalModel Source model to bind to.
 * @param flushIf A condition function to determine when to flush changes to the external model.
 * @returns An internal model, a flush function and an unbind function.
 */
export function toLazyModel<T extends SimpleType>(
  externalModel: Ref<T>,
  flushIf?: () => boolean,
): [internalModel: Ref<T>, flush: () => void, unbind: () => void] {
  const internalModel = ref(externalModel.value) as Ref<T>
  const flush = () => (externalModel.value = internalModel.value)
  const unwatchHandlers: (() => void)[] = []
  unwatchHandlers.push(watch(externalModel, (newVal) => (internalModel.value = newVal)))
  if (flushIf)
    unwatchHandlers.push(
      watch(internalModel, () => {
        if (flushIf()) flush()
      }),
    )
  const unbind = () => {
    unwatchHandlers.forEach((unwatch) => unwatch())
  }
  return [internalModel, flush, unbind] as const
}
