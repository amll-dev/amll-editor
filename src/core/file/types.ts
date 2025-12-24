export interface FileBackend<BackendFileHandle = unknown> {
  read(
    types: FilePickerAcceptType[],
    tryWrite?: boolean,
  ): Promise<FileReadResult<BackendFileHandle> | null>
  write(handle: BackendFileHandle, blob: Blob): Promise<void>
  writeAs(
    types: FilePickerAcceptType[],
    suggestedBaseName: string,
    blob: Blob,
  ): Promise<FileReadResult<BackendFileHandle> | null>
}

export interface FileReadResult<BackendFileHandle = unknown> {
  handle: BackendFileHandle
  filename: string
  writable: boolean
}
