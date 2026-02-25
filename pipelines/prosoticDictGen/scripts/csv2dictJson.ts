// from SUBTLEXus_syllables-corrected.csv to SUBTLEXus_prosotic.dict.json
import nlpSpeech from 'compromise-speech'
import nlp from 'compromise/tokenize'
import fs from 'fs'
import zlib from 'zlib'

const SRC = './pipelines/prosoticDictGen/SUBTLEXus_syllables-corrected.csv'
const OUT = './public/dicts/SUBTLEXus_prosotic.dict.json.gz'

const data = fs.readFileSync(SRC, 'utf-8').trim()
const lines = data.split(/\r?\n/)

const header = lines[0].split(',')
const syllableIndex = header.indexOf('splitted')
const wordIndex = header.indexOf('word')

const results: Record<string, number[] | number> = {}
const nlpWithPlg = nlp.extend(nlpSpeech)
for (const row of lines.slice(1)) {
  const cols = row.split(',')
  const syllable = cols[syllableIndex].toLowerCase()
  const word = cols[wordIndex].toLowerCase()
  if (word.length <= 1) continue
  const compromiseResult = (nlpWithPlg(word).syllables() as string[][]).flat().join('-')
  if (compromiseResult === syllable) continue
  if (!syllable.includes('-')) {
    results[word] = 0
    continue
  }
  const syllableLengths = syllable.split('-').map((s) => s.length)
  syllableLengths.pop()
  if (syllableLengths.length === 1) results[word] = syllableLengths[0]
  else results[word] = syllableLengths
}

const gzipped = zlib.gzipSync(JSON.stringify(results))
fs.writeFileSync(OUT, gzipped)
