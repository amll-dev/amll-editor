import type { TimeoutHandle } from '@/utils/types'
import type { Rewrite } from '../register'
import silabeadorWorker from './silabeador.worker?worker'
import { nanoid } from 'nanoid'
import type { SilabeadorSplitMessage, SilabeadorSplitResult } from './silabeador.worker'
import { basicSplit } from '../basic'

let globalSilabeador: ReturnType<typeof useSilabeador> | null = null

export async function silabeadorSplit(
  strs: string[],
  rewrites: Readonly<Rewrite>[],
  caseSensitive: boolean,
) {
  if (!globalSilabeador || !globalSilabeador.isAlive()) {
    globalSilabeador = useSilabeador(2 * 60 * 1000)
  }
  const { split } = globalSilabeador
  const pendingWordsSet = new Set<string>()
  basicSplit(strs, rewrites, caseSensitive, (token) => {
    pendingWordsSet.add(token)
    return []
  })
  const pendingWords = [...pendingWordsSet]
  console.log(pendingWords)
  const results = await split(pendingWords)
  const resultsMap = new Map<string, string[]>()
  pendingWords.forEach((word, index) => {
    resultsMap.set(word, results[index]!)
    console.log('Silabeador word result:', resultsMap.get(word))
  })
  console.log('Silabeador results:', resultsMap)
  return basicSplit(strs, rewrites, caseSensitive, (token) => {
    return resultsMap.get(token) || [token]
  })
}

function useSilabeador(life?: number) {
  let alive = true
  let timer: TimeoutHandle
  function resetTimer() {
    if (life === undefined || !isFinite(life)) return
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      worker.terminate()
      alive = false
    }, life)
  }
  resetTimer()
  const worker = new silabeadorWorker()
  const resolvers = new Map<string, (value: string[][]) => void>()
  function split(tokens: string[]): Promise<string[][]> {
    if (!alive) throw new Error('Silabeador worker has been terminated')
    resetTimer()
    return new Promise((resolve) => {
      const id = nanoid()
      resolvers.set(id, resolve)
      worker.postMessage({ id, words: tokens } satisfies SilabeadorSplitMessage)
    })
  }
  worker.onmessage = (event: MessageEvent<SilabeadorSplitResult>) => {
    const { id, syllables } = event.data
    const resolve = resolvers.get(id)
    if (!resolve) throw new Error(`No resolver found for Silabeador message id: ${id}`)
    resolvers.delete(id)
    resolve(syllables)
  }
  const isAlive = () => alive
  return { split, isAlive }
}
