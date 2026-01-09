import { t } from '@i18n'
import { type Ref, computed } from 'vue'

import { compatibilityMap } from '@core/compat'
import { portFormatRegister } from '@core/convert'
import { parseTTML, stringifyTTML } from '@core/convert/formats/ttml'
import { fileState as FS, simpleSaveTextFile } from '@core/file'
import { getHotkeyStr } from '@core/hotkey'

import { collectPersist } from '@states/services/port'
import { useRuntimeStore } from '@states/stores'

import { useToast } from 'primevue'
import type { MenuItem } from 'primevue/menuitem'

const to = t.titlebar.openMenu
const ts = t.titlebar.saveMenu
const tf = t.file

interface TitlebarFileLogicsState {
  openWorking: Ref<boolean>
  saveWorking: Ref<boolean>
}

export function useTitlebarFileLogics({ openWorking, saveWorking }: TitlebarFileLogicsState) {
  const toast = useToast()
  const runtimeStore = useRuntimeStore()
  const successTip = (summary: string, detail?: string) => {
    toast.add({ severity: 'success', summary, detail, life: 3000 })
  }
  const errorTip = (summary: string, detail?: string) => {
    toast.add({ severity: 'error', summary, detail, life: 3000 })
  }

  const isUserAbortError = (e: unknown) => {
    const err = e as Error
    return (
      err.message.includes('The user aborted a request') ||
      err.message.includes('is not allowed by the user agent')
    )
  }

  async function __handleOpen(fsopener: () => Promise<string>) {
    if (openWorking.value) return
    openWorking.value = true
    try {
      successTip(tf.loadFileSuccess(), await fsopener())
    } catch (e) {
      console.error(e)
      const err = e as Error
      if (isUserAbortError(err))
        errorTip(tf.failedToLoadErr.summary(), tf.failedToLoadErr.detailAborted())
      else errorTip(tf.failedToLoadErr.summary(), (e as Error).message)
    }
    openWorking.value = false
  }
  function handleOpenClick() {
    __handleOpen(FS.openFile)
  }
  function handleOpenProjClick() {
    __handleOpen(FS.openProjFile)
  }
  function handleOpenTTMLClick() {
    __handleOpen(FS.openTTMLFile)
  }

  async function handleImportFromClipboard() {
    const text = await navigator.clipboard.readText()
    if (!text) {
      errorTip(tf.clipboardIsEmptyErr())
      return
    }
    try {
      const persist = parseTTML(text)
      await FS.importPersist(persist)
      successTip(tf.pasteTTMLSuccess())
    } catch (err) {
      console.error(err)
      errorTip(tf.failedToPasteTTML(), (err as Error).message)
    }
  }
  async function handleCreateBlankProject() {
    try {
      await FS.createBlankProject()
      successTip(tf.newBlankProjectSuccess())
    } catch (e) {
      console.error(e)
      if (isUserAbortError(e))
        errorTip(tf.failedBlankProject.summary(), tf.failedBlankProject.detailAborted())
      else errorTip(tf.failedBlankProject.summary(), (e as Error).message)
    }
  }
  async function handleExportToClipboard() {
    const ttml = stringifyTTML(collectPersist())
    try {
      await navigator.clipboard.writeText(ttml)
      successTip(tf.copyTTMLSuccess())
    } catch (err) {
      console.error(err)
      errorTip(tf.failedToCopyTTML(), (err as Error).message)
    }
  }

  async function handleSaveClick() {
    if (saveWorking.value) return
    saveWorking.value = true
    try {
      successTip(tf.saveFileSuccess(), await FS.saveFile())
    } catch (e) {
      console.error(e)
      if (isUserAbortError(e))
        errorTip(tf.failedToSaveErr.summary(), tf.failedToSaveErr.detailAborted())
      else errorTip(tf.failedToSaveErr.summary(), (e as Error).message)
    }
    saveWorking.value = false
  }
  async function __handleSaveAs(savePromise: Promise<string>) {
    if (saveWorking.value) return
    saveWorking.value = true
    try {
      successTip(tf.saveAsSuccess(), await savePromise)
    } catch (e) {
      console.error(e)
      if (isUserAbortError(e))
        errorTip(tf.failedToSaveAsErr.summary(), tf.failedToSaveAsErr.detailAborted())
      else errorTip(tf.failedToSaveAsErr.summary(), (e as Error).message)
    }
    saveWorking.value = false
  }
  function handleSaveAsClick() {
    __handleSaveAs(FS.saveAsFile())
  }
  function handleSaveAsTTMLClick() {
    __handleSaveAs(FS.saveAsTTMLFile())
  }
  function handleSaveAsProjectClick() {
    __handleSaveAs(FS.saveAsProjectFile())
  }

  const openMenuItems = computed<MenuItem[]>(() => [
    {
      label: to.project(),
      icon: 'pi pi-file',
      command: handleOpenProjClick,
    },
    {
      label: to.ttml(),
      icon: 'pi pi-file',
      command: handleOpenTTMLClick,
    },
    { separator: true },
    {
      label: to.pasteTTML(),
      icon: 'pi pi-clipboard',
      command: handleImportFromClipboard,
      disabled: !compatibilityMap.clipboard,
      tip: getHotkeyStr('importFromClipboard'),
    },
    {
      label: to.importFromText(),
      icon: 'pi pi-align-left',
      command: () => (runtimeStore.dialogShown.fromText = true),
    },
    {
      label: to.importFromOtherFormats(),
      icon: 'pi pi-paperclip',
      command: () => (runtimeStore.dialogShown.fromOtherFormat = true),
    },
    { separator: true },
    {
      label: to.blank(),
      icon: 'pi pi-ban',
      command: handleCreateBlankProject,
      tip: getHotkeyStr('new'),
    },
  ])

  const saveMenuNormalSaveAs = computed<MenuItem[]>(() => [
    {
      label: ts.saveAs(),
      icon: 'pi pi-file-edit',
      command: handleSaveAsClick,
      tip: getHotkeyStr('saveAs'),
    },
  ])
  const saveMenuFallbackSaveAs = computed<MenuItem[]>(() => [
    {
      label: ts.exportToProject(),
      icon: 'pi pi-file-edit',
      command: handleSaveAsProjectClick,
    },
    {
      label: ts.exportToTTML(),
      icon: 'pi pi-file-edit',
      command: handleSaveAsTTMLClick,
    },
  ])
  const saveMenuItemsWithoutSaveAs = computed<MenuItem[]>(() => [
    {
      label: ts.copyTTML(),
      icon: 'pi pi-clipboard',
      command: handleExportToClipboard,
      disabled: !compatibilityMap.clipboard,
      tip: getHotkeyStr('exportToClipboard'),
    },
    {
      label: ts.exportToOtherFormats(),
      icon: 'pi pi-file-export',
      items: portFormatRegister.map((format) => ({
        label: format.name,
        command: () => {
          const string = format.stringifier(collectPersist())
          simpleSaveTextFile(
            string,
            FS.suggestName(),
            format.accept,
            format.name,
            'export-to-other-format',
          )
        },
        tip: format.accept.join(', '),
      })),
    },
  ])
  const saveMenuItems = computed<MenuItem[]>(() => [
    ...(compatibilityMap.fileSystem ? saveMenuNormalSaveAs.value : saveMenuFallbackSaveAs.value),
    ...saveMenuItemsWithoutSaveAs.value,
  ])
  return {
    handleSaveClick,
    handleOpenClick,
    handleSaveAsClick,
    handleCreateBlankProject,
    handleExportToClipboard,
    handleImportFromClipboard,
    openMenuItems,
    saveMenuItems,
  }
}
