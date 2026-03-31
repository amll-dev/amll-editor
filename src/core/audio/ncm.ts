import { until } from '@vueuse/core'
import { ref, shallowRef } from 'vue'

import NcmResolveWorker from '@vendors/ncm/ncm.worker.js?worker'

type PendingTask = {
  resolve: (data: ArrayBuffer) => void
  reject: (err: unknown) => void
}

export function useNcmResolver() {
  const worker = shallowRef<Worker | null>(null)
  const ready = ref(false)
  const errorMessage = ref<string | null>(null)
  let requestId = 0

  const pending = new Map<number, PendingTask>()

  function ensureWorker() {
    if (worker.value) return
    const w = new NcmResolveWorker()
    worker.value = w

    w.addEventListener('message', (e) => {
      const { type, payload, error } = e.data
      switch (type) {
        case 'wasm-ready': {
          ready.value = true
          break
        }
        case 'error': {
          errorMessage.value = error || payload?.error || 'Unknown error'
          break
        }
        case 'extracted': {
          const task = pending.get(payload.index)
          if (task) {
            task.resolve(payload.result)
            pending.delete(payload.index)
          }
          break
        }
        // No default
      }
    })

    w.addEventListener('error', (err) => {
      errorMessage.value = err.message || 'Worker error'
    })
  }

  function waitForReady(): Promise<unknown> {
    return Promise.race([
      until(ready).toBe(true),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('WASM initialization timed out')), 10_000),
      ),
    ])
  }

  async function transform(file: Blob | File): Promise<Blob> {
    ensureWorker()
    if (!ready.value) await waitForReady()

    const fileData = await file.arrayBuffer()
    const id = requestId++

    const baseNameWithoutExtension =
      file instanceof File ? file.name.replace(/\.ncm$/i, '') : 'output'

    const w = worker.value
    if (!w) throw new Error('Worker not initialized')
    return new Promise<ArrayBuffer>((resolve, reject) => {
      pending.set(id, { resolve, reject })
      w.postMessage({
        type: 'extract',
        payload: { index: id, fileData, baseNameWithoutExtension },
      })
    }).then((resultBuffer) => new Blob([resultBuffer], { type: 'audio/mpeg' }))
  }

  function destroy() {
    if (worker.value) {
      worker.value.postMessage({ type: 'destroy' })
      worker.value.terminate()
      worker.value = null
      ready.value = false
      errorMessage.value = null
      for (const { reject } of pending.values()) {
        reject(new Error('Worker destroyed'))
      }
      pending.clear()
    }
  }

  return {
    ready,
    errorMessage,
    transform,
    destroy,
  }
}
