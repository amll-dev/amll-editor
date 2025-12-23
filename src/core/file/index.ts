import { portFormatRegister } from '@core/convert'
import { ttmlReg } from '@core/convert/formats/ttml'
import { ref } from 'vue'

export { simpleChooseFile, simpleSaveFile } from './simple'
export { simpleChooseTextFile, simpleSaveTextFile } from './simple'

// Native format (*.alp) and TTML format (*.ttml) are the first-class supported formats
// When save, they are written directly by default

// Other formats are supported via import/export services
// Won't be saved directly

const allSupportedExt = new Set([
  '.alp',
  '.ttml',
  ...portFormatRegister.map((f) => f.accept).flat(),
]) as Set<`.${string}`>
const allSupportedExtArr = [...allSupportedExt]
type FSTypes = OpenFilePickerOptions['types']
const filePickerTypes: FSTypes = [
  {
    description: '所有支持的格式',
    accept: { 'application/alp': allSupportedExtArr },
  },
  {
    description: 'AMLL Editor 工程',
    accept: { 'application/alp': ['.alp'] },
  },
  {
    description: ttmlReg.name,
    accept: { 'application/ttml+xml': ['.ttml'] },
  },
  ...portFormatRegister.map((format) => ({
    description: format.name,
    accept: { [`text/${format.accept[0]}`]: format.accept },
  })),
]

// window.__test = () =>
//   showOpenFilePicker({
//     types: filePickerTypes,
//     excludeAcceptAllOption: true,
//     id: 'amll-ttml-tool-file-open',
//   })

let fileSystemHandle: FileSystemFileHandle | null = null
const displayFilenameRef = ref<string>('')
