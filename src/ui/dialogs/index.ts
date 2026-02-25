import type { Component } from 'vue'

import type { ValueOf } from '@utils/types'

import AboutDialog from './dialogComponents/AboutDialog.vue'
import BatchTimeShiftDialog from './dialogComponents/BatchTimeShiftDialog.vue'
import CompatibilityDialog from './dialogComponents/CompatibilityDialog.vue'
import FindReplaceDialog from './dialogComponents/FindReplaceDialog.vue'
import FromOtherFormatModal from './dialogComponents/FromOtherFormatModal.vue'
import FromTextModal from './dialogComponents/FromTextModal.vue'
import KeyBindingDialog from './dialogComponents/KeyBindingDialog.vue'

export const DialogKey = {
  BatchTimeShift: 'batchTimeShift',
  FindReplace: 'findReplace',
  KeyBinding: 'keyBinding',
  About: 'about',
  FromOtherFormat: 'fromOtherFormat',
  FromText: 'fromText',
  Compatibility: 'compatibility',
} as const
export type DialogKey = ValueOf<typeof DialogKey>

interface DialogReg {
  key: DialogKey
  component: Component
}

export const dialogRegs: DialogReg[] = [
  { key: DialogKey.BatchTimeShift, component: BatchTimeShiftDialog },
  { key: DialogKey.FindReplace, component: FindReplaceDialog },
  { key: DialogKey.KeyBinding, component: KeyBindingDialog },
  { key: DialogKey.About, component: AboutDialog },
  { key: DialogKey.FromOtherFormat, component: FromOtherFormatModal },
  { key: DialogKey.FromText, component: FromTextModal },
  { key: DialogKey.Compatibility, component: CompatibilityDialog },
]
