import JSZip from 'jszip'
import { latestProjManifestVersion, type LatestProjManifest } from './fileVer'
import { latestProjDataVersion, type LatestProjData } from './dataVer'
import type { ProjPayload } from '.'
import type { Persist } from '@core/types'

const DATA_FILENAME = 'data.json'
const FILE_VERSION = latestProjManifestVersion
const DATA_VERSION = latestProjDataVersion

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

function makeProjectData(persist: Persist): LatestProjData {
  const { metadata, lyricLines: persistLines } = persist
  const dataLines: LatestProjData['lines'] = persistLines.map((line) => {
    const {
      id,
      translation,
      romanization,
      background,
      duet,
      startTime,
      endTime,
      ignoreInTiming,
      bookmarked,
      words,
    } = line
    return {
      id,
      translation,
      romanization,
      background,
      duet,
      startTime,
      endTime,
      ignoreInTiming,
      bookmarked,
      syllables: words.map(
        ({ id, startTime, endTime, text, romanization, placeholdingBeat, bookmarked }) => ({
          id,
          startTime,
          endTime,
          text,
          romanization,
          placeholdingBeat,
          bookmarked,
        }),
      ),
    }
  })
  return {
    dataVersion: DATA_VERSION,
    metadata,
    lines: dataLines,
  }
}
