import { loadPyodide, version as pyodideVersion } from 'pyodide'
import silabeadorPy from './silabeador.py?raw'
import exceptionsLst from './exceptions.lst?raw'

export interface SilabeadorSplitMessage {
  id: string
  words: string[]
}
export interface SilabeadorSplitResult {
  id: string
  syllables: string[][]
}

async function initPyodide() {
  const pyodide = await loadPyodide({
    indexURL: `https://cdn.jsdelivr.net/pyodide/v${pyodideVersion}/full/`,
  })
  return pyodide
}
async function loadSilabeador() {
  const pyodide = await initPyodide()
  pyodide.FS.writeFile('exceptions.lst', exceptionsLst)
  await pyodide.runPythonAsync(silabeadorPy)
  return pyodide
}

const silabeadorReadyPromise = loadSilabeador()

self.onmessage = async (event: MessageEvent<SilabeadorSplitMessage>) => {
  const { id, words } = event.data
  const pyodide = await silabeadorReadyPromise
  const result = pyodide.runPython(`split_words(${JSON.stringify(words)})`)
  const syllables: string[][] = result.toJs({ deep: true })
  console.log(syllables)
  result.destroy()
  self.postMessage({ id, syllables } as SilabeadorSplitResult)
}
