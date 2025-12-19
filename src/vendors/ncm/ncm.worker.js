/**
 * NCM container parser worker.
 * Derived from https://github.com/AthBe1337/ncmdump-web (MIT License)
 * Modified to integrate with this project's playback pipeline.
 *
 * This module performs local decoding for user-supplied files.
 * It does not provide or enable any DRM circumvention functionality.
 */

import createModule from './wasm/ncmdump.js'
import wasmUrl from './wasm/ncmdump.wasm?url'

let wasmModule = null
let isWasmReady = false

createModule({
  locateFile: (path) => (path.endsWith('.wasm') ? wasmUrl : path),
})
  .then((instance) => {
    wasmModule = instance
    isWasmReady = true
    self.postMessage({ type: 'wasm-ready' })
  })
  .catch((err) => {
    self.postMessage({
      type: 'error',
      error: `Failed to load WASM: ${err.message}`,
    })
  })

self.onmessage = async (e) => {
  const { type, payload } = e.data

  if (type === 'extract') {
    let inputDataPtr = null
    try {
      if (!isWasmReady) {
        throw new Error('WASM not ready')
      }

      const fileData = new Uint8Array(payload.fileData)
      const baseName = payload.baseNameWithoutExtension || 'output'

      inputDataPtr = wasmModule._malloc(fileData.length)
      if (!inputDataPtr) {
        throw new Error('Failed to allocate WASM memory for input file data')
      }

      wasmModule.HEAPU8.set(fileData, inputDataPtr)

      const resultView = wasmModule.decryptNCM(inputDataPtr, fileData.length)

      const result = new Uint8Array(resultView.length)
      result.set(resultView)

      self.postMessage(
        {
          type: 'extracted',
          payload: {
            index: payload.index,
            result: result.buffer,
          },
        },
        [result.buffer],
      )
    } catch (error) {
      self.postMessage({
        type: 'error',
        payload: {
          index: payload.index,
          error: error.message,
        },
      })
    } finally {
      if (inputDataPtr) {
        wasmModule._free(inputDataPtr)
      }
    }
  } else if (type === 'destroy') {
    try {
      if (wasmModule && wasmModule._free) {
        wasmModule = null
        isWasmReady = false
      }
      self.postMessage({ type: 'destroyed' })
    } catch (err) {
      self.postMessage({
        type: 'error',
        error: `Failed to release WASM: ${err.message}`,
      })
    }
  }
}
