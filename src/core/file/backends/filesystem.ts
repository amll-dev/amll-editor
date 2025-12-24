import type { FileBackend } from '../types'

export class FileSystemBackend implements FileBackend<FileSystemFileHandle> {
  async read(types: FilePickerAcceptType[], tryWrite = false) {
    const [handle] = await showOpenFilePicker({
      types,
      excludeAcceptAllOption: true,
      id: 'amll-ttml-tool-file-open',
    })
    const writable = tryWrite
      ? await handle
          .createWritable()
          .then((w) => (w.abort(), true))
          .catch(() => false)
      : false
    return {
      handle,
      filename: handle.name,
      writable,
    }
  }
  async write(handle: FileSystemFileHandle, blob: Blob) {
    const writable = await handle.createWritable()
    await writable.write(blob)
    await writable.close()
  }
  async writeAs(types: FilePickerAcceptType[], suggestedBaseName: string, blob: Blob) {
    const handle = await showSaveFilePicker({
      types,
      suggestedName: suggestedBaseName,
      excludeAcceptAllOption: true,
      id: 'amll-ttml-tool-file-save',
    })
    await this.write(handle, blob)
    return {
      handle,
      filename: handle.name,
      writable: true,
    }
  }
}
