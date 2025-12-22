import type { ValueOf } from '@utils/types'
import { ref } from 'vue'

export { simpleChooseFile, simpleSaveFile } from './simple'
export { simpleChooseTextFile, simpleSaveTextFile } from './simple'

// Native format (*.alp) and TTML format (*.ttml) are the first-class supported formats
// When save, they are written directly by default

// Other formats are supported via import/export services
// Won't be saved directly

const BackingFmt = {
  ALP: 'alp',
  TTML: 'ttml',
} as const
type BackingFmt = ValueOf<typeof BackingFmt>

let backingFormat: BackingFmt = BackingFmt.ALP
let fileSystemHandle: FileSystemFileHandle | null = null
const displayFilenameRef = ref<string>('未命名.alp')
