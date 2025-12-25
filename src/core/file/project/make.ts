import JSZip from 'jszip'
import type { LatestProjManifest } from './fileVer'
import type { LatestProjData } from './dataVer'
import type { ProjPayload } from '.'
import type { Persist } from '@core/types'

const DATA_FILENAME = 'data.json'
const FILE_VERSION = 'ALPv0.0'
const DATA_VERSION = 'ALDv0.0'

export function makeProjectFile({ persist: data, createdAt, audioFile }: ProjPayload) {
  const zip = new JSZip()

  const manifest: LatestProjManifest = {
    createdBy: 'AMLL Editor',
    editorVersion: __VERSION__,
    fileVersion: FILE_VERSION,
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
    dataVersion: DATA_VERSION,
    dataFilename: DATA_FILENAME,
  }
  if (createdAt) manifest.createdAt = createdAt.toISOString()

  const projData: LatestProjData = makeProjectData(data)
  zip.file(DATA_FILENAME, JSON.stringify(projData))

  if (audioFile) {
    zip.file(audioFile.name, audioFile)
    manifest.mediaFilename = audioFile.name
  }

  zip.file('manifest.json', JSON.stringify(manifest))
  return zip.generateAsync({ type: 'blob' })
}

function makeProjectData(data: Persist): LatestProjData {
  return {
    ...data,
    dataVersion: DATA_VERSION,
  }
}
