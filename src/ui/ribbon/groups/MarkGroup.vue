<template>
  <RibbonGroup :label="tt.groupLabel()" more>
    <Button
      icon="pi pi-bookmark"
      :label="bookmarkAdd ? tt.addBookmark() : tt.removeBookmark()"
      :disabled="actionDisabled"
      size="small"
      severity="secondary"
      @click="bookmarkClick"
      v-tooltip="
        tipDesc(bookmarkAdd ? tt.addBookmark() : tt.removeBookmark(), tt.bookmarkDesc(), 'bookmark')
      "
    />
    <Button
      icon="pi pi-comment"
      :label="tt.addComment()"
      size="small"
      disabled
      severity="secondary"
    />
    <Button
      icon="pi pi-eraser"
      :label="tt.removeAll()"
      size="small"
      severity="secondary"
      @click="removeAllMarks"
      v-tooltip="tipDesc(tt.removeAll(), tt.removeAllDesc())"
    />
  </RibbonGroup>
</template>

<script setup lang="ts">
import { t } from '@i18n'
import { computed } from 'vue'

import { useGlobalKeyboard } from '@core/hotkey'

import { useCoreStore, useRuntimeStore } from '@states/stores'

import { tipDesc } from '@utils/generateTooltip'

import RibbonGroup from '../RibbonGroupShell.vue'
import { Button } from 'primevue'

const tt = t.ribbon.mark

const runtimeStore = useRuntimeStore()

const focusingSet = computed(() =>
  runtimeStore.selectedSyllables.size > 0
    ? runtimeStore.selectedSyllables
    : runtimeStore.selectedLines,
)
const bookmarkAdd = computed(
  () => actionDisabled.value || [...focusingSet.value].some((item) => !item.bookmarked),
)
function bookmarkClick() {
  if (bookmarkAdd.value) focusingSet.value.forEach((item) => (item.bookmarked = true))
  else focusingSet.value.forEach((item) => (item.bookmarked = false))
}
const actionDisabled = computed(
  () => !runtimeStore.selectedLines.size && !runtimeStore.selectedSyllables.size,
)
useGlobalKeyboard('bookmark', () => bookmarkClick())

const coreStore = useCoreStore()
function removeAllMarks() {
  coreStore.lyricLines.forEach((line) => {
    line.bookmarked = false
    line.syllables.forEach((syl) => (syl.bookmarked = false))
  })
}
</script>
