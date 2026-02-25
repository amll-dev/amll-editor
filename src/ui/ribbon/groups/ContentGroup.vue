<template>
  <RibbonGroup :label="tt.groupLabel()">
    <Button
      icon="pi pi-arrows-h"
      :label="tt.batchSyllabify()"
      size="small"
      :severity="
        runtimeStore.openedSidebars.includes(SidebarKey.SplitText) ? undefined : 'secondary'
      "
      @click="runtimeStore.toogleSidebar(SidebarKey.SplitText)"
      v-tooltip="tipDesc(tt.batchSyllabify(), tt.batchSyllabifyDesc(), 'batchSplitText')"
    />
    <Button
      icon="pi pi-info-circle"
      :label="tt.metadata()"
      size="small"
      :severity="
        runtimeStore.openedSidebars.includes(SidebarKey.Metadata) ? undefined : 'secondary'
      "
      @click="runtimeStore.toogleSidebar(SidebarKey.Metadata)"
      v-tooltip="tipDesc(tt.metadata(), tt.metadataDesc(), 'metadata')"
    />
    <Button
      icon="pi pi-search"
      :label="tt.findReplace()"
      size="small"
      :severity="runtimeStore.dialogShown.findReplace ? undefined : 'secondary'"
      @click="runtimeStore.dialogShown.findReplace = !runtimeStore.dialogShown.findReplace"
      v-tooltip="tipDesc(tt.findReplace(), tt.findReplaceDesc(), 'find')"
    />
  </RibbonGroup>
</template>

<script setup lang="ts">
import { t } from '@i18n'

import { useGlobalKeyboard } from '@core/hotkey'

import { useRuntimeStore } from '@states/stores'

import { tipDesc } from '@utils/generateTooltip'

import { SidebarKey } from '@ui/sidebar'

import RibbonGroup from '../RibbonGroupShell.vue'
import { Button } from 'primevue'

const tt = t.ribbon.content

const runtimeStore = useRuntimeStore()

useGlobalKeyboard('batchSplitText', () => {
  runtimeStore.toogleSidebar(SidebarKey.SplitText)
})
useGlobalKeyboard('metadata', () => {
  runtimeStore.toogleSidebar(SidebarKey.Metadata)
})
</script>
