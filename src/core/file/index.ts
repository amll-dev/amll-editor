import { detectFormat, portFormatRegister } from '@core/convert'
import { parseTTML, stringifyTTML, ttmlReg } from '@core/convert/formats/ttml'
import { readonly, ref } from 'vue'
import { collectProjectData, makeProjectFile, parseProjectFile } from './project'
import { exportPersist, importPersist } from '@states/services/port'
import { useStaticStore } from '@states/stores'
import { breakExtension } from '@utils/breakExtension'
import type { ValueOf } from '@utils/types'
import { editHistory } from '@states/services/history'

export { simpleChooseFile, simpleSaveFile } from './simple'
export { simpleChooseTextFile, simpleSaveTextFile } from './simple'

// Native format (*.alp) and TTML format (*.ttml) are the first-class supported formats
// When save, they are written directly by default

// Other formats are supported via import/export services
// Won't be saved directly

const BackingFmt = {
  TTML: 'TTML',
  ALP: 'ALP',
} as const
type BackingFmt = ValueOf<typeof BackingFmt>

const allSupportedExt = new Set([
  '.alp',
  '.ttml',
  ...portFormatRegister.map((f) => f.accept).flat(),
]) as Set<`.${string}`>
const allSupportedExtArr = [...allSupportedExt]
const alpPickerType: FilePickerAcceptType[] = [
  {
    description: 'AMLL Editor 工程',
    accept: { 'application/alp': ['.alp'] },
  },
]
const ttmlPickerType: FilePickerAcceptType[] = [
  {
    description: ttmlReg.name,
    accept: { 'application/ttml+xml': ['.ttml'] },
  },
]
const allPickerTypes: FilePickerAcceptType[] = [
  {
    description: '所有支持的格式',
    accept: { 'application/alp': allSupportedExtArr },
  },
  ...alpPickerType,
  ...ttmlPickerType,
  ...portFormatRegister.map((format) => ({
    description: format.name,
    accept: { [`text/${format.accept[0]}`]: format.accept },
  })),
]

let fileSystemHandle: FileSystemFileHandle | null = null
let currBackFormat: BackingFmt = BackingFmt.ALP
let createdAtRef = ref<Date | null>(null)
const displayFilenameRef = ref<string>('未命名.alp')

/**
 * Handle opening of any known file format.
 * @throws User cancel; unsupported format; parsing errors.
 * @returns Filename
 */
async function openFile() {
  const [handle] = await showOpenFilePicker({
    types: allPickerTypes,
    excludeAcceptAllOption: true,
    id: 'amll-ttml-tool-file-open',
  })
  const [, ext] = breakExtension(handle.name)
  if (!allSupportedExt.has(`.${ext}`)) throw new Error('Unsupported file format.')
  const file = await handle.getFile()
  if (ext === 'alp') {
    await handleProjFile(file)
    fileSystemHandle = handle
    editHistory.markSaved()
    handle.createWritable()
  } else if (ext === 'ttml') {
    await handleTTMLFile(file)
    fileSystemHandle = handle
    editHistory.markSaved()
    handle.createWritable()
  } else {
    await handleMiscFile(file)
    fileSystemHandle = null
  }
  return handle.name
}
/**
 * Handle opening of project file (*.alp).
 * @throws User cancel; unsupported format; parsing errors.
 * @returns Filename
 */
async function openProjFile() {
  const [handle] = await showOpenFilePicker({
    types: alpPickerType,
    excludeAcceptAllOption: true,
    id: 'amll-ttml-tool-file-open',
  })
  if (!handle) return null
  const file = await handle.getFile()
  await handleProjFile(file)
  fileSystemHandle = handle
  editHistory.markSaved()
  return handle.name
}
/**
 * Handle opening of TTML file (*.ttml).
 * @throws User cancel; unsupported format; parsing errors.
 * @returns Filename
 */
async function openTTMLFile() {
  const [handle] = await showOpenFilePicker({
    types: ttmlPickerType,
    excludeAcceptAllOption: true,
    id: 'amll-ttml-tool-file-open',
  })
  if (!handle) return null
  const file = await handle.getFile()
  await handleTTMLFile(file)
  fileSystemHandle = handle
  editHistory.markSaved()
  return handle.name
}

async function handleProjFile(file: File) {
  const { data, createdAt, audioFile } = await parseProjectFile(file)
  importPersist(data)
  if (audioFile) useStaticStore().audio.mount(audioFile)
  createdAtRef.value = createdAt || null
  displayFilenameRef.value = file.name
  currBackFormat = BackingFmt.ALP
}
async function handleTTMLFile(file: File) {
  const text = await file.text()
  const data = parseTTML(text)
  importPersist(data)
  createdAtRef.value = new Date()
  displayFilenameRef.value = file.name
  currBackFormat = BackingFmt.TTML
}
async function handleMiscFile(file: File) {
  const [name, ext] = breakExtension(file.name)
  const text = await file.text()
  const format = detectFormat(ext, text)
  const data = format.parser(text)
  importPersist(data)
  createdAtRef.value = new Date()
  displayFilenameRef.value = `${name}.alp`
}

/**
 * Save to backing format file
 * @throws user cancel; write errors.
 * @returns Filename
 */
async function saveFile() {
  if (!fileSystemHandle) {
    console.log('No file handle, invoking Save As...')
    await saveAsFile()
    return
  }
  const writeable = await fileSystemHandle.createWritable()
  let blob: Blob
  if (currBackFormat === BackingFmt.ALP) {
    const collected = collectProjectData()
    blob = await makeProjectFile(collected)
  } else if (currBackFormat === BackingFmt.TTML) {
    const persist = exportPersist()
    const str = stringifyTTML(persist)
    blob = new Blob([str], { type: 'application/xml' })
  } else throw new Error('Unsupported backing format.')
  await writeable.write(blob)
  await writeable.close()
  editHistory.markSaved()
  return fileSystemHandle.name
}
/**
 * Save as a new file
 * Only for backing formats (*.alp, *.ttml)
 * For other formats, use export service instead.
 * @throws User cancel; write errors.
 * @returns Filename
 */
export async function saveAsFile() {
  const types: FilePickerAcceptType[] = [...alpPickerType, ...ttmlPickerType]
  const handle = await showSaveFilePicker({
    types,
    excludeAcceptAllOption: true,
    id: 'amll-ttml-tool-file-save-as',
    suggestedName: displayFilenameRef.value,
  })
  const writeable = await handle.createWritable()
  let blob: Blob
  const [, ext] = breakExtension(handle.name)
  if (ext === 'alp') {
    const collected = collectProjectData()
    blob = await makeProjectFile(collected)
    currBackFormat = BackingFmt.ALP
  } else if (ext === 'ttml') {
    const persist = exportPersist()
    const str = stringifyTTML(persist)
    blob = new Blob([str], { type: 'application/xml' })
    currBackFormat = BackingFmt.TTML
  } else throw new Error('Unsupported backing format.')
  await writeable.write(blob)
  await writeable.close()
  fileSystemHandle = handle
  displayFilenameRef.value = handle.name
  editHistory.markSaved()
  return handle.name
}

export const FileState = {
  openFile,
  openProjFile,
  openTTMLFile,
  saveFile,
  saveAsFile,
  createdAtComputed: readonly(createdAtRef),
  displayFilenameComputed: readonly(displayFilenameRef),
}
